// src/core/security/EncryptionAdvanced.ts
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('EncryptionAdvanced');

export class EncryptionAdvanced {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  /**
   * Generates a cryptographic key from a master password/seed
   */
  private static async getKey(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('BDR_NEXUS_SALT_2026'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plain text using AES-GCM
   */
  static async encrypt(plainText: string, secretKey: string = 'nexus-aes-gcm-master'): Promise<string> {
    try {
      const cryptoKey = await this.getKey(secretKey);
      const enc = new TextEncoder();
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        cryptoKey,
        enc.encode(plainText)
      );

      // Package iv + cipher text in hex or base64 format
      const encryptedBytes = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedBytes.length);
      combined.set(iv, 0);
      combined.set(encryptedBytes, iv.length);

      // Convert combined buffer to Base64
      return btoa(String.fromCharCode(...combined));
    } catch (err) {
      logger.error('AES-GCM Encryption failed', err);
      throw err;
    }
  }

  /**
   * Decrypts encrypted text using AES-GCM
   */
  static async decrypt(encryptedBase64: string, secretKey: string = 'nexus-aes-gcm-master'): Promise<string> {
    try {
      const cryptoKey = await this.getKey(secretKey);
      const dec = new TextDecoder();
      
      // Convert combined Base64 back to binary array
      const binaryString = atob(encryptedBase64);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }

      const iv = combined.slice(0, 12);
      const cipherText = combined.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        cryptoKey,
        cipherText
      );

      return dec.decode(decryptedBuffer);
    } catch (err) {
      logger.error('AES-GCM Decryption failed', err);
      throw err;
    }
  }
}
