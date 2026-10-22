package expo.modules.smishguardsms

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.provider.Telephony
import androidx.work.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

internal object SmsNotifications {
  fun warning(context: Context, id: String, model: Boolean) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel("sms-risk", "SMS safety warnings", NotificationManager.IMPORTANCE_HIGH).apply { lockscreenVisibility = Notification.VISIBILITY_PRIVATE })
    if (!manager.areNotificationsEnabled()) return
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    val tap = PendingIntent.getActivity(context, id.hashCode(), launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val notification = Notification.Builder(context, "sms-risk")
      .setSmallIcon(android.R.drawable.ic_dialog_alert)
      .setContentTitle(if (model) "SMS model report ready" else "SMS needs a closer look")
      .setContentText(if (model) "A model check flagged a message. Open SmishGuard to review." else "Offline checks found warning signs. Open SmishGuard to review.")
      .setVisibility(Notification.VISIBILITY_PRIVATE).setContentIntent(tap).setOnlyAlertOnce(true).setAutoCancel(true).build()
    try { manager.notify(if (model) 1307 else id.hashCode(), notification) } catch (_: SecurityException) { /* Permission can change mid-delivery. */ }
  }
}

internal object SmsJobs {
  private fun constraints() = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
  fun start(context: Context) {
    val work = WorkManager.getInstance(context)
    work.enqueueUniquePeriodicWork("sg-inbox", ExistingPeriodicWorkPolicy.KEEP,
      PeriodicWorkRequestBuilder<InboxWorker>(15, TimeUnit.MINUTES).build())
    work.enqueueUniquePeriodicWork("sg-model-periodic", ExistingPeriodicWorkPolicy.KEEP,
      PeriodicWorkRequestBuilder<ModelWorker>(15, TimeUnit.MINUTES).setConstraints(constraints()).build())
    sync(context)
  }
  fun sync(context: Context) {
    WorkManager.getInstance(context).enqueueUniqueWork("sg-model-now", ExistingWorkPolicy.KEEP,
      OneTimeWorkRequestBuilder<ModelWorker>().setConstraints(constraints()).setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS).build())
  }
  fun stop(context: Context) {
    val work = WorkManager.getInstance(context)
    listOf("sg-inbox", "sg-model-periodic", "sg-model-now").forEach { work.cancelUniqueWork(it) }
  }
}

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val pending = goAsync()
    executor.execute {
      try {
        SmsRepository(context).use { repo ->
          if (repo.enabled() && repo.allowed(android.Manifest.permission.RECEIVE_SMS)) {
            val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (parts.isNotEmpty()) repo.ingest(parts[0].originatingAddress ?: "Unknown sender", parts.joinToString("") { it.messageBody ?: "" }, parts[0].timestampMillis, "incoming")
            repo.prune()
            SmsJobs.sync(context)
          }
        }
      } catch (_: Exception) { /* No SMS, addresses or exception messages in logs. Inbox reconciliation retries later. */ }
      finally { pending.finish() }
    }
  }
  companion object { private val executor = Executors.newSingleThreadExecutor() }
}

class InboxWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result = try {
    SmsRepository(applicationContext).use { if (it.enabled()) { it.importInbox(); SmsJobs.sync(applicationContext) } }
    Result.success()
  } catch (_: SecurityException) { Result.success() } catch (_: Exception) { Result.retry() }
}

internal data class HttpResult(val code: Int, val data: JSONObject, val retry: Long)
internal class ModelHttp(private val context: Context, private val base: String) {
  init {
    val debug = context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
    require(SmsPolicy.validEndpoint(base, debug)) { "Invalid model endpoint" }
  }
  fun post(path: String, data: JSONObject, token: String? = null): HttpResult {
    val c = URL(base.trimEnd('/') + "/api/v1/" + path).openConnection() as HttpURLConnection
    try {
      c.requestMethod = "POST"; c.connectTimeout = 12000; c.readTimeout = 12000; c.instanceFollowRedirects = false
      c.useCaches = false; c.doOutput = true; c.setRequestProperty("Content-Type", "application/json")
      if (token != null) c.setRequestProperty("Authorization", "Bearer $token")
      c.outputStream.use { it.write(data.toString().toByteArray(Charsets.UTF_8)) }
      val code = c.responseCode
      val retry = SmsPolicy.retrySeconds(c.getHeaderField("Retry-After"))
      if (code !in 200..299) return HttpResult(code, JSONObject(), retry)
      val bytes = c.inputStream.use { input ->
        val output = java.io.ByteArrayOutputStream()
        val buffer = ByteArray(4096)
        while (output.size() <= 65536) {
          val count = input.read(buffer, 0, minOf(buffer.size, 65537 - output.size()))
          if (count < 0) break
          output.write(buffer, 0, count)
        }
        output.toByteArray()
      }
      require(bytes.size <= 65536)
      return HttpResult(code, JSONObject(String(bytes, Charsets.UTF_8)), retry)
    } finally { c.disconnect() }
  }
}

class ModelWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    if (!running.compareAndSet(false, true)) return Result.retry()
    try {
      SmsRepository(applicationContext).use { repo ->
        repo.prune()
        if (!repo.cloud() || isStopped) return Result.success()
        if (repo.prefs.getLong("retry_after", 0) > System.currentTimeMillis()) return Result.retry()
        val base = repo.prefs.getString("endpoint", "") ?: ""
        if (base.isBlank()) { connection(repo, "Backend address is not configured"); return Result.success() }
        val http = ModelHttp(applicationContext, base)
        var token = repo.prefs.getString("credential", null)?.let { PrivateCipher.decrypt(it, "credential:$base") }
        if (token == null) {
          if (!repo.cloud()) return Result.success()
          val register = http.post("installations", JSONObject().put("app_version", "0.2.0").put("consent_version", "2026-10-23").put("cloud_analysis_consent", true))
          if (register.code != 201) { wait(repo, register); return Result.retry() }
          token = register.data.getString("credential")
          require(Regex("sg1\\.[0-9a-f-]{36}\\.[A-Za-z0-9_-]{43}").matches(token))
          repo.prefs.edit().putString("credential", PrivateCipher.encrypt(token, "credential:$base")).commit()
        }
        repeat(8) {
          if (!repo.cloud() || isStopped) return Result.success()
          val row = repo.pending() ?: run { connection(repo, "Up to date"); return Result.success() }
          val id = row["id"] as String
          val response = http.post("analyses", JSONObject().put("text", row["text"]).put("cloud_analysis_consent", true), token)
          if (!repo.cloud() || isStopped) return Result.success()
          if (response.code == 401) {
            repo.prefs.edit().remove("credential").apply()
            repo.setCloud(false)
            connection(repo, "Connection expired or revoked · reopen protection setup")
            return Result.success()
          }
          if (response.code !in 200..299) {
            wait(repo, response)
            if (response.code == 400 || response.code == 413) {
              repo.writableDatabase.execSQL("UPDATE messages SET state='unsupported' WHERE id=? AND state='pending'", arrayOf(id))
            }
            return Result.retry()
          }
          val data = response.data
          val unsupported = data.optString("status") == "unsupported"
          require(unsupported || (data.optString("status") == "completed" && data.optString("mode") == "backend_model" &&
            data.optString("risk") in listOf("low", "review", "high") && data.optString("model_version").isNotBlank() &&
            data.optJSONArray("indicators") != null && data.optJSONArray("domains") != null))
          // Keep a strict response allowlist: server cannot add raw message fields to disk.
          val report = JSONObject()
          listOf("status", "mode", "risk", "model_version", "policy_version", "coverage", "indicators", "domains", "advice", "request_id").forEach { key -> if (data.has(key)) report.put(key, data.get(key)) }
          val values = android.content.ContentValues().apply { put("state", if (unsupported) "unsupported" else "completed"); put("report", report.toString()); put("checked", System.currentTimeMillis()); if (!unsupported) put("model_risk", data.getString("risk")) }
          val updated = repo.writableDatabase.update("messages", values, "id=? AND state='pending'", arrayOf(id))
          if (updated > 0 && !unsupported && data.optString("risk") == "high") SmsNotifications.warning(applicationContext, id, true)
          connection(repo, "Connected · model reports updating")
        }
        // Bounded batches and WorkManager backoff avoid overwhelming protected APIs.
        return if (repo.pending() != null) Result.retry() else Result.success()
      }
    } catch (_: Exception) {
      SmsRepository(applicationContext).use { connection(it, "Waiting for backend · offline reports available") }
      return Result.retry()
    } finally { running.set(false) }
  }
  private fun connection(repo: SmsRepository, value: String) { repo.prefs.edit().putString("connection", value).apply() }
  private fun wait(repo: SmsRepository, response: HttpResult) {
    repo.prefs.edit().putLong("retry_after", System.currentTimeMillis() + response.retry * 1000).apply()
    connection(repo, if (response.code == 429) "Service limit reached · queued for later" else "Backend unavailable · queued for later")
  }
  companion object { private val running = AtomicBoolean(false) }
}
