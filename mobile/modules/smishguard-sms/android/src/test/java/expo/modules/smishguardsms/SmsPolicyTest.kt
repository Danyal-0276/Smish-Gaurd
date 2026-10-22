package expo.modules.smishguardsms

import org.junit.Assert.*
import org.junit.Test

class SmsPolicyTest {
  @Test fun profileIsOptionalAndNeverTreatsArbitraryInputAsAVerifiedIdentity() {
    assertTrue(SmsPolicy.validProfile("", ""))
    assertTrue(SmsPolicy.validProfile("Danyal", "+923001234567"))
    assertFalse(SmsPolicy.validProfile("x".repeat(61), "+923001234567"))
    assertFalse(SmsPolicy.validProfile("Name", "03 not a number"))
    assertFalse(SmsPolicy.validProfile("Name", "+0123456789"))
  }
  @Test fun linkAloneDoesNotProvePhishing() {
    assertEquals("review", OfflineRules.inspect("Read the notes at https://university.example/notes").risk)
    assertEquals("low", OfflineRules.inspect("Meet me at the library after lunch").risk)
  }
  @Test fun credentialAndUrgencyCombinationWarnsOffline() {
    val result = OfflineRules.inspect("URGENT: your account is suspended. Enter password at https://example.invalid")
    assertEquals("high", result.risk)
    assertTrue(result.reasons.size >= 3)
  }
  @Test fun otpMessagesStayLocal() {
    listOf("Your OTP is 123456", "Your verification code is 556677", "One-time code: 333444", "Security code 345678").forEach { assertTrue(OfflineRules.sensitiveCode(it)) }
    assertFalse(OfflineRules.sensitiveCode("See you tomorrow"))
  }
  @Test fun productionRejectsCleartextAndCredentialBearingEndpoints() {
    assertFalse(SmsPolicy.validEndpoint("http://127.0.0.1:8000", false))
    assertTrue(SmsPolicy.validEndpoint("http://127.0.0.1:8000", true))
    assertFalse(SmsPolicy.validEndpoint("http://192.168.1.2:8000", true))
    assertFalse(SmsPolicy.validEndpoint("https://secret@example.org", false))
    assertFalse(SmsPolicy.validEndpoint("https://example.org/other", false))
    assertFalse(SmsPolicy.validEndpoint("https://example.org?token=secret", false))
    assertTrue(SmsPolicy.validEndpoint("https://api.example.org", false))
  }
  @Test fun retryAfterCannotProduceUnboundedOrImmediateBusyLoops() {
    assertEquals(60L, SmsPolicy.retrySeconds("invalid"))
    assertEquals(30L, SmsPolicy.retrySeconds("-100"))
    assertEquals(86400L, SmsPolicy.retrySeconds("9999999"))
  }
}
