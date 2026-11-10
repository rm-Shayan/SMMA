import crypto from 'crypto';
import { env } from '../config/env.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts sensitive data (access tokens, API secrets) using AES-256-GCM.
 */
export function encryptData(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data encrypted with AES-256-GCM.
 */
export function decryptData(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const [ivHex, authTagHex, encryptedData] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encryptedData) return cipherText;

    const key = Buffer.from(env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // If text was plaintext (legacy), return as-is
    return cipherText;
  }
}
