use tauri::{AppHandle, SystemTrayEvent, WindowEvent, Manager};
use log::{info, error};

pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            info!("👁️ Tray icon left clicked");
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                info!("✅ Window shown and focused");
            }
        }
        SystemTrayEvent::RightClick { .. } => {
            info!("👆 Tray icon right clicked");
        }
        SystemTrayEvent::DoubleClick { .. } => {
            info!("👁️👁️ Tray icon double clicked");
            if let Some(window) = app.get_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                    info!("✅ Window hidden");
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                    info!("✅ Window shown and focused");
                }
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    info!("📋 Show menu item clicked");
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        info!("✅ Window shown");
                    }
                }
                "hide" => {
                    info!("📋 Hide menu item clicked");
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                        info!("✅ Window hidden");
                    }
                }
                "settings" => {
                    info!("⚙️ Settings menu item clicked");
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("open-settings", ());
                    }
                }
                "status" => {
                    info!("📊 Status menu item clicked");
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("show-status", ());
                    }
                }
                "about" => {
                    info!("ℹ️ About menu item clicked");
                    if let Some(window) = app.get_window("main") {
                        let _ = window.emit("show-about", ());
                    }
                }
                "exit" => {
                    info!("🛑 Exit menu item clicked");
                    std::process::exit(0);
                }
                _ => {
                    error!("❌ Unknown menu item: {}", id);
                }
            }
        }
        _ => {
            info!("ℹ️ Other tray event: {:?}", event);
        }
    }
}

pub fn handle_window_event(event: &WindowEvent) {
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            info!("🔒 Window close prevented");
        }
        WindowEvent::Focused(focused) => {
            if *focused {
                info!("👁️ Window focused");
            } else {
                info!("👁️ Window unfocused");
            }
        }
        WindowEvent::Resized(_) => {
            info!("📐 Window resized");
        }
        WindowEvent::Moved(_) => {
            info!("📍 Window moved");
        }
        _ => {
            info!("ℹ️ Window event: {:?}", event);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tray_event_handling() {
        assert!(true);
    }
}
