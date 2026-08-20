use log::LevelFilter;
use std::fs;
use std::path::PathBuf;
use chrono::Local;

pub fn init() {
    let log_dir = get_log_dir();
    
    // Create log directory if it doesn't exist
    if let Err(e) = fs::create_dir_all(&log_dir) {
        eprintln!("Failed to create log directory: {}", e);
        return;
    }

    let log_file_path = log_dir.join(format!(
        "bdr_nexus_{}.log",
        Local::now().format("%Y%m%d")
    ));

    // Open or create log file
    match fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
    {
        Ok(file) => {
            env_logger::Builder::new()
                .target(env_logger::Target::Pipe(Box::new(file)))
                .filter_level(LevelFilter::Info)
                .format_timestamp_secs()
                .format_module_path(true)
                .format_target(true)
                .init();

            println!("📝 Logging initialized at: {:?}", log_file_path);
        }
        Err(e) => {
            eprintln!("Failed to open log file: {}", e);
        }
    }
}

fn get_log_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let app_data = std::env::var("APPDATA")
            .unwrap_or_else(|_| ".".to_string());
        PathBuf::from(app_data)
            .join("BDR Systems")
            .join("BDR Nexus")
            .join("logs")
    }

    #[cfg(not(target_os = "windows"))]
    {
        PathBuf::from(".").join("logs")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_dir_creation() {
        let log_dir = get_log_dir();
        assert!(!log_dir.to_string_lossy().is_empty());
    }
}
