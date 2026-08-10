// src/core/security/IntrusionDetectionSystem.ts
import { createLogger } from '../logging/Logger';

export interface SuspiciousConnection {
  ip: string;
  score: number;
  timestamp: number;
  count: number;
}

export interface RequestLog {
  ip: string;
  method: string;
  url: string;
  timestamp: number;
  score: number;
  allowed: boolean;
}

export interface MonitoringResult {
  allowed: boolean;
  reason: string;
  score: number;
  threats: string[];
}

export class IntrusionDetectionSystem {
  private logger = createLogger('IDS');
  private suspiciousConnections: SuspiciousConnection[] = [];
  private blockedIPs = new Set<string>();
  private trustedIPs = new Set<string>();
  private requestHistory: RequestLog[] = [];
  private maxFlows = 10000;

  constructor() {
    this.initializeTrustedIPs();
  }

  private initializeTrustedIPs(): void {
    this.trustedIPs.add('127.0.0.1');
    this.trustedIPs.add('localhost');
    this.trustedIPs.add('::1');
    this.trustedIPs.add('192.168.1.0/24');
    this.trustedIPs.add('10.0.0.0/8');
  }

  monitorRequest(request: {
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }): MonitoringResult {
    const result: MonitoringResult = {
      allowed: true,
      reason: 'OK',
      score: 0,
      threats: [],
    };

    if (this.blockedIPs.has(request.ip)) {
      result.allowed = false;
      result.reason = 'IP blocked';
      result.score = 100;
      this.logger.warn('Blocked IP attempted connection', { ip: request.ip });
      return result;
    }

    const suspiciousScore = this.analyzeSuspiciousPatterns(request);
    result.score += suspiciousScore;

    const signatureScore = this.checkAttackSignatures(request);
    result.score += signatureScore;

    const anomalyScore = this.detectBehavioralAnomalies(request);
    result.score += anomalyScore;

    result.score = Math.min(result.score, 100);

    if (result.score > 80) {
      result.allowed = false;
      result.reason = 'High threat score';
      this.blockIP(request.ip);
      this.logger.error('High threat request blocked', {
        ip: request.ip,
        score: result.score,
      });
    } else if (result.score > 50) {
      result.allowed = true;
      result.reason = 'Medium threat - monitored';
      this.recordSuspiciousConnection(request.ip, result.score);
    }

    this.logRequest(request, result);
    return result;
  }

  private analyzeSuspiciousPatterns(request: {
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }): number {
    let score = 0;

    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(request.method)) {
      score += 20;
    }

    const suspiciousHeaders = ['x-forwarded-for', 'x-original-url', 'x-rewrite-url'];
    for (const header of suspiciousHeaders) {
      if (header in request.headers) {
        score += 15;
      }
    }

    if (request.url.includes('..') || request.url.includes('%2e%2e')) {
      score += 30;
    }

    if (/(\bunion\b|\bselect\b|\bdrop\b|\binsert\b)/i.test(request.url)) {
      score += 40;
    }

    return Math.min(score, 100);
  }

  private checkAttackSignatures(request: {
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }): number {
    let score = 0;

    const signatures = [
      { pattern: /<script/i, score: 40, name: 'XSS' },
      { pattern: /union.*select/i, score: 50, name: 'SQL Injection' },
      { pattern: /\.\.\//g, score: 35, name: 'Path Traversal' },
      { pattern: /eval\s*\(/i, score: 45, name: 'Code Injection' },
      { pattern: /exec\s*\(/i, score: 45, name: 'Command Injection' },
      { pattern: /system\s*\(/i, score: 45, name: 'System Command' },
      { pattern: /base64_decode/i, score: 30, name: 'Encoding Bypass' },
    ];

    const fullContent = `${request.url}${request.body || ''}`;

    for (const sig of signatures) {
      if (sig.pattern.test(fullContent)) {
        score += sig.score;
        this.logger.warn(`Attack signature detected: ${sig.name}`, { ip: request.ip });
      }
    }

    return Math.min(score, 100);
  }

  private detectBehavioralAnomalies(request: {
    ip: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }): number {
    let score = 0;

    const ipRequests = this.requestHistory.filter(
      r => r.ip === request.ip && Date.now() - r.timestamp < 60000
    );

    if (ipRequests.length > 100) {
      score += 50;
      this.logger.warn('Potential DDoS detected', { ip: request.ip, requests: ipRequests.length });
    }

    if (ipRequests.length > 10) {
      const methods = ipRequests.map(r => r.method);
      const uniqueMethods = new Set(methods).size;
      if (uniqueMethods > 3) {
        score += 25;
      }
    }

    if (request.body && request.body.length > 1000000) {
      score += 30;
    }

    if (!request.headers['user-agent']) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    this.logger.error('IP blocked', { ip });

    setTimeout(() => {
      this.blockedIPs.delete(ip);
      this.logger.info('IP unblocked', { ip });
    }, 60 * 60 * 1000);
  }

  private recordSuspiciousConnection(ip: string, score: number): void {
    this.suspiciousConnections.push({
      ip,
      score,
      timestamp: Date.now(),
      count: 1,
    });

    if (this.suspiciousConnections.length > 1000) {
      this.suspiciousConnections = this.suspiciousConnections.slice(-1000);
    }
  }

  private logRequest(request: any, result: MonitoringResult): void {
    this.requestHistory.push({
      ip: request.ip,
      method: request.method,
      url: request.url,
      timestamp: Date.now(),
      score: result.score,
      allowed: result.allowed,
    });

    if (this.requestHistory.length > this.maxFlows) {
      this.requestHistory = this.requestHistory.slice(-this.maxFlows);
    }
  }

  getSuspiciousConnections(): SuspiciousConnection[] {
    return this.suspiciousConnections;
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

export const intrusionDetectionSystem = new IntrusionDetectionSystem();
