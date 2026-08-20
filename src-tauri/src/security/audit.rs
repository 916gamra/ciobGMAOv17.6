use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use base64::{engine::general_purpose, Engine as _};
use log::{info, error};
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AuditEvent {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub timestamp: DateTime<Utc>,
    pub prev_hash: Option<String>,
    pub event_hash: String,
    pub signature: String,
}

pub struct AuditTrail;

impl AuditTrail {
    /// إنشاء حدث تدقيق
    pub fn create_event(
        user_id: String,
        action: String,
        entity_type: String,
        entity_id: String,
        prev_hash: Option<String>,
        secret: &[u8],
    ) -> Result<AuditEvent, String> {
        info!("📝 Creating audit event: {} - {} - {}", user_id, action, entity_type);
        
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now();

        // إنشاء hash الحدث
        let event_data = format!(
            "{}{}{}{}{}{}",
            id, user_id, action, entity_type, entity_id, timestamp
        );

        let mut hasher = Sha256::new();
        hasher.update(&event_data);
        let event_hash = general_purpose::STANDARD.encode(hasher.finalize());

        // إنشاء التوقيع
        let mut mac = HmacSha256::new_from_slice(secret)
            .map_err(|e| {
                let err_msg = format!("Invalid secret: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;
        mac.update(event_hash.as_bytes());
        let signature = general_purpose::STANDARD.encode(mac.finalize().into_bytes());

        info!("✅ Audit event created");
        Ok(AuditEvent {
            id,
            user_id,
            action,
            entity_type,
            entity_id,
            timestamp,
            prev_hash,
            event_hash,
            signature,
        })
    }

    /// التحقق من حدث التدقيق
    pub fn verify_event(event: &AuditEvent, secret: &[u8]) -> Result<bool, String> {
        info!("✔️ Verifying audit event");
        
        let mut mac = HmacSha256::new_from_slice(secret)
            .map_err(|e| {
                let err_msg = format!("Invalid secret: {}", e);
                error!("❌ {}", err_msg);
                err_msg
            })?;
        mac.update(event.event_hash.as_bytes());

        let expected_signature = general_purpose::STANDARD.encode(mac.finalize().into_bytes());

        let is_valid = event.signature == expected_signature;
        if is_valid {
            info!("✅ Audit event verified");
        } else {
            error!("❌ Audit event verification failed");
        }

        Ok(is_valid)
    }

    /// التحقق من سلسلة التدقيق
    pub fn verify_chain(events: &[AuditEvent]) -> Result<bool, String> {
        info!("🔗 Verifying audit chain");
        
        for i in 1..events.len() {
            if events[i].prev_hash != Some(events[i - 1].event_hash.clone()) {
                error!("❌ Audit chain broken at index {}", i);
                return Ok(false);
            }
        }
        
        info!("✅ Audit chain verified");
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audit_event_creation() {
        let secret = b"test_secret";
        let result = AuditTrail::create_event(
            "user_123".to_string(),
            "CREATE".to_string(),
            "machine".to_string(),
            "machine_001".to_string(),
            None,
            secret,
        );

        assert!(result.is_ok());
        let event = result.unwrap();
        assert!(!event.id.is_empty());
        assert!(!event.event_hash.is_empty());
        assert!(!event.signature.is_empty());
    }

    #[test]
    fn test_audit_event_verification() {
        let secret = b"test_secret";
        let event = AuditTrail::create_event(
            "user_123".to_string(),
            "CREATE".to_string(),
            "machine".to_string(),
            "machine_001".to_string(),
            None,
            secret,
        ).unwrap();

        let verified = AuditTrail::verify_event(&event, secret);
        assert!(verified.is_ok());
        assert!(verified.unwrap());
    }

    #[test]
    fn test_audit_chain_verification() {
        let secret = b"test_secret";
        
        let event1 = AuditTrail::create_event(
            "user_123".to_string(),
            "CREATE".to_string(),
            "machine".to_string(),
            "machine_001".to_string(),
            None,
            secret,
        ).unwrap();

        let event2 = AuditTrail::create_event(
            "user_123".to_string(),
            "UPDATE".to_string(),
            "machine".to_string(),
            "machine_001".to_string(),
            Some(event1.event_hash.clone()),
            secret,
        ).unwrap();

        let events = vec![event1, event2];
        let verified = AuditTrail::verify_chain(&events);
        assert!(verified.is_ok());
        assert!(verified.unwrap());
    }
}
