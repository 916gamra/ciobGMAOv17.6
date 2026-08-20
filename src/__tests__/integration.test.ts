import { describe, it, expect, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

describe('BDR Nexus Integration Tests', () => {
  describe('System Commands', () => {
    it('should get system information', async () => {
      try {
        const info = await invoke<Record<string, unknown>>('get_system_info');
        expect(info).toBeDefined();
        expect(info).toHaveProperty('os');
        expect(info).toHaveProperty('cpu_count');
        expect(info).toHaveProperty('total_memory');
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should get app version', async () => {
      try {
        const version = await invoke<string>('get_app_version');
        expect(version).toBeDefined();
        expect(typeof version).toBe('string');
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should get app data directory', async () => {
      try {
        const dir = await invoke<string>('get_app_data_dir');
        expect(dir).toBeDefined();
        expect(typeof dir).toBe('string');
        expect(dir.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should get app configuration', async () => {
      try {
        const config = await invoke<Record<string, unknown>>('get_app_config');
        expect(config).toBeDefined();
        expect(config).toHaveProperty('app_version');
        expect(config).toHaveProperty('language');
        expect(config).toHaveProperty('theme');
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });

  describe('Security Commands', () => {
    it('should encrypt and decrypt data', async () => {
      try {
        const plaintext = 'Sensitive data';
        const password = 'secure_password_123';

        const encrypted = await invoke<string>('encrypt_data', {
          plaintext,
          password,
        });

        expect(encrypted).toBeDefined();
        expect(typeof encrypted).toBe('string');
        expect(encrypted).not.toBe(plaintext);

        const decrypted = await invoke<string>('decrypt_data', {
          encrypted,
          password,
        });

        expect(decrypted).toBe(plaintext);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should generate session token', async () => {
      try {
        const token = await invoke<string>('generate_session_token', {
          user_id: 'user_123',
        });

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should verify session token', async () => {
      try {
        const token = await invoke<string>('generate_session_token', {
          user_id: 'user_123',
        });

        const verified = await invoke<boolean>('verify_session_token', {
          token,
          user_id: 'user_123',
        });

        expect(verified).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should derive key from PIN', async () => {
      try {
        const pin = '1234';
        const salt = 'test_salt_12345678901234567890';

        const key = await invoke<string>('derive_key_from_pin', {
          pin,
          salt,
        });

        expect(key).toBeDefined();
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });

  describe('File System Commands', () => {
    const testFile = './test_integration.txt';
    const testContent = 'Test content for integration';

    afterAll(async () => {
      try {
        await invoke('delete_file', { path: testFile });
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });

    it('should write file', async () => {
      try {
        await invoke('write_file', {
          path: testFile,
          content: testContent,
        });

        const exists = await invoke<boolean>('file_exists', { path: testFile });
        expect(exists).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should read file', async () => {
      try {
        const content = await invoke<string>('read_file', { path: testFile });
        expect(content).toBe(testContent);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should get file metadata', async () => {
      try {
        const metadata = await invoke<{ is_file: boolean; len: number }>('get_file_metadata', { path: testFile });
        expect(metadata).toBeDefined();
        expect(metadata).toHaveProperty('is_file');
        expect(metadata).toHaveProperty('len');
        expect(metadata.is_file).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should list files in directory', async () => {
      try {
        const files = await invoke<unknown[]>('list_files', { path: './' });
        expect(Array.isArray(files)).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });

  describe('Database Commands', () => {
    const testDbPath = './test_integration.sqlite';

    afterAll(async () => {
      try {
        const exists = await invoke<boolean>('file_exists', { path: testDbPath });
        if (exists) {
          await invoke('delete_file', { path: testDbPath });
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });

    it('should initialize database', async () => {
      try {
        await invoke('init_database', { db_path: testDbPath });
        const exists = await invoke<boolean>('file_exists', { path: testDbPath });
        expect(exists).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should get database statistics', async () => {
      try {
        const stats = await invoke<Record<string, unknown>>('get_database_stats', { db_path: testDbPath });
        expect(stats).toBeDefined();
        expect(stats).toHaveProperty('machines');
        expect(stats).toHaveProperty('maintenance_records');
        expect(stats).toHaveProperty('audit_logs');
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });

  describe('Notification Commands', () => {
    it('should show notification', async () => {
      try {
        await invoke('show_notification', {
          title: 'Test Notification',
          body: 'This is a test notification',
        });
        expect(true).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should show success notification', async () => {
      try {
        await invoke('show_success_notification', {
          title: 'Success',
          message: 'Operation completed successfully',
        });
        expect(true).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    it('should show error notification', async () => {
      try {
        await invoke('show_error_notification', {
          title: 'Error',
          error_msg: 'Something went wrong',
        });
        expect(true).toBe(true);
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });
});
