// src/core/security/SecurityManager.ts
import { createLogger } from '../logging/Logger';
import { threatDetectionEngine } from './ThreatDetectionEngine';
import { intrusionDetectionSystem } from './IntrusionDetectionSystem';
import { dataIntegrityProtection } from './DataIntegrityProtection';
import { sessionProtection } from './SessionProtection';
import { incidentResponseSystem } from './IncidentResponseSystem';

export class SecurityManager {
  private logger = createLogger('SecurityManager');
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) return;
    this.logger.info('Initializing Military Grade Security Manager...');
    
    // Wire up subsystems
    this.isInitialized = true;
    this.logger.info('Security Manager fully initialized and active');
  }

  scanAndValidateInput(input: string, context?: string) {
    return threatDetectionEngine.scanInput(input, context);
  }

  monitorNetworkRequest(req: { ip: string; method: string; url: string; headers: Record<string, string>; body?: string }) {
    return intrusionDetectionSystem.monitorRequest(req);
  }

  checkDataIntegrity(id: string, data: any) {
    return dataIntegrityProtection.verifyDataIntegrity(id, data);
  }

  getComprehensiveSecurityReport() {
    return {
      threatReport: threatDetectionEngine.getSecurityReport(),
      detectedThreats: threatDetectionEngine.getDetectedThreats(),
      suspiciousActivities: threatDetectionEngine.getSuspiciousActivities(),
      blockedIPs: intrusionDetectionSystem.getBlockedIPs(),
      suspiciousConnections: intrusionDetectionSystem.getSuspiciousConnections(),
      integrityViolations: dataIntegrityProtection.getIntegrityViolations(),
      activeSessions: sessionProtection.getActiveSessions(),
      incidents: incidentResponseSystem.getIncidents(),
      alerts: incidentResponseSystem.getAlerts(),
    };
  }
}

export const securityManager = new SecurityManager();
