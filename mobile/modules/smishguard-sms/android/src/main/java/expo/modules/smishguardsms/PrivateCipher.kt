package expo.modules.smishguardsms

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Android Keystore key never leaves native code. No plaintext SMS on disk. */
internal object PrivateCipher {
  @Volatile private var cachedKey: SecretKey? = null
  @Synchronized private fun key(): SecretKey {
    cachedKey?.let { return it }
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val alias = "smishguard.sms.v1"
    (store.getKey(alias, null) as? SecretKey)?.let { cachedKey = it; return it }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
      init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
    }.generateKey().also { cachedKey = it }
  }
  fun encrypt(value: String, purpose: String): String {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key())
    cipher.updateAAD(purpose.toByteArray(Charsets.UTF_8))
    return Base64.encodeToString(cipher.iv + cipher.doFinal(value.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
  }
  fun decrypt(value: String, purpose: String): String {
    val bytes = Base64.decode(value, Base64.NO_WRAP)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
    cipher.updateAAD(purpose.toByteArray(Charsets.UTF_8))
    return String(cipher.doFinal(bytes.copyOfRange(12, bytes.size)), Charsets.UTF_8)
  }
}
