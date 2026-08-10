// src/core/security/ThreatDetectionEngine.ts
/**
 * محرك الكشف عن التهديدات في الوقت الفعلي
 * 
 * Features:
 * - Real-time Monitoring
 * - Threat Pattern Recognition
 * - Anomaly Detection
 * - Behavioral Analysis
 * - Automatic Response
 */
import { createLogger } from '../logging/Logger';

export interface ThreatPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
}

export interface ScanResult {
  isSafe: boolean;
  threats: Array<{
    type: string;
    name: string;
    severity: string;
    score: number;
  }>;
  score: number;
  timestamp: number;
  context: string;
}

export interface DetectedThreat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  description: string;
  score: number;
  source: string;
  payload?: string;
}

export interface SuspiciousActivity {
  id: string;
  type: string;
  timestamp: number;
  source?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityReport {
  timestamp: number;
  totalThreats: number;
  recentThreats: number;
  criticalThreats: number;
  highThreats: number;
  suspiciousActivities: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export class ThreatDetectionEngine {
  private logger = createLogger('ThreatDetection');
  private threatPatterns: ThreatPattern[] = [];
  private detectedThreats: DetectedThreat[] = [];
  private suspiciousActivities: SuspiciousActivity[] = [];
  private maxThreats = 10000;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private threatScores = {
    sqlInjection: 95,
    xssAttack: 90,
    csrfAttack: 85,
    bruteForce: 88,
    dataExfiltration: 99,
    malwareDetection: 98,
    ddosAttack: 92,
    unauthorizedAccess: 94,
    dataManipulation: 96,
    sessionHijacking: 91,
  };

  constructor() {
    this.initializeThreatPatterns();
    this.startMonitoring();
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      {
        id: 'sql-injection',
        name: 'SQL Injection',
        pattern: /(\bunion\b.*\bselect\b|\bor\b.*\b1\s*=\s*1|\bdrop\b.*\btable\b)/gi,
        severity: 'critical',
        score: this.threatScores.sqlInjection,
      },
      {
        id: 'xss-attack',
        name: 'Cross-Site Scripting',
        pattern: /(<script[^>]*>.*?<\/script>|javascript:|onerror=|onload=)/gi,
        severity: 'critical',
        score: this.threatScores.xssAttack,
      },
      {
        id: 'path-traversal',
        name: 'Path Traversal',
        pattern: /(\.\.[\/\\])+|\.\.%2[fF]|%2e%2e/g,
        severity: 'high',
        score: 87,
      },
      {
        id: 'command-injection',
        name: 'Command Injection',
        pattern: /[;&|`$(){}[\]<>\\]/g,
        severity: 'critical',
        score: 93,
      },
      {
        id: 'ldap-injection',
        name: 'LDAP Injection',
        pattern: /[*()&|]/g,
        severity: 'high',
        score: 86,
      },
      {
        id: 'xml-injection',
        name: 'XML Injection',
        pattern: /<!ENTITY|<!DOCTYPE|SYSTEM/gi,
        severity: 'high',
        score: 84,
      },
      {
        id: 'header-injection',
        name: 'Header Injection',
        pattern: /[\r\n]/g,
        severity: 'medium',
        score: 75,
      },
    ];

    this.logger.info('Threat patterns initialized', {
      count: this.threatPatterns.length,
    });
  }

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;
    this.monitoringInterval = setInterval(() => {
      this.analyzeSystemBehavior();
      this.detectAnomalies();
      this.checkForSuspiciousPatterns();
    }, 5000);

    this.logger.info('Threat monitoring started');
  }

  scanInput(input: string, context: string = 'unknown'): ScanResult {
    const result: ScanResult = {
      isSafe: true,
      threats: [],
      score: 0,
      timestamp: Date.now(),
      context,
    };

    for (const pattern of this.threatPatterns) {
      if (pattern.pattern.test(input)) {
        result.isSafe = false;
        result.threats.push({
          type: pattern.id,
          name: pattern.name,
          severity: pattern.severity,
          score: pattern.score,
        });
        result.score += pattern.score;
      }
    }

    result.score = Math.min(result.score, 100);

    if (!result.isSafe) {
      this.logThreat(result, input);
      this.triggerResponse(result);
    }

    return result;
  }

  private analyzeSystemBehavior(): void {
    const recentThreats = this.detectedThreats.filter(
      t => Date.now() - t.timestamp < 60000
    );

    if (recentThreats.length > 5) {
      this.logger.warn('Unusual threat pattern detected', {
        count: recentThreats.length,
      });

      const threat: DetectedThreat = {
        id: `threat-${Date.now()}`,
        type: 'behavioral-anomaly',
        severity: 'high',
        timestamp: Date.now(),
        description: 'Multiple threats detected in short time',
        score: 85,
        source: 'system-behavior',
      };

      this.detectedThreats.push(threat);
      this.triggerAlarm(threat);
    }
  }

  private detectAnomalies(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentActivities = this.suspiciousActivities.filter(
      a => a.timestamp > oneHourAgo
    );

    if (recentActivities.length > 50) {
      this.logger.warn('Anomaly detected: High suspicious activity', {
        count: recentActivities.length,
      });

      const threat: DetectedThreat = {
        id: `threat-${Date.now()}`,
        type: 'anomaly-detected',
        severity: 'critical',
        timestamp: Date.now(),
        description: 'Abnormal activity pattern detected',
        score: 92,
        source: 'anomaly-detection',
      };

      this.detectedThreats.push(threat);
      this.triggerAlarm(threat);
    }
  }

  private checkForSuspiciousPatterns(): void {
    const failedAttempts = this.suspiciousActivities.filter(
      a => a.type === 'failed-attempt'
    );

    const groupedBySource = new Map<string, SuspiciousActivity[]>();
    for (const attempt of failedAttempts) {
      const source = attempt.source || 'unknown';
      if (!groupedBySource.has(source)) {
        groupedBySource.set(source, []);
      }
      groupedBySource.get(source)!.push(attempt);
    }

    for (const [source, attempts] of groupedBySource) {
      if (attempts.length > 10) {
        this.logger.warn('Brute force attempt detected', {
          source,
          attempts: attempts.length,
        });

        const threat: DetectedThreat = {
          id: `threat-${Date.now()}`,
          type: 'brute-force',
          severity: 'critical',
          timestamp: Date.now(),
          description: `Brute force attempt from ${source}`,
          score: this.threatScores.bruteForce,
          source,
        };

        this.detectedThreats.push(threat);
        this.triggerAlarm(threat);
      }
    }
  }

  private logThreat(result: ScanResult, input: string): void {
    const threat: DetectedThreat = {
      id: `threat-${Date.now()}`,
      type: result.threats[0]?.type || 'unknown',
      severity: (result.threats[0]?.severity as any) || 'medium',
      timestamp: Date.now(),
      description: `Threat detected: ${result.threats.map(t => t.name).join(', ')}`,
      score: result.score,
      source: result.context,
      payload: this.sanitizeForLogging(input),
    };

    this.detectedThreats.push(threat);

    if (this.detectedThreats.length > this.maxThreats) {
      this.detectedThreats = this.detectedThreats.slice(-this.maxThreats);
    }

    this.logger.error('Threat detected', threat);
  }

  private triggerResponse(result: ScanResult): void {
    if (result.score > 80) {
      this.logger.warn('High threat score - triggering response', {
        score: result.score,
      });
    }
  }

  private triggerAlarm(threat: DetectedThreat): void {
    this.logger.error('SECURITY ALARM TRIGGERED', threat);
  }

  private sanitizeForLogging(input: string): string {
    return input.substring(0, 500).replace(/[^\w\s-]/g, '*');
  }

  getDetectedThreats(): DetectedThreat[] {
    return this.detectedThreats;
  }

  getSuspiciousActivities(): SuspiciousActivity[] {
    return this.suspiciousActivities;
  }

  recordSuspiciousActivity(activity: Omit<SuspiciousActivity, 'id' | 'timestamp'>): void {
    this.suspiciousActivities.push({
      ...activity,
      id: `activity-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  getSecurityReport(): SecurityReport {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentThreats = this.detectedThreats.filter(t => t.timestamp > oneHourAgo);
    const criticalThreats = recentThreats.filter(t => t.severity === 'critical');
    const highThreats = recentThreats.filter(t => t.severity === 'high');

    return {
      timestamp: now,
      totalThreats: this.detectedThreats.length,
      recentThreats: recentThreats.length,
      criticalThreats: criticalThreats.length,
      highThreats: highThreats.length,
      suspiciousActivities: this.suspiciousActivities.length,
      threatLevel: this.calculateThreatLevel(),
      recommendations: this.generateRecommendations(),
    };
  }

  private calculateThreatLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const recentThreats = this.detectedThreats.filter(
      t => Date.now() - t.timestamp < 60000
    );

    const criticalCount = recentThreats.filter(t => t.severity === 'critical').length;
    const highCount = recentThreats.filter(t => t.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (recentThreats.length > 5) return 'medium';
    return 'low';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.getSecurityReport();

    if (report.criticalThreats > 0) {
      recommendations.push('تفعيل وضع الحماية العالي فوراً');
      recommendations.push('مراجعة سجلات الأمان بشكل فوري');
    }

    if (report.highThreats > 0) {
      recommendations.push('زيادة المراقبة الأمنية');
      recommendations.push('فحص النظام بحثاً عن الثغرات');
    }

    if (report.suspiciousActivities > 50) {
      recommendations.push('تحديث قواعد الحماية');
      recommendations.push('مراجعة سياسات الوصول');
    }

    return recommendations;
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const threatDetectionEngine = new ThreatDetectionEngine();
