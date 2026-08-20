use log::{info, error};

#[cfg(target_os = "windows")]
use windows::{
    Win32::Security::Cryptography::*,
    Win32::Foundation::*,
};

pub struct DPAPIEngine;

#[cfg(target_os = "windows")]
impl DPAPIEngine {
    /// تشفير البيانات باستخدام DPAPI
    pub fn encrypt_data(plaintext: &str) -> Result<Vec<u8>, String> {
        info!("🔐 Encrypting data with DPAPI");
        
        unsafe {
            let mut data_blob = CRYPT_INTEGER_BLOB {
                cbData: plaintext.len() as u32,
                pbData: plaintext.as_ptr() as *mut u8,
            };

            let mut encrypted_blob = CRYPT_INTEGER_BLOB {
                cbData: 0,
                pbData: std::ptr::null_mut(),
            };

            let result = CryptProtectData(
                &mut data_blob,
                None,
                None,
                None,
                None,
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut encrypted_blob,
            );

            if result.as_bool() {
                let encrypted_data = std::slice::from_raw_parts(
                    encrypted_blob.pbData,
                    encrypted_blob.cbData as usize,
                ).to_vec();

                info!("✅ Data encrypted with DPAPI");
                Ok(encrypted_data)
            } else {
                let err_msg = "DPAPI encryption failed".to_string();
                error!("❌ {}", err_msg);
                Err(err_msg)
            }
        }
    }

    /// فك تشفير البيانات باستخدام DPAPI
    pub fn decrypt_data(encrypted_data: &[u8]) -> Result<String, String> {
        info!("🔓 Decrypting data with DPAPI");
        
        unsafe {
            let mut encrypted_blob = CRYPT_INTEGER_BLOB {
                cbData: encrypted_data.len() as u32,
                pbData: encrypted_data.as_ptr() as *mut u8,
            };

            let mut decrypted_blob = CRYPT_INTEGER_BLOB {
                cbData: 0,
                pbData: std::ptr::null_mut(),
            };

            let result = CryptUnprotectData(
                &mut encrypted_blob,
                None,
                None,
                None,
                None,
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut decrypted_blob,
            );

            if result.as_bool() {
                let decrypted_data = std::slice::from_raw_parts(
                    decrypted_blob.pbData,
                    decrypted_blob.cbData as usize,
                );

                let plaintext = String::from_utf8_lossy(decrypted_data).to_string();
                info!("✅ Data decrypted with DPAPI");
                Ok(plaintext)
            } else {
                let err_msg = "DPAPI decryption failed".to_string();
                error!("❌ {}", err_msg);
                Err(err_msg)
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
impl DPAPIEngine {
    pub fn encrypt_data(_plaintext: &str) -> Result<Vec<u8>, String> {
        error!("❌ DPAPI is only available on Windows");
        Err("DPAPI is only available on Windows".to_string())
    }

    pub fn decrypt_data(_encrypted_data: &[u8]) -> Result<String, String> {
        error!("❌ DPAPI is only available on Windows");
        Err("DPAPI is only available on Windows".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(target_os = "windows")]
    fn test_dpapi_encryption_decryption() {
        let plaintext = "Sensitive data";
        
        let encrypted = DPAPIEngine::encrypt_data(plaintext);
        assert!(encrypted.is_ok());

        let decrypted = DPAPIEngine::decrypt_data(&encrypted.unwrap());
        assert!(decrypted.is_ok());
        assert_eq!(decrypted.unwrap(), plaintext);
    }
}
