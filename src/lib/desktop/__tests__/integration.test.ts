import { describe, test, expect } from 'vitest';
import { WindowsBridge } from '../windowsBridge';
import { WindowsRegistry } from '../windowsRegistry';
import { DPAPIEncryptionService } from '../dpapiEncryption';
import { AuditTrailService } from '../securityAudit';
import { localDesktopDB } from '../localDatabase';
import { BackupRestoreService } from '../backupRestore';

describe('BDR Nexus / ciobGMAO Native Windows Integration Suite', () => {
  test('System Info Bridge Returns Valid Architecture', async () => {
    const sysInfo = await WindowsBridge.getSystemInfo();
    expect(sysInfo).toBeDefined();
    expect(sysInfo.arch).toBe('x64');
  });

  test('Registry Read & Write Fallback Operation', async () => {
    await WindowsRegistry.writeSetting('TestKey', 'TestVal123');
    const val = await WindowsRegistry.readSetting('TestKey');
    expect(val).toBe('TestVal123');
  });

  test('DPAPI Encryption and Decryption Roundtrip', async () => {
    const plaintext = 'Secret_Industrial_Key_2026';
    const encrypted = await DPAPIEncryptionService.encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);

    const decrypted = await DPAPIEncryptionService.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test('Audit Trail Hash-Chaining Integrity Verification', async () => {
    const event1 = await AuditTrailService.logEvent('USER_01', 'CREATE', 'MACHINE', 'MCH-001');
    const event2 = await AuditTrailService.logEvent('USER_01', 'MAINTAIN', 'MACHINE', 'MCH-001');

    const isValid = await AuditTrailService.verifyChainIntegrity([event1, event2]);
    expect(isValid).toBe(true);
  });

  test('Offline Database Enqueue and Backup Archive Creation', async () => {
    await localDesktopDB.syncQueue.put({
      id: 'TEST_Q_1',
      entityType: 'MACHINE',
      entityId: 'MCH-999',
      action: 'CREATE',
      payload: { ref: 'MCH-999' },
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    });

    const queueCount = await localDesktopDB.syncQueue.count();
    expect(queueCount).toBeGreaterThan(0);

    const backupResult = await BackupRestoreService.exportBackup();
    expect(backupResult).toBeDefined();
  });
});
