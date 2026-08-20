use tauri::command;
use std::fs;
use std::path::PathBuf;
use log::{info, error};
use serde_json::json;

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    info!("📖 Reading file: {}", path);
    
    fs::read_to_string(&path)
        .map_err(|e| {
            let err_msg = format!("Failed to read file: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    info!("✍️ Writing file: {}", path);
    
    fs::write(&path, content)
        .map_err(|e| {
            let err_msg = format!("Failed to write file: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })
}

#[command]
pub async fn list_files(path: String) -> Result<Vec<serde_json::Value>, String> {
    info!("📋 Listing files: {}", path);
    
    let entries = fs::read_dir(&path)
        .map_err(|e| {
            let err_msg = format!("Failed to read directory: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    let files: Vec<serde_json::Value> = entries
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                let path = e.path();
                let is_dir = path.is_dir();
                let name = path.file_name()?.to_string_lossy().to_string();
                
                Some(json!({
                    "name": name,
                    "path": path.to_string_lossy().to_string(),
                    "is_dir": is_dir,
                }))
            })
        })
        .collect();

    info!("✅ Listed {} items", files.len());
    Ok(files)
}

#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    info!("📁 Creating directory: {}", path);
    
    fs::create_dir_all(&path)
        .map_err(|e| {
            let err_msg = format!("Failed to create directory: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })
}

#[command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    info!("🔍 Checking if file exists: {}", path);
    Ok(PathBuf::from(path).exists())
}

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    info!("🗑️ Deleting file: {}", path);
    
    fs::remove_file(&path)
        .map_err(|e| {
            let err_msg = format!("Failed to delete file: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })
}

#[command]
pub async fn get_file_metadata(path: String) -> Result<serde_json::Value, String> {
    info!("📊 Getting file metadata: {}", path);
    
    let metadata = fs::metadata(&path)
        .map_err(|e| {
            let err_msg = format!("Failed to get metadata: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    Ok(json!({
        "is_file": metadata.is_file(),
        "is_dir": metadata.is_dir(),
        "len": metadata.len(),
        "modified": metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
        "permissions": format!("{:?}", metadata.permissions()),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[tokio::test]
    async fn test_file_operations() {
        let test_file = "./test_file.txt";
        let test_content = "Test content";

        // Write
        let write_result = write_file(test_file.to_string(), test_content.to_string()).await;
        assert!(write_result.is_ok());

        // Read
        let read_result = read_file(test_file.to_string()).await;
        assert!(read_result.is_ok());
        assert_eq!(read_result.unwrap(), test_content);

        // Check exists
        let exists_result = file_exists(test_file.to_string()).await;
        assert!(exists_result.is_ok());
        assert!(exists_result.unwrap());

        // Delete
        let delete_result = delete_file(test_file.to_string()).await;
        assert!(delete_result.is_ok());
    }
}
