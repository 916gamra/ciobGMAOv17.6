import { WindowsBridge } from './windowsBridge';

/**
 * DPAPI (Data Protection API) Security Service
 * Encrypts sensitive credentials and secrets using DPAPI on Windows Desktop,
 * with WebCrypto AES-GCM memory fallback on browser/PWA runtimes.
 */
export class DPAPIEncryptionService {
  private static fallbackSecretKey: CryptoKey | null = null;

  private static async getFallbackKey(): Promise<CryptoKey> {
    if (!this.fallbackSecretKey) {
      this.fallbackSecretKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }
    return this.fallbackSecretKey;
  }

  static async encrypt(plaintext: string): Promise<string> {
    if (WindowsBridge.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        return await invoke('encrypt_sensitive_data', { plaintext });
      } catch (e) {
        console.warn('[DPAPI] Native DPAPI encrypt fallback to WebCrypto', e);
      }
    }

    // WebCrypto Fallback
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const key = await this.getFallbackKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedBase64: string): Promise<string> {
    if (WindowsBridge.isNative()) {
      try {
        const invoke = (window as any).__TAURI__.invoke;
        return await invoke('decrypt_sensitive_data', { encrypted: encryptedBase64 });
      } catch (e) {
        console.warn('[DPAPI] Native DPAPI decrypt fallback to WebCrypto', e);
      }
    }

    // WebCrypto Fallback
    const combinedStr = atob(encryptedBase64);
    const combined = Uint8Array.from(combinedStr, c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const key = await this.getFallbackKey();
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }
}
