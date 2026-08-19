/**
 * Key Derivation Engine
 * Derives high-entropy session keys from PINs using PBKDF2 (SHA-256) and per-user salts
 */

const cryptoObj = (globalThis.crypto ?? (window as any).crypto) as Crypto;

export class KeyDerivationEngine {
  /**
   * Generates a 32-byte secure random salt in Base64 format
   */
  static generateSalt(): string {
    const saltBytes = new Uint8Array(32);
    cryptoObj.getRandomValues(saltBytes);
    let binary = '';
    for (let i = 0; i < saltBytes.length; i++) {
      binary += String.fromCharCode(saltBytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Derives a 256-bit session secret key from a PIN and user salt using PBKDF2
   */
  static async deriveSessionSecretFromPin(
    pin: string,
    saltBase64: string,
    iterations = 200000
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const saltBytes = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

    const keyMaterial = await cryptoObj.subtle.importKey(
      'raw',
      encoder.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await cryptoObj.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations,
        salt: saltBytes
      },
      keyMaterial,
      256 // 256 bits
    );

    return new Uint8Array(derivedBits);
  }
}
