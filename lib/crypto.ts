import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'basiths-radar-secure-encryption-key-32b'; // 32 chars
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt a string (e.g. WhatsApp phone number) before database storage
 */
export function encryptText(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

/**
 * Decrypt an encrypted string from database storage
 */
export function decryptText(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  if (!encryptedText.includes(':')) return encryptedText; // Already plain text
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) return encryptedText;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return encryptedText;
  }
}
