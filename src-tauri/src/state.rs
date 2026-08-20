use std::sync::Mutex;
use tauri::AppHandle;
use sqlx::sqlite::SqlitePool;
use serde::{Serialize, Deserialize};

#[derive(Default)]
pub struct AppState {
    pub db_pool: Mutex<Option<SqlitePool>>,
    pub user_session: Mutex<Option<String>>,
    pub app_config: Mutex<AppConfig>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub app_version: String,
    pub app_data_dir: String,
    pub language: String,
    pub theme: String,
    pub auto_update: bool,
    pub offline_mode: bool,
    pub encryption_enabled: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            app_data_dir: String::new(),
            language: "ar".to_string(),
            theme: "dark".to_string(),
            auto_update: true,
            offline_mode: true,
            encryption_enabled: true,
        }
    }
}

impl AppState {
    pub fn new(app_handle: AppHandle) -> Self {
        let mut config = AppConfig::default();
        
        if let Ok(app_data_dir) = app_handle
            .path_resolver()
            .app_data_dir()
            .ok_or("Failed to get app data dir")
        {
            config.app_data_dir = app_data_dir.to_string_lossy().to_string();
        }

        Self {
            db_pool: Mutex::new(None),
            user_session: Mutex::new(None),
            app_config: Mutex::new(config),
        }
    }

    pub fn get_config(&self) -> AppConfig {
        self.app_config.lock().unwrap().clone()
    }

    pub fn set_config(&self, config: AppConfig) {
        *self.app_config.lock().unwrap() = config;
    }

    pub fn get_session(&self) -> Option<String> {
        self.user_session.lock().unwrap().clone()
    }

    pub fn set_session(&self, session: String) {
        *self.user_session.lock().unwrap() = Some(session);
    }

    pub fn clear_session(&self) {
        *self.user_session.lock().unwrap() = None;
    }
}
