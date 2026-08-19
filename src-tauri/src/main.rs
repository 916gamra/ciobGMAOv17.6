// BDR Nexus v17.6 - Rust Core Backend Entry Point
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem, Manager, AppHandle
};
use std::sync::Mutex;

pub struct AppState {
    pub session_token: Mutex<Option<String>>,
    pub offline_queue_count: Mutex<usize>,
}

#[tauri::command]
async fn get_system_info() -> Result<serde_json::Value, String> {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();

    let info = serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "memory": {
            "total": sys.total_memory(),
            "used": sys.used_memory(),
            "available": sys.available_memory()
        },
        "cpuCount": sys.cpus().len(),
        "status": "OPERATIONAL"
    });
    Ok(info)
}

#[tauri::command]
async fn read_registry(key: String, value: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::HKEY_CURRENT_USER;
        
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let reg_key = hkcu.open_subkey(&key).map_err(|e| e.to_string())?;
        let val: String = reg_key.get_value(&value).map_err(|e| e.to_string())?;
        return Ok(val);
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(format!("SIMULATED_REG_VAL_{}", value))
    }
}

#[tauri::command]
async fn write_registry(key: String, value: String, data: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::HKEY_CURRENT_USER;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (reg_key, _) = hkcu.create_subkey(&key).map_err(|e| e.to_string())?;
        reg_key.set_value(&value, &data).map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        println!("[Simulated Registry Write] {}/{} = {}", key, value, data);
        Ok(())
    }
}

#[tauri::command]
async fn create_notification(title: String, body: String) -> Result<(), String> {
    println!("[BDR Nexus Notification] {}: {}", title, body);
    Ok(())
}

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "إظهار BDR Nexus"))
        .add_item(CustomMenuItem::new("hide", "إخفاء النافذة"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("sync", "مزامنة البيانات الآن"))
        .add_item(CustomMenuItem::new("exit", "خروج من النظام"));

    tauri::Builder::default()
        .manage(AppState {
            session_token: Mutex::new(None),
            offline_queue_count: Mutex::new(0),
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| {
            if let tauri::SystemTrayEvent::MenuItemClick { id, .. } = event {
                match id.as_str() {
                    "show" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "exit" => std::process::exit(0),
                    _ => {}
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            read_registry,
            write_registry,
            create_notification
        ])
        .run(tauri::generate_context!())
        .expect("Error while starting BDR Nexus Tauri Application");
}
