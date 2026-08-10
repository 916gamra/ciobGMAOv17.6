// src/core/security/SecurityMiddleware.ts
import { securityManager } from './SecurityManager';
import { createLogger } from '../logging/Logger';

const logger = createLogger('SecurityMiddleware');

export function interceptAndInspect(req: {
  ip?: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const ip = req.ip || '127.0.0.1';
  const method = req.method;
  const url = req.url;
  const headers = req.headers || {};
  const bodyStr = req.body ? JSON.stringify(req.body) : '';

  // 1. Intrusion Detection
  const idsResult = securityManager.monitorNetworkRequest({
    ip,
    method,
    url,
    headers,
    body: bodyStr,
  });

  if (!idsResult.allowed) {
    logger.warn('Request blocked by IDS', { url, reason: idsResult.reason });
    return {
      allowed: false,
      status: 403,
      error: 'Access denied by Military Grade Security System',
    };
  }

  // 2. Threat Detection
  const threatResult = securityManager.scanAndValidateInput(bodyStr, url);
  if (!threatResult.isSafe) {
    logger.warn('Request blocked by Threat Detection', { url, score: threatResult.score });
    return {
      allowed: false,
      status: 400,
      error: 'Malicious payload detected and blocked',
    };
  }

  return {
    allowed: true,
    status: 200,
  };
}
