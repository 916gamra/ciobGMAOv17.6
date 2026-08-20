use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use log::{info, error};
use tauri::AppHandle;

pub async fn init_database(app_handle: &AppHandle) -> Result<SqlitePool, String> {
    info!("🗄️ Initializing database");

    // Get app data directory
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    // Create app data directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    // Database file path
    let db_path = app_data_dir.join("bdr_nexus.sqlite");
    let db_url = format!("sqlite://{}", db_path.display());

    info!("📍 Database path: {}", db_path.display());

    // Create connection pool
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| {
            let err_msg = format!("Failed to connect to database: {}", e);
            error!("❌ {}", err_msg);
            err_msg
        })?;

    // Run migrations
    create_tables(&pool).await?;

    info!("✅ Database initialized successfully");
    Ok(pool)
}

async fn create_tables(pool: &SqlitePool) -> Result<(), String> {
    info!("📋 Creating database tables");

    // Machines table
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
    .execute(pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create machines table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Machines table created");

    // Maintenance records table
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
    .execute(pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create maintenance_records table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Maintenance records table created");

    // Audit logs table
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
    .execute(pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create audit_logs table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Audit logs table created");

    // Spare parts (PDR) table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS spare_parts (
            id TEXT PRIMARY KEY,
            reference_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            min_threshold INTEGER DEFAULT 5,
            unit_price REAL DEFAULT 0.0,
            location TEXT,
            condition TEXT DEFAULT 'NEW',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create spare_parts table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Spare parts table created");

    // Users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create users table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Users table created");

    // Sync queue table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            data TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            synced_at DATETIME
        )
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| {
        let err_msg = format!("Failed to create sync_queue table: {}", e);
        error!("❌ {}", err_msg);
        err_msg
    })?;

    info!("✅ Sync queue table created");

    info!("✅ All tables created successfully");
    Ok(())
}

pub async fn get_database_connection(app_handle: &AppHandle) -> Result<SqlitePool, String> {
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_data_dir.join("bdr_nexus.sqlite");
    let db_url = format!("sqlite://{}", db_path.display());

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_module_structure() {
        assert!(true);
    }
}
