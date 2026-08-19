/**
 * Multi-Factor Authentication (MFA) TOTP Engine
 * Generates and verifies time-based one-time passwords using WebCrypto HMAC-SHA1
 */

const cryptoObj = (globalThis.crypto ?? (window as any).crypto) as Crypto;

export class MFAEngine {
  /**
   * Generates a 16-character base32 secret for TOTP setup
   */
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const randomBytes = new Uint8Array(16);
    cryptoObj.getRandomValues(randomBytes);
    let secret = '';
    for (let i = 0; i < randomBytes.length; i++) {
      secret += chars[randomBytes[i] % chars.length];
    }
    return secret;
  }

  /**
   * Decodes a Base32 secret string into a Uint8Array
   */
  private static decodeBase32(secret: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
    const bits: number[] = [];
    
    for (let i = 0; i < cleaned.length; i++) {
      const val = chars.indexOf(cleaned[i]);
      for (let b = 4; b >= 0; b--) {
        bits.push((val >> b) & 1);
      }
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      let byteVal = 0;
      for (let b = 0; b < 8; b++) {
        byteVal = (byteVal << 1) | bits[i * 8 + b];
      }
      bytes[i] = byteVal;
    }
    return bytes;
  }

  /**
   * Computes TOTP code for a given secret and timestamp
   */
  static async generateTOTPCode(secret: string, timeStepSeconds = 30, timestamp = Date.now()): Promise<string> {
    const timeIndex = Math.floor(timestamp / 1000 / timeStepSeconds);
    const keyBytes = this.decodeBase32(secret);

    const key = await cryptoObj.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, timeIndex, false); // Big endian 64-bit int lower 32 bits

    const hmacSig = await cryptoObj.subtle.sign('HMAC', key, timeBuffer);
    const sigBytes = new Uint8Array(hmacSig);

    const offset = sigBytes[sigBytes.length - 1] & 0x0f;
    const binaryCode =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);

    const code = (binaryCode % 1000000).toString().padStart(6, '0');
    return code;
  }

  /**
   * Verifies TOTP code allowing ±1 time step tolerance
   */
  static async verifyTOTP(secret: string, token: string): Promise<boolean> {
    if (!token || token.length !== 6) return false;

    const now = Date.now();
    const windowOffsets = [-30000, 0, 30000]; // ±1 timestep (30s)

    for (const offset of windowOffsets) {
      const code = await this.generateTOTPCode(secret, 30, now + offset);
      if (code === token) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generates a otpauth:// URI for QR Code rendering
   */
  static getOtpauthUri(label: string, secret: string, issuer = 'BDR Nexus GMAO'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }
}
