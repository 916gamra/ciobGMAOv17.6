use chrono::{DateTime, Utc, Duration};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use log::{info, error};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub is_active: bool,
}

pub struct SessionManager;

impl SessionManager {
    /// إنشاء جلسة جديدة
    pub fn create_session(user_id: String, duration_hours: i64) -> Session {
        info!("🎫 Creating session for user: {}", user_id);
        
        let now = Utc::now();
        let expires_at = now + Duration::hours(duration_hours);

        let session = Session {
            id: Uuid::new_v4().to_string(),
            user_id,
            created_at: now,
            expires_at,
            last_activity: now,
            is_active: true,
        };

        info!("✅ Session created: {}", session.id);
        session
    }

    /// التحقق من صحة الجلسة
    pub fn is_valid(session: &Session) -> bool {
        let is_valid = session.is_active && Utc::now() < session.expires_at;
        
        if is_valid {
            info!("✅ Session is valid");
        } else {
            error!("❌ Session is invalid or expired");
        }
        
        is_valid
    }

    /// تحديث آخر نشاط
    pub fn update_activity(session: &mut Session) {
        info!("🔄 Updating session activity");
        session.last_activity = Utc::now();
        info!("✅ Session activity updated");
    }

    /// إلغاء الجلسة
    pub fn invalidate(session: &mut Session) {
        info!("🔒 Invalidating session");
        session.is_active = false;
        info!("✅ Session invalidated");
    }

    /// التحقق من الخمول
    pub fn is_idle(session: &Session, idle_timeout_minutes: i64) -> bool {
        let idle_duration = Duration::minutes(idle_timeout_minutes);
        let is_idle = Utc::now() - session.last_activity > idle_duration;
        
        if is_idle {
            info!("⏱️ Session is idle");
        }
        
        is_idle
    }

    /// الحصول على الوقت المتبقي
    pub fn get_remaining_time(session: &Session) -> Duration {
        session.expires_at - Utc::now()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_creation() {
        let session = SessionManager::create_session("user_123".to_string(), 8);
        
        assert!(!session.id.is_empty());
        assert_eq!(session.user_id, "user_123");
        assert!(session.is_active);
    }

    #[test]
    fn test_session_validity() {
        let session = SessionManager::create_session("user_123".to_string(), 8);
        assert!(SessionManager::is_valid(&session));
    }

    #[test]
    fn test_session_invalidation() {
        let mut session = SessionManager::create_session("user_123".to_string(), 8);
        SessionManager::invalidate(&mut session);
        
        assert!(!session.is_active);
        assert!(!SessionManager::is_valid(&session));
    }

    #[test]
    fn test_session_activity_update() {
        let mut session = SessionManager::create_session("user_123".to_string(), 8);
        let old_activity = session.last_activity;
        
        std::thread::sleep(std::time::Duration::from_millis(100));
        SessionManager::update_activity(&mut session);
        
        assert!(session.last_activity > old_activity);
    }
}
