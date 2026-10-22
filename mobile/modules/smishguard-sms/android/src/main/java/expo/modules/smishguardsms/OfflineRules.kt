package expo.modules.smishguardsms

/** Deterministic offline observations, deliberately NOT a trained ML verdict. */
internal object OfflineRules {
  data class Finding(val risk: String, val reasons: List<String>)
  fun inspect(text: String): Finding {
    val reasons = mutableListOf<String>()
    val link = Regex("(?i)(https?://|www\\.)[^\\s<>]+|\\b[a-z0-9-]+\\.(com|net|org|xyz|top|info)/").containsMatchIn(text)
    val urgent = Regex("(?i)\\b(urgent|immediately|suspended|blocked|expires|final notice|act now)\\b").containsMatchIn(text)
    val secret = Regex("(?i)\\b(password|otp|pin|verification code|bank details|card number)\\b").containsMatchIn(text)
    val money = Regex("(?i)\\b(payment|prize|claim|winner|refund|fee|verify|account)\\b").containsMatchIn(text)
    if (link) reasons.add("Contains a link; its destination has not been verified.")
    if (urgent) reasons.add("Uses urgency or threatens loss of access.")
    if (secret) reasons.add("Mentions credentials or sensitive financial information.")
    if (money) reasons.add("Mentions money, account access, or verification; context matters.")
    val high = link && (secret || urgent || money) || urgent && secret
    return Finding(if (high) "high" else if (reasons.isNotEmpty()) "review" else "low", reasons)
  }
  fun sensitiveCode(text: String) = Regex("(?i)\\b(otp|one[- ]time|verification code|security code|passcode)\\b").containsMatchIn(text)
}
