#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod db;
mod security;
mod windows_bridge;
mod logger;
mod state;

use tauri::{
    Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem,
    AppHandle, State, async_runtime::block_on, Window, Menu, MenuItem, Submenu
};
use std::sync::Mutex;
use log::{info, error};

use crate::state::AppState;
use crate::commands::*;

fn main() {
    // Initialize logger
    logger::init();
    info!("🚀 Starting BDR Nexus v17.6");

    // Create system tray menu
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "عرض التطبيق"))
        .add_item(CustomMenuItem::new("hide", "إخفاء التطبيق"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("settings", "الإعدادات"))
        .add_item(CustomMenuItem::new("status", "الحالة"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("about", "حول التطبيق"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("exit", "خروج"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    // Create app menu
    let app_menu = Menu::new()
        .add_submenu(Submenu::new(
            "ملف",
            Menu::new()
                .add_item(CustomMenuItem::new("new", "جديد"))
                .add_item(CustomMenuItem::new("open", "فتح"))
                .add_item(CustomMenuItem::new("save", "حفظ"))
                .add_native_item(MenuItem::Separator)
                .add_item(CustomMenuItem::new("exit", "خروج"))
        ))
        .add_submenu(Submenu::new(
            "تحرير",
            Menu::new()
                .add_item(CustomMenuItem::new("undo", "تراجع"))
                .add_item(CustomMenuItem::new("redo", "إعادة"))
                .add_native_item(MenuItem::Separator)
                .add_item(CustomMenuItem::new("cut", "قص"))
                .add_item(CustomMenuItem::new("copy", "نسخ"))
                .add_item(CustomMenuItem::new("paste", "لصق"))
        ))
        .add_submenu(Submenu::new(
            "عرض",
            Menu::new()
                .add_item(CustomMenuItem::new("reload", "تحديث"))
                .add_item(CustomMenuItem::new("devtools", "أدوات المطور"))
        ))
        .add_submenu(Submenu::new(
            "مساعدة",
            Menu::new()
                .add_item(CustomMenuItem::new("about", "حول"))
                .add_item(CustomMenuItem::new("docs", "التوثيق"))
        ));

    // Build Tauri app
    let app = tauri::Builder::default()
        .setup(|app| {
            info!("⚙️ Setting up application");
            
            // Initialize app state
            let app_state = AppState::new(app.handle().clone());
            
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match db::init_database(&app_handle).await {
                    Ok(_) => info!("✅ Database initialized successfully"),
                    Err(e) => error!("❌ Database initialization failed: {}", e),
                }
            });

            info!("✅ Application setup completed");
            Ok(())
        })
        .manage(AppState::default())
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            windows_bridge::handle_tray_event(app, event);
        })
        .menu(app_menu)
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "exit" => std::process::exit(0),
                "devtools" => {
                    if let Some(window) = event.window().get_window("main") {
                        let _ = window.open_devtools();
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            // System commands
            commands::get_system_info,
            commands::get_app_version,
            commands::get_app_data_dir,
            commands::get_app_config,
            commands::set_app_config,
            
            // Registry commands
            commands::read_registry,
            commands::write_registry,
            commands::delete_registry,
            commands::list_registry_keys,
            
            // File system commands
            commands::read_file,
            commands::write_file,
            commands::list_files,
            commands::create_directory,
            commands::file_exists,
            commands::delete_file,
            commands::get_file_metadata,
            
            // Database commands
            commands::init_database,
            commands::execute_query,
            commands::fetch_data,
            commands::get_database_stats,
            
            // Security commands
            commands::encrypt_data,
            commands::decrypt_data,
            commands::generate_session_token,
            commands::verify_session_token,
            commands::derive_key_from_pin,
            commands::verify_hash,
            
            // Notification commands
            commands::show_notification,
            commands::show_error_notification,
            commands::show_success_notification,
            
            // Update commands
            commands::check_for_updates,
            commands::install_update,
            
            // Window commands
            commands::minimize_window,
            commands::maximize_window,
            commands::close_window,
        ])
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    if let Some(window) = event.window().get_window("main") {
                        let _ = window.hide();
                    }
                    info!("🔒 Window close prevented - minimized to tray");
                }
                tauri::WindowEvent::Focused(focused) => {
                    if *focused {
                        info!("👁️ Window focused");
                    }
                }
                _ => {}
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    info!("🎯 Application built successfully");

    app.run(|_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
            info!("🛑 Exit requested");
            api.prevent_exit();
        }
        tauri::RunEvent::Ready => {
            info!("✅ Application ready");
        }
        tauri::RunEvent::Exit => {
            info!("👋 Application exiting");
        }
        _ => {}
    });
}
