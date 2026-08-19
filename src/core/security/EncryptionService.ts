/// <reference types="vite/client" />
import CryptoJS from 'crypto-js';
import { securitySession } from './session/securitySessionStore';

export class EncryptionService {
  private static readonly PRIMARY_LEGACY_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'titanic-nexus-grand-master-secure-key-v1';
  private static readonly FALLBACK_KEY = 'bdr-nexus-grand-master-secure-key-v17';

  /**
   * Derives cryptographic session key bytes from a user PIN and salt using PBKDF2 (200,000 iterations)
   */
  static async deriveKeyFromPin(pin: string, salt: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 200000,
        salt: encoder.encode(salt)
      },
      keyMaterial,
      256
    );

    return new Uint8Array(derivedBits);
  }

  /**
   * Retrieves active session key string for AES operations
   */
  private static getActiveKey(): string {
    const secret = securitySession.getActiveSecret();
    let binary = '';
    for (let i = 0; i < secret.length; i++) {
      binary += String.fromCharCode(secret[i]);
    }
    return btoa(binary) + EncryptionService.FALLBACK_KEY;
  }

  /**
   * Encrypts any serializable data using AES-256 with active session key
   */
  static encrypt(data: any): string {
    const jsonString = JSON.stringify(data);
    const key = EncryptionService.getActiveKey();
    const encrypted = CryptoJS.AES.encrypt(jsonString, key);
    return encrypted.toString();
  }

  /**
   * Attempts to decrypt an AES-256 string with a specific key safely without throwing
   */
  private static tryDecryptWithKey<T = any>(encrypted: string, key: string): T | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, key);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      if (!jsonString || jsonString.length === 0) {
        return null;
      }
      return JSON.parse(jsonString) as T;
    } catch {
      return null;
    }
  }

  /**
   * Decrypts an AES-256 encrypted string back to its original object.
   * Gracefully tries active session key followed by legacy keys for seamless backward compatibility.
   */
  static decrypt<T = any>(encrypted: string): T | null {
    if (!encrypted) return null;

    const activeKey = EncryptionService.getActiveKey();
    const candidateKeys = Array.from(new Set([
      activeKey,
      EncryptionService.PRIMARY_LEGACY_KEY,
      'titanic-nexus-grand-master-secure-key-v1',
      EncryptionService.FALLBACK_KEY
    ]));

    for (const key of candidateKeys) {
      const decrypted = EncryptionService.tryDecryptWithKey<T>(encrypted, key);
      if (decrypted !== null) {
        return decrypted;
      }
    }

    return null;
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
