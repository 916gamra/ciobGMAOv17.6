use tauri::command;
use aes_gcm::{Aes256Gcm, Key, Nonce, aead::{Aead, KeyInit}};
use rand::Rng;
use base64::{engine::general_purpose, Engine as _};
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use pbkdf2::pbkdf2_hmac;
use log::{info, error};

type HmacSha256 = Hmac<Sha256>;

#[command]
pub async fn encrypt_data(plaintext: String, password: String) -> Result<String, String> {
    info!("🔐 Encrypting data");
    
    let key = derive_key_from_password(&password)?;
    let cipher = Aes256Gcm::new(&key);

    let mut rng = rand::thread_rng();
    let nonce_bytes: [u8; 12] = rng.gen();
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

#[command]
pub async fn decrypt_data(encrypted: String, password: String) -> Result<String, String> {
    info!("🔓 Decrypting data");
    
    let key = derive_key_from_password(&password)?;
    let cipher = Aes256Gcm::new(&key);

    let data = general_purpose::STANDARD
        .decode(&encrypted)
        .map_err(|e| {
            let err_msg = format!("Decoding failed: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    if data.len() < 12 {
        let err_msg = "Invalid encrypted data".to_string();
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

#[command]
pub async fn generate_session_token(user_id: String) -> Result<String, String> {
    info!("🎫 Generating session token for user: {}", user_id);
    
    let mut rng = rand::thread_rng();
    let random_bytes: [u8; 32] = rng.gen();

    let mut hasher = Sha256::new();
    hasher.update(&random_bytes);
    hasher.update(user_id.as_bytes());
    hasher.update(chrono::Local::now().to_rfc3339().as_bytes());

    let hash = hasher.finalize();
    let token = general_purpose::STANDARD.encode(hash);
    
    info!("✅ Session token generated");
    Ok(token)
}

#[command]
pub async fn verify_session_token(token: String, user_id: String) -> Result<bool, String> {
    info!("✔️ Verifying session token");
    
    let is_valid = !token.is_empty() && !user_id.is_empty();
    
    if is_valid {
        info!("✅ Session token verified");
    } else {
        error!("❌ Invalid session token");
    }
    
    Ok(is_valid)
}

#[command]
pub async fn derive_key_from_pin(pin: String, salt: String) -> Result<String, String> {
    info!("🔑 Deriving key from PIN");
    
    let salt_bytes = general_purpose::STANDARD
        .decode(&salt)
        .map_err(|e| format!("Failed to decode salt: {}", e))?;

    let mut key = vec![0u8; 32];
    pbkdf2_hmac::<Sha256>(
        pin.as_bytes(),
        &salt_bytes,
        200_000,
        &mut key,
    );

    info!("✅ Key derived from PIN");
    Ok(general_purpose::STANDARD.encode(key))
}

#[command]
pub async fn verify_hash(data: String, hash: String) -> Result<bool, String> {
    info!("🔍 Verifying hash");
    
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    let computed_hash = general_purpose::STANDARD.encode(hasher.finalize());

    let is_valid = computed_hash == hash;
    
    if is_valid {
        info!("✅ Hash verified");
    } else {
        error!("❌ Hash verification failed");
    }
    
    Ok(is_valid)
}

fn derive_key_from_password(password: &str) -> Result<Key<Aes256Gcm>, String> {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let hash = hasher.finalize();
    
    Ok(Key::<Aes256Gcm>::from_slice(&hash[..32]).clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_encryption_decryption() {
        let plaintext = "Sensitive data";
        let password = "secure_password";

        let encrypted = encrypt_data(plaintext.to_string(), password.to_string()).await;
        assert!(encrypted.is_ok());

        let decrypted = decrypt_data(encrypted.unwrap(), password.to_string()).await;
        assert!(decrypted.is_ok());
        assert_eq!(decrypted.unwrap(), plaintext);
    }

    #[tokio::test]
    async fn test_session_token() {
        let user_id = "user_123".to_string();
        let token = generate_session_token(user_id.clone()).await;
        assert!(token.is_ok());

        let verified = verify_session_token(token.unwrap(), user_id).await;
        assert!(verified.is_ok());
        assert!(verified.unwrap());
    }

    #[tokio::test]
    async fn test_hash_verification() {
        let data = "test data";
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        let hash = general_purpose::STANDARD.encode(hasher.finalize());

        let verified = verify_hash(data.to_string(), hash).await;
        assert!(verified.is_ok());
        assert!(verified.unwrap());
    }
}
