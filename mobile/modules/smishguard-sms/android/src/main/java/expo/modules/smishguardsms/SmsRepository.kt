package expo.modules.smishguardsms

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.util.UUID

internal class SmsRepository(val context: Context) : SQLiteOpenHelper(context, "smishguard-sms.db", null, 2) {
  val prefs = context.getSharedPreferences("smishguard.sms.settings", Context.MODE_PRIVATE)
  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE messages (id TEXT PRIMARY KEY, provider_id TEXT UNIQUE, thread_key TEXT NOT NULL, sender TEXT NOT NULL, body TEXT NOT NULL, received INTEGER NOT NULL, imported INTEGER NOT NULL, source TEXT NOT NULL, local_risk TEXT NOT NULL, reasons TEXT NOT NULL, state TEXT NOT NULL, report TEXT, model_risk TEXT, checked INTEGER NOT NULL DEFAULT 0, retry_at INTEGER NOT NULL DEFAULT 0)")
    db.execSQL("CREATE INDEX queue_index ON messages(state,retry_at,received)")
    db.execSQL("CREATE INDEX thread_index ON messages(thread_key,received)")
    db.execSQL("CREATE TABLE dismissed (provider_id TEXT PRIMARY KEY, expires INTEGER NOT NULL)")
  }
  companion object { private val ingestionLock = Any() }
  override fun onUpgrade(db: SQLiteDatabase, old: Int, new: Int) {
    if (old < 2) {
      val columns = mutableSetOf<String>()
      db.rawQuery("PRAGMA table_info(messages)", null).use { c -> while (c.moveToNext()) columns.add(c.getString(1)) }
      if ("model_risk" !in columns) db.execSQL("ALTER TABLE messages ADD COLUMN model_risk TEXT")
      if ("checked" !in columns) db.execSQL("ALTER TABLE messages ADD COLUMN checked INTEGER NOT NULL DEFAULT 0")
    }
  }
  fun allowed(permission: String) = context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED
  fun enabled() = prefs.getBoolean("enabled", false)
  fun cloud() = enabled() && prefs.getBoolean("cloud", false) && allowed(Manifest.permission.READ_SMS)
  fun hash(value: String) = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
  fun prune() {
    val cutoff = System.currentTimeMillis() - 30L * 86400000
    writableDatabase.execSQL("INSERT OR REPLACE INTO dismissed SELECT provider_id,? FROM messages WHERE imported < ? AND provider_id IS NOT NULL", arrayOf(System.currentTimeMillis() + 30L * 86400000, cutoff))
    writableDatabase.delete("messages", "imported < ?", arrayOf(cutoff.toString()))
    writableDatabase.delete("dismissed", "expires < ?", arrayOf(System.currentTimeMillis().toString()))
    writableDatabase.execSQL("DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY received DESC LIMIT -1 OFFSET 5000)")
  }
  /** Same sender/body near the broadcast timestamp reconciles multipart inbox delivery. */
  fun ingest(senderValue: String, bodyValue: String, received: Long, source: String, providerId: String? = null): String? {
    synchronized(ingestionLock) {
    if (!enabled() || !allowed(Manifest.permission.READ_SMS)) return null
    val body = bodyValue.take(5000)
    if (body.isBlank()) return null
    val sender = senderValue.take(256)
    val thread = hash(sender.trim().lowercase())
    if (providerId != null) {
      readableDatabase.rawQuery("SELECT 1 FROM dismissed WHERE provider_id=?", arrayOf(providerId)).use { if (it.moveToFirst()) return null }
      readableDatabase.rawQuery("SELECT id FROM messages WHERE provider_id=?", arrayOf(providerId)).use { if (it.moveToFirst()) return it.getString(0) }
    }
    readableDatabase.rawQuery("SELECT id, body, provider_id FROM messages WHERE thread_key=? AND received BETWEEN ? AND ?", arrayOf(thread, (received - 3000).toString(), (received + 3000).toString())).use { c ->
      while (c.moveToNext()) {
        val id = c.getString(0)
        if ((providerId == null || c.isNull(2)) && PrivateCipher.decrypt(c.getString(1), "body:$id") == body) {
          if (providerId != null) writableDatabase.update("messages", ContentValues().apply { put("provider_id", providerId) }, "id=?", arrayOf(id))
          return id
        }
      }
    }
    val id = UUID.randomUUID().toString()
    val finding = OfflineRules.inspect(body)
    // OTP/code messages never leave the device. They still get offline observations.
    val state = if (OfflineRules.sensitiveCode(body)) "local_only" else if (cloud()) "pending" else "paused"
    writableDatabase.insertOrThrow("messages", null, ContentValues().apply {
      put("id", id); put("provider_id", providerId); put("thread_key", thread)
      put("sender", PrivateCipher.encrypt(sender, "sender:$id")); put("body", PrivateCipher.encrypt(body, "body:$id"))
      put("received", received); put("imported", System.currentTimeMillis()); put("source", source)
      put("local_risk", finding.risk); put("reasons", JSONArray(finding.reasons).toString()); put("state", state)
    })
    if (source == "incoming" && finding.risk == "high") SmsNotifications.warning(context, id, false)
    return id
    }
  }
  /** Keyset paging, newest first. Never query contacts, sent SMS, SIM or subscription IDs. */
  fun importInbox(older: Boolean = false): Int {
    if (!enabled() || !allowed(Manifest.permission.READ_SMS)) return 0
    prune()
    if (older && android.database.DatabaseUtils.queryNumEntries(readableDatabase, "messages") >= 5000) return 0
    val incremental = !older && prefs.contains("oldest_date")
    var newestId = prefs.getLong("newest_id", 0)
    if (!older && !incremental) context.contentResolver.query(Telephony.Sms.Inbox.CONTENT_URI, arrayOf("_id"), null, null, "_id DESC")?.use { if (it.moveToFirst()) newestId = it.getLong(0) }
    val boundary = if (older) prefs.getLong("oldest_date", Long.MAX_VALUE) else Long.MAX_VALUE
    val boundaryId = if (older) prefs.getLong("oldest_id", Long.MAX_VALUE) else Long.MAX_VALUE
    var added = 0
    var lastDate = boundary
    var lastId = boundaryId
    val projection = arrayOf("_id", "address", "body", "date")
    val selection = if (incremental) "_id > ?" else "date < ? OR (date = ? AND _id < ?)"
    val arguments = if (incremental) arrayOf(newestId.toString()) else arrayOf(boundary.toString(), boundary.toString(), boundaryId.toString())
    context.contentResolver.query(Telephony.Sms.Inbox.CONTENT_URI, projection, selection,
      arguments, if (incremental) "_id ASC" else "date DESC, _id DESC")?.use { c ->
      var count = 0
      while (c.moveToNext() && count++ < 200 && enabled() && allowed(Manifest.permission.READ_SMS)) {
        lastId = c.getLong(0); lastDate = c.getLong(3)
        if (incremental) newestId = maxOf(newestId, lastId)
        val before = android.database.DatabaseUtils.queryNumEntries(readableDatabase, "messages")
        val origin = if (lastDate >= prefs.getLong("enabled_at", Long.MAX_VALUE)) "incoming" else "existing"
        ingest(c.getString(1) ?: "Unknown sender", c.getString(2) ?: "", lastDate, origin, lastId.toString())
        if (android.database.DatabaseUtils.queryNumEntries(readableDatabase, "messages") > before) added++
      }
      if (older || !prefs.contains("oldest_date")) prefs.edit().putBoolean("has_older", count > 200).apply()
    }
    if (older || !prefs.contains("oldest_date")) prefs.edit().putLong("oldest_date", lastDate).putLong("oldest_id", lastId).apply()
    if (!older) prefs.edit().putLong("newest_id", newestId).apply()
    return added
  }
  fun summary(): Map<String, Any> {
    prune()
    val counts = mutableMapOf<String, Any>("total" to 0, "pending" to 0, "completed" to 0, "flagged" to 0)
    readableDatabase.rawQuery("SELECT COUNT(*), COALESCE(SUM(state='pending'),0), COALESCE(SUM(state='completed'),0), COALESCE(SUM(local_risk='high'),0) FROM messages", null).use { c ->
      c.moveToFirst(); listOf("total", "pending", "completed", "flagged").forEachIndexed { i, k -> counts[k] = c.getInt(i) }
    }
    counts["enabled"] = enabled(); counts["cloud"] = cloud()
    counts["smsGranted"] = allowed(Manifest.permission.READ_SMS)
    counts["receiveGranted"] = allowed(Manifest.permission.RECEIVE_SMS)
    counts["notificationsGranted"] = android.os.Build.VERSION.SDK_INT < 33 || allowed(Manifest.permission.POST_NOTIFICATIONS)
    counts["hasOlder"] = prefs.getBoolean("has_older", true) && (counts["total"] as Int) < 5000
    counts["connection"] = prefs.getString("connection", "Waiting for connection") ?: "Waiting for connection"
    readableDatabase.rawQuery("SELECT COALESCE(SUM(model_risk='high'),0),COALESCE(SUM(model_risk='review'),0),COALESCE(SUM(model_risk='low'),0) FROM messages WHERE state='completed'", null).use { c ->
      c.moveToFirst(); listOf("modelHigh", "modelReview", "modelLow").forEachIndexed { i,k -> counts[k] = c.getInt(i) }
    }
    val days = mutableListOf<Map<String, Any>>()
    for (offset in 6 downTo 0) {
      val day = java.util.Calendar.getInstance().apply { set(java.util.Calendar.HOUR_OF_DAY, 0); set(java.util.Calendar.MINUTE, 0); set(java.util.Calendar.SECOND, 0); set(java.util.Calendar.MILLISECOND, 0); add(java.util.Calendar.DAY_OF_YEAR, -offset) }
      val start = day.timeInMillis
      val label = java.text.SimpleDateFormat("EEE", java.util.Locale.getDefault()).format(day.time)
      day.add(java.util.Calendar.DAY_OF_YEAR, 1)
      val total = android.database.DatabaseUtils.queryNumEntries(readableDatabase, "messages", "state='completed' AND checked>=? AND checked<?", arrayOf(start.toString(), day.timeInMillis.toString()))
      days.add(mapOf<String, Any>("day" to label, "count" to total.toInt()))
    }
    counts["days"] = days
    return counts
  }
  fun threads(): List<Map<String, Any>> {
    if (!allowed(Manifest.permission.READ_SMS)) return emptyList()
    val rows = mutableListOf<Map<String, Any>>()
    readableDatabase.rawQuery("SELECT m.id,m.thread_key,m.sender,MAX(m.received),COUNT(*),SUM(m.state='pending') FROM messages m GROUP BY m.thread_key ORDER BY MAX(m.received) DESC LIMIT 300", null).use { c ->
      while (c.moveToNext()) rows.add(mapOf("id" to c.getString(1), "sender" to PrivateCipher.decrypt(c.getString(2), "sender:${c.getString(0)}"), "received" to c.getLong(3).toDouble(), "count" to c.getInt(4), "pending" to c.getInt(5)))
    }
    return rows
  }
  fun messages(thread: String?, limit: Int = 200): List<Map<String, Any?>> {
    if (!allowed(Manifest.permission.READ_SMS)) throw SecurityException("SMS permission is required to view local message copies")
    val rows = mutableListOf<Map<String, Any?>>()
    readableDatabase.query("messages", null, if (thread != null) "thread_key=?" else null, thread?.let { arrayOf(it) }, null, null, "received DESC", limit.toString()).use { c ->
      while (c.moveToNext()) rows.add(row(c))
    }
    return rows
  }
  private fun row(c: Cursor): Map<String, Any?> {
    fun s(name: String) = c.getString(c.getColumnIndexOrThrow(name))
    val id = s("id")
    return mapOf("id" to id, "thread" to s("thread_key"), "sender" to PrivateCipher.decrypt(s("sender"), "sender:$id"),
      "text" to PrivateCipher.decrypt(s("body"), "body:$id"), "received" to c.getLong(c.getColumnIndexOrThrow("received")).toDouble(),
      "source" to s("source"), "localRisk" to s("local_risk"), "reasons" to s("reasons"), "state" to s("state"), "report" to s("report"))
  }
  fun pending(): Map<String, Any?>? = readableDatabase.rawQuery("SELECT * FROM messages WHERE state='pending' AND retry_at <= ? ORDER BY CASE source WHEN 'incoming' THEN 0 WHEN 'manual' THEN 1 ELSE 2 END,received DESC LIMIT 1", arrayOf(System.currentTimeMillis().toString())).use { if (it.moveToFirst()) row(it) else null }
  @Synchronized fun setCloud(value: Boolean) {
    prefs.edit().putBoolean("cloud", value).putString("connection", if (value) "Waiting for model connection" else "Offline checks active · uploads paused").commit()
    writableDatabase.execSQL(if (value) "UPDATE messages SET state='pending' WHERE state='paused'" else "UPDATE messages SET state='paused' WHERE state='pending'")
  }
  @Synchronized fun delete(id: String) {
    writableDatabase.execSQL("INSERT OR REPLACE INTO dismissed SELECT provider_id,? FROM messages WHERE id=? AND provider_id IS NOT NULL", arrayOf(System.currentTimeMillis() + 30L * 86400000, id))
    writableDatabase.delete("messages", "id=?", arrayOf(id))
    context.getSystemService(android.app.NotificationManager::class.java).cancel(id.hashCode())
  }
  @Synchronized fun clear() {
    writableDatabase.execSQL("INSERT OR REPLACE INTO dismissed SELECT provider_id,? FROM messages WHERE provider_id IS NOT NULL", arrayOf(System.currentTimeMillis() + 30L * 86400000))
    writableDatabase.delete("messages", null, null)
    context.getSystemService(android.app.NotificationManager::class.java).cancelAll()
  }
}
