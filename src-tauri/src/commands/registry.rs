use tauri::command;
use winreg::RegKey;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use log::{info, error};

const REGISTRY_BASE: &str = r"Software\BDR Systems\BDR Nexus";

#[command]
pub async fn read_registry(key: String, value: String) -> Result<String, String> {
    info!("📖 Reading registry: {} -> {}", key, value);
    
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let full_path = format!("{}{}", REGISTRY_BASE, key);
    
    let reg_key = hkcu
        .open_subkey(&full_path)
        .map_err(|e| {
            let err_msg = format!("Failed to open registry key: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    let val: String = reg_key
        .get_value(&value)
        .map_err(|e| {
            let err_msg = format!("Failed to read registry value: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Registry value read successfully");
    Ok(val)
}

#[command]
pub async fn write_registry(key: String, value: String, data: String) -> Result<(), String> {
    info!("✍️ Writing registry: {} -> {} = {}", key, value, data);
    
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let full_path = format!("{}{}", REGISTRY_BASE, key);
    
    let (reg_key, _) = hkcu
        .create_subkey(&full_path)
        .map_err(|e| {
            let err_msg = format!("Failed to create registry key: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    reg_key
        .set_value(&value, &data)
        .map_err(|e| {
            let err_msg = format!("Failed to write registry value: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Registry value written successfully");
    Ok(())
}

#[command]
pub async fn delete_registry(key: String, value: String) -> Result<(), String> {
    info!("🗑️ Deleting registry: {} -> {}", key, value);
    
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let full_path = format!("{}{}", REGISTRY_BASE, key);
    
    let reg_key = hkcu
        .open_subkey(&full_path)
        .map_err(|e| {
            let err_msg = format!("Failed to open registry key: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    reg_key
        .delete_value(&value)
        .map_err(|e| {
            let err_msg = format!("Failed to delete registry value: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Registry value deleted successfully");
    Ok(())
}

#[command]
pub async fn list_registry_keys(key: String) -> Result<Vec<String>, String> {
    info!("📋 Listing registry keys: {}", key);
    
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let full_path = format!("{}{}", REGISTRY_BASE, key);
    
    let reg_key = hkcu
        .open_subkey(&full_path)
        .map_err(|e| {
            let err_msg = format!("Failed to open registry key: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    let keys: Vec<String> = reg_key
        .enum_values()
        .filter_map(|result| {
            result.ok().map(|(name, _)| name)
        })
        .collect();

    info!("✅ Registry keys listed: {} keys found", keys.len());
    Ok(keys)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_registry_write_read() {
        let test_key = r"\Test".to_string();
        let test_value = "test_value".to_string();
        let test_data = "test_data".to_string();

        // Write
        let write_result = write_registry(test_key.clone(), test_value.clone(), test_data.clone()).await;
        assert!(write_result.is_ok());

        // Read
        let read_result = read_registry(test_key.clone(), test_value.clone()).await;
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), test_data);

        // Delete
        let delete_result = delete_registry(test_key, test_value).await;
        assert!(delete_result.is_ok());
    }
}
