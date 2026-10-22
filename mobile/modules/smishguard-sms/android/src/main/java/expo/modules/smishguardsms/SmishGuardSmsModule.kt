package expo.modules.smishguardsms

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.Exceptions

class SmishGuardSmsModule : Module() {
  private fun context() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  override fun definition() = ModuleDefinition {
    Name("SmishGuardSms")
    AsyncFunction("profile") {
      SmsRepository(context()).use { repo ->
        val value = repo.prefs.getString("profile", null)
        val data = if (value == null) org.json.JSONObject() else org.json.JSONObject(PrivateCipher.decrypt(value, "profile:v1"))
        mapOf("name" to data.optString("name", ""), "phone" to data.optString("phone", ""))
      }
    }
    AsyncFunction("saveProfile") { name: String, phone: String ->
      require(SmsPolicy.validProfile(name, phone)) { "Use a name up to 60 characters and an international phone number, such as +923001234567" }
      SmsRepository(context()).use { repo ->
        val data = org.json.JSONObject().put("name", name.trim()).put("phone", phone)
        repo.prefs.edit().putString("profile", PrivateCipher.encrypt(data.toString(), "profile:v1")).commit()
      }
    }
    AsyncFunction("deleteProfile") { SmsRepository(context()).use { it.prefs.edit().remove("profile").commit() } }
    AsyncFunction("suggestPhoneNumber") {
      if (android.os.Build.VERSION.SDK_INT < 26 || context().checkSelfPermission(android.Manifest.permission.READ_PHONE_NUMBERS) != android.content.pm.PackageManager.PERMISSION_GRANTED) ""
      else try {
        if (android.os.Build.VERSION.SDK_INT >= 33) {
          val subscription = android.telephony.SubscriptionManager.getDefaultSmsSubscriptionId()
          if (android.telephony.SubscriptionManager.isValidSubscriptionId(subscription)) context().getSystemService(android.telephony.SubscriptionManager::class.java).getPhoneNumber(subscription).take(64) else ""
        } else {
          @Suppress("DEPRECATION")
          val number = context().getSystemService(android.telephony.TelephonyManager::class.java).line1Number
          number?.take(64) ?: ""
        }
      } catch (_: Exception) { "" }
    }
    AsyncFunction("status") { SmsRepository(context()).use { it.summary() } }
    AsyncFunction("configure") { endpoint: String, cloud: Boolean ->
      SmsRepository(context()).use { repo ->
        if (endpoint.isNotBlank()) ModelHttp(context(), endpoint)
        if (!repo.prefs.contains("enabled_at")) repo.prefs.edit().putLong("enabled_at", System.currentTimeMillis()).commit()
        if (repo.prefs.getString("endpoint", "") != endpoint) repo.prefs.edit().remove("credential").remove("retry_after").commit()
        repo.prefs.edit().putString("endpoint", endpoint).putBoolean("enabled", true).commit()
        repo.setCloud(cloud)
        SmsJobs.start(context())
        repo.summary()
      }
    }
    AsyncFunction("refresh") { older: Boolean ->
      SmsRepository(context()).use { it.importInbox(older); SmsJobs.sync(context()); it.summary() }
    }
    AsyncFunction("threads") { SmsRepository(context()).use { it.threads() } }
    AsyncFunction("messages") { thread: String -> SmsRepository(context()).use { it.messages(thread.ifBlank { null }) } }
    AsyncFunction("manual") { text: String ->
      require(text.isNotBlank() && text.length <= 5000)
      SmsRepository(context()).use { repo ->
        repo.ingest("Pasted message", text, System.currentTimeMillis(), "manual") ?: throw IllegalStateException("Enable SMS protection first")
        SmsJobs.sync(context()); repo.hash("pasted message")
      }
    }
    AsyncFunction("pauseUploads") { SmsRepository(context()).use { it.setCloud(false) } }
    AsyncFunction("stop") { SmsRepository(context()).use { it.prefs.edit().putBoolean("enabled", false).commit(); it.setCloud(false) }; SmsJobs.stop(context()) }
    AsyncFunction("deleteMessage") { id: String -> SmsRepository(context()).use { it.delete(id) } }
    AsyncFunction("clear") { SmsRepository(context()).use { it.clear() } }
  }
}
