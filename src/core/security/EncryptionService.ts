/// <reference types="vite/client" />
import CryptoJS from 'crypto-js';

export class EncryptionService {
  // Using a fallback key for development if no env variable is present.
  // In a real production scenario, this should STRICTLY come from env/backend.
  private static readonly KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'titanic-nexus-grand-master-secure-key-v1';
  
  /**
   * Encrypts any serializable data using AES-256
   */
  static encrypt(data: any): string {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, this.KEY);
    return encrypted.toString();
  }

  /**
   * Decrypts an AES-256 encrypted string back to its original object
   */
  static decrypt<T = any>(encrypted: string): T | null {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        return null;
      }

      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Decryption failed', error);
      return null;
    }
  }

  /**
   * Hashes a string using SHA-256 (One-way, for passwords/signatures)
   */
  static hash(value: string): string {
    return CryptoJS.SHA256(value).toString();
  }

  /**
   * Verifies if a raw string matches a hashed string
   */
  static verify(raw: string, hashed: string): boolean {
    return this.hash(raw) === hashed;
  }
}
