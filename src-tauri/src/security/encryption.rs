use aes_gcm::{Aes256Gcm, Nonce, aead::{Aead, KeyInit}};
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use rand::Rng;
use base64::{engine::general_purpose, Engine as _};
use zeroize::Zeroize;
use log::{info, error};

pub struct EncryptionEngine;

impl EncryptionEngine {
    /// اشتقاق مفتاح من PIN باستخدام PBKDF2
    pub fn derive_key_from_pin(pin: &str, salt: &[u8]) -> Result<Vec<u8>, String> {
        info!("🔑 Deriving key from PIN");
        
        let mut key = vec![0u8; 32];
        pbkdf2_hmac::<Sha256>(
            pin.as_bytes(),
            salt,
            200_000,  // 200k iterations
            &mut key,
        );
        
        info!("✅ Key derived from PIN");
        Ok(key)
    }

    /// توليد ملح عشوائي
    pub fn generate_salt() -> Vec<u8> {
        info!("🧂 Generating salt");
        
        let mut rng = rand::thread_rng();
        let mut salt = vec![0u8; 32];
        rng.fill(&mut salt[..]);
        
        info!("✅ Salt generated");
        salt
    }

    /// تشفير البيانات باستخدام AES-GCM
    pub fn encrypt_aes_gcm(plaintext: &str, key: &[u8]) -> Result<String, String> {
        info!("🔐 Encrypting data with AES-GCM");
        
        if key.len() != 32 {
            let err_msg = "Invalid key length: expected 32 bytes".to_string();
            error!("❌ {}", err_msg);
            return Err(err_msg);
        }

        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|e| {
                let err_msg = format!("Invalid key: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;

        let mut rng = rand::thread_rng();
        let mut nonce_bytes = [0u8; 12];
        rng.fill(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| {
                let err_msg = format!("Encryption failed: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;

        let mut result = Vec::new();
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        info!("✅ Data encrypted successfully");
        Ok(general_purpose::STANDARD.encode(result))
    }

    /// فك تشفير البيانات باستخدام AES-GCM
    pub fn decrypt_aes_gcm(encrypted: &str, key: &[u8]) -> Result<String, String> {
        info!("🔓 Decrypting data with AES-GCM");
        
        if key.len() != 32 {
            let err_msg = "Invalid key length: expected 32 bytes".to_string();
            error!("❌ {}", err_msg);
            return Err(err_msg);
        }

        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|e| {
                let err_msg = format!("Invalid key: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;

        let data = general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| {
                let err_msg = format!("Decoding failed: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;

        if data.len() < 12 {
            let err_msg = "Invalid encrypted data: too short".to_string();
            error!("❌ {}", err_msg);
            return Err(err_msg);
        }

        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| {
                let err_msg = format!("Decryption failed: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;

        info!("✅ Data decrypted successfully");
        String::from_utf8(plaintext)
            .map_err(|e| {
                let err_msg = format!("UTF-8 conversion failed: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })
    }

    /// مسح البيانات الحساسة من الذاكرة
    pub fn secure_wipe(data: &mut [u8]) {
        info!("🧹 Securely wiping sensitive data");
        data.zeroize();
        info!("✅ Data wiped");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_derivation() {
        let pin = "1234";
        let salt = EncryptionEngine::generate_salt();
        let result = EncryptionEngine::derive_key_from_pin(pin, &salt);
        
        assert!(result.is_ok());
        let key = result.unwrap();
        assert_eq!(key.len(), 32);
    }

    #[test]
    fn test_encryption_decryption() {
        let plaintext = "Sensitive data";
        let salt = EncryptionEngine::generate_salt();
        let key = EncryptionEngine::derive_key_from_pin("1234", &salt).unwrap();

        let encrypted = EncryptionEngine::encrypt_aes_gcm(plaintext, &key);
        assert!(encrypted.is_ok());

        let decrypted = EncryptionEngine::decrypt_aes_gcm(&encrypted.unwrap(), &key);
        assert!(decrypted.is_ok());
        assert_eq!(decrypted.unwrap(), plaintext);
    }

    #[test]
    fn test_salt_generation() {
        let salt1 = EncryptionEngine::generate_salt();
        let salt2 = EncryptionEngine::generate_salt();
        
        assert_eq!(salt1.len(), 32);
        assert_eq!(salt2.len(), 32);
        assert_ne!(salt1, salt2);
    }
}
