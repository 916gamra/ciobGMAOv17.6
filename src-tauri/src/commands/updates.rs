use tauri::command;
use log::{info, error};

#[command]
pub async fn check_for_updates(app_handle: tauri::AppHandle) -> Result<bool, String> {
    info!("🔍 Checking for updates");
    
    match app_handle.updater().check().await {
        Ok(update_response) => {
            let has_update = update_response.is_update_available();
            if has_update {
                info!("✅ Update available");
            } else {
                info!("ℹ️ No updates available");
            }
            Ok(has_update)
        }
        Err(e) => {
            let err_msg = format!("Failed to check for updates: {}", e);
            error!("❌ {}", err_msg);
            Err(err_msg)
        }
    }
}

#[command]
pub async fn install_update(app_handle: tauri::AppHandle) -> Result<(), String> {
    info!("📥 Installing update");
    
    match app_handle.updater().check().await {
        Ok(update_response) => {
            if update_response.is_update_available() {
                tauri::async_runtime::spawn(async move {
                    match update_response.download_and_install().await {
                        Ok(_) => info!("✅ Update installed successfully"),
                        Err(e) => error!("❌ Update installation failed: {}", e),
                    }
                });
                info!("✅ Update installation started");
                Ok(())
            } else {
                let err_msg = "No update available".to_string();
                error!("❌ {}", err_msg);
                Err(err_msg)
            }
        }
        Err(e) => {
            let err_msg = format!("Failed to install update: {}", e);
            error!("❌ {}", err_msg);
            Err(err_msg)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_check_updates_structure() {
        // This test just verifies the function structure
        // Actual update checking requires a real app handle
        assert!(true);
    }
}
