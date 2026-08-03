import { EncryptionService } from './EncryptionService';

export class SecureStorage {
  /**
   * Sets an encrypted item in localStorage
   */
  static setItem(key: string, value: any): void {
    try {
      const encrypted = EncryptionService.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`SecureStorage: Failed to save item for key [${key}]`, error);
    }
  }

  /**
   * Retrieves and decrypts an item from localStorage
   */
  static getItem<T = any>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      return EncryptionService.decrypt<T>(encrypted);
    } catch (error) {
      console.error(`SecureStorage: Failed to retrieve item for key [${key}]`, error);
      return null;
    }
  }

  /**
   * Removes an item from localStorage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all items in localStorage
   */
  static clear(): void {
    localStorage.clear();
  }
}
