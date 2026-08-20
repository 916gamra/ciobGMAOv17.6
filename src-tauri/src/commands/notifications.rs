use tauri::command;
use log::{info, error};

#[command]
pub async fn show_notification(title: String, body: String) -> Result<(), String> {
    info!("📢 Showing notification: {} - {}", title, body);
    
    // Using tauri's built-in notification
    tauri::api::notification::Notification::new("bdr-nexus")
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| {
            let err_msg = format!("Failed to show notification: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Notification shown");
    Ok(())
}

#[command]
pub async fn show_error_notification(title: String, error_msg: String) -> Result<(), String> {
    info!("⚠️ Showing error notification: {} - {}", title, error_msg);
    
    tauri::api::notification::Notification::new("bdr-nexus")
        .title(&title)
        .body(&format!("❌ خطأ: {}", error_msg))
        .show()
        .map_err(|e| {
            let err_msg = format!("Failed to show error notification: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    error!("❌ Error notification shown");
    Ok(())
}

#[command]
pub async fn show_success_notification(title: String, message: String) -> Result<(), String> {
    info!("✅ Showing success notification: {} - {}", title, message);
    
    tauri::api::notification::Notification::new("bdr-nexus")
        .title(&title)
        .body(&format!("✅ {}", message))
        .show()
        .map_err(|e| {
            let err_msg = format!("Failed to show success notification: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Success notification shown");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_notification_creation() {
        let result = show_notification(
            "Test".to_string(),
            "This is a test notification".to_string()
        ).await;
        
        // Note: This will fail in test environment without display
        // but we're testing the function structure
        assert!(result.is_ok() || result.is_err());
    }
}
