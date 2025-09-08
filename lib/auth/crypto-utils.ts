/**
 * Browser-compatible crypto utilities for GameGen authentication
 */

/**
 * Generate random bytes using Web Crypto API
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert bytes to base32
 */
export function toBase32(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let buffer = 0;
  let bufferLength = 0;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];

    buffer = (buffer << 8) | byte;
    bufferLength += 8;

    while (bufferLength >= 5) {
      result += alphabet[(buffer >>> (bufferLength - 5)) & 0x1f];
      bufferLength -= 5;
    }
  }

  if (bufferLength > 0) {
    result += alphabet[(buffer << (5 - bufferLength)) & 0x1f];
  }

  return result;
}

/**
 * Convert base32 to bytes
 */
export function fromBase32(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes: number[] = [];
  let buffer = 0;
  let bufferLength = 0;

  for (const char of base32.toUpperCase()) {
    const value = alphabet.indexOf(char);

    if (value === -1) continue;

    buffer = (buffer << 5) | value;
    bufferLength += 5;

    if (bufferLength >= 8) {
      bytes.push((buffer >>> (bufferLength - 8)) & 0xff);
      bufferLength -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Create SHA-256 hash
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = new Uint8Array(hashBuffer);

  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create HMAC-SHA1 (for TOTP)
 */
export async function hmacSha1(
  key: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);

  return new Uint8Array(signature);
}

/**
 * Generate secure random string for backup codes
 */
export function generateSecureRandomString(length: number): string {
  const chars = "0123456789";
  const randomValues = randomBytes(length);

  return Array.from(randomValues)
    .map((byte) => chars[byte % chars.length])
    .join("");
}
