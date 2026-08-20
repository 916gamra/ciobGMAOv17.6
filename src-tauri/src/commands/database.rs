use tauri::command;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use serde_json::{json, Value};
use log::{info, error};

#[command]
pub async fn init_database(db_path: String) -> Result<(), String> {
    info!("🗄️ Initializing database at: {}", db_path);
    
    let database_url = format!("sqlite://{}", db_path);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| {
            let err_msg = format!("Failed to connect to database: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    // Create machines table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS machines (
            id TEXT PRIMARY KEY,
            reference_code TEXT UNIQUE NOT NULL,
            serial_number TEXT NOT NULL,
            sector_id TEXT NOT NULL,
            lifecycle_state TEXT DEFAULT 'OPERATING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(&pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create machines table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    // Create maintenance_records table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS maintenance_records (
            id TEXT PRIMARY KEY,
            machine_id TEXT NOT NULL,
            maintenance_type TEXT NOT NULL,
            description TEXT,
            start_date DATETIME NOT NULL,
            end_date DATETIME,
            technician_id TEXT,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (machine_id) REFERENCES machines(id)
        )
        "#
    )
    .execute(&pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create maintenance_records table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    // Create audit_logs table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            prev_hash TEXT,
            event_hash TEXT NOT NULL,
            signature TEXT NOT NULL
        )
        "#
    )
    .execute(&pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create audit_logs table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Database initialized successfully");
    Ok(())
}

#[command]
pub async fn execute_query(db_path: String, query: String) -> Result<(), String> {
    info!("⚙️ Executing query");
    
    let database_url = format!("sqlite://{}", db_path);
    let pool = SqlitePoolOptions::new()
        .connect(&database_url)
        .await
        .map_err(|e| {
            let err_msg = format!("Failed to connect: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    sqlx::query(&query)
        .execute(&pool)
        .await
        .map_err(|e| {
            let err_msg = format!("Query execution failed: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    info!("✅ Query executed successfully");
    Ok(())
}

#[command]
pub async fn fetch_data(db_path: String, query: String) -> Result<Vec<Value>, String> {
    info!("📊 Fetching data");
    
    let database_url = format!("sqlite://{}", db_path);
    let pool = SqlitePoolOptions::new()
        .connect(&database_url)
        .await
        .map_err(|e| {
            let err_msg = format!("Failed to connect: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    let rows = sqlx::query_as::<_, (String,)>(query.as_str())
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            let err_msg = format!("Query failed: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    let results = rows
        .iter()
        .map(|(row,)| json!({"data": row}))
        .collect();

    info!("✅ Data fetched: {} rows", rows.len());
    Ok(results)
}

#[command]
pub async fn get_database_stats(db_path: String) -> Result<Value, String> {
    info!("📈 Getting database statistics");
    
    let database_url = format!("sqlite://{}", db_path);
    let pool = SqlitePoolOptions::new()
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let machine_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM machines")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let maintenance_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM maintenance_records")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let audit_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM audit_logs")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    info!("✅ Database stats retrieved");
    Ok(json!({
        "machines": machine_count.0,
        "maintenance_records": maintenance_count.0,
        "audit_logs": audit_count.0,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_database_initialization() {
        let db_path = "./test_db.sqlite";
        let result = init_database(db_path.to_string()).await;
        assert!(result.is_ok());
        
        // Cleanup
        let _ = std::fs::remove_file(db_path);
    }
}
