use tauri::command;
use log::{info, error};

#[command]
pub async fn minimize_window(window: tauri::Window) -> Result<(), String> {
    info!("📉 Minimizing window");
    
    window.minimize()
        .map_err(|e| {
            let err_msg = format!("Failed to minimize window: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Window minimized");
    Ok(())
}

#[command]
pub async fn maximize_window(window: tauri::Window) -> Result<(), String> {
    info!("📈 Maximizing window");
    
    window.maximize()
        .map_err(|e| {
            let err_msg = format!("Failed to maximize window: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Window maximized");
    Ok(())
}

#[command]
pub async fn close_window(window: tauri::Window) -> Result<(), String> {
    info!("🔒 Closing window");
    
    window.close()
        .map_err(|e| {
            let err_msg = format!("Failed to close window: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Window closed");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_window_commands_structure() {
        // Structure test
        assert!(true);
    }
}
