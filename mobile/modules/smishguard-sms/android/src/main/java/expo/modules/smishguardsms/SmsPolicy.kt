package expo.modules.smishguardsms

import java.net.URI

internal object SmsPolicy {
  fun validProfile(name: String, phone: String) = name.length <= 60 && name.none { it.isISOControl() } && (phone.isEmpty() || Regex("\\+[1-9][0-9]{6,14}").matches(phone))
  fun validEndpoint(base: String, debug: Boolean): Boolean = try {
    val uri = URI(base)
    val local = uri.host in listOf("localhost", "127.0.0.1", "10.0.2.2")
    uri.userInfo == null && uri.query == null && uri.fragment == null && uri.path in listOf("", "/") && uri.host != null &&
      (uri.scheme == "https" || debug && local && uri.scheme == "http")
  } catch (_: Exception) { false }
  fun retrySeconds(header: String?) = header?.toLongOrNull()?.coerceIn(30, 86400) ?: 60L
}
