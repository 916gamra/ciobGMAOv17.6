use tauri::command;
use sysinfo::{System, SystemExt, ProcessorExt};
use serde_json::json;
use log::info;

#[command]
pub async fn get_system_info() -> Result<serde_json::Value, String> {
    info!("📊 Getting system information");
    
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage: Vec<f32> = sys
        .processors()
        .iter()
        .map(|p| p.cpu_usage())
        .collect();

    let result = json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "cpu_count": sys.processors().len(),
        "cpu_usage": cpu_usage,
        "total_memory": sys.total_memory(),
        "used_memory": sys.used_memory(),
        "available_memory": sys.available_memory(),
        "hostname": hostname::get()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        "timestamp": chrono::Local::now().to_rfc3339(),
    });

    info!("✅ System information retrieved");
    Ok(result)
}

#[command]
pub async fn get_app_version() -> Result<String, String> {
    let version = env!("CARGO_PKG_VERSION").to_string();
    info!("📌 App version: {}", version);
    Ok(version)
}

#[command]
pub async fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    info!("📂 Getting app data directory");
    
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data dir")?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| {
            let err_msg = format!("Failed to create app data dir: {}", e);
            log::error!("❌ {}", err_msg);
            err_msg
        })?;

    let path_str = app_data_dir.to_string_lossy().to_string();
    info!("✅ App data directory: {}", path_str);
    Ok(path_str)
}

#[command]
pub async fn get_app_config(state: tauri::State<'_, crate::state::AppState>) -> Result<serde_json::Value, String> {
    info!("⚙️ Getting app configuration");
    
    let config = state.get_config();
    Ok(serde_json::to_value(config).map_err(|e| e.to_string())?)
}

#[command]
pub async fn set_app_config(
    config: serde_json::Value,
    state: tauri::State<'_, crate::state::AppState>
) -> Result<(), String> {
    info!("⚙️ Setting app configuration");
    
    let app_config: crate::state::AppConfig = serde_json::from_value(config)
        .map_err(|e| format!("Invalid config: {}", e))?;
    
    state.set_config(app_config);
    info!("✅ App configuration updated");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_app_version() {
        let result = get_app_version().await;
        assert!(result.is_ok());
        let version = result.unwrap();
        assert!(!version.is_empty());
    }

    #[tokio::test]
    async fn test_get_system_info() {
        let result = get_system_info().await;
        assert!(result.is_ok());
        let info = result.unwrap();
        assert!(info.get("os").is_some());
        assert!(info.get("cpu_count").is_some());
    }
}
