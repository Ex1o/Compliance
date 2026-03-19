import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LEN    = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? '';
  if (hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64-char hex');
  return Buffer.from(hex, 'hex');
}

export function encryptField(plain: string): string {
  const key = getKey();
  const iv  = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptField(data: string): string {
  const [ivH, tagH, ctH] = data.split(':');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivH, 'hex'));
  decipher.setAuthTag(Buffer.from(tagH, 'hex'));
  return decipher.update(Buffer.from(ctH, 'hex')) + decipher.final('utf8');
}

export function hashField(value: string): string {
  return crypto.createHmac('sha256', getKey()).update(value.trim().toLowerCase()).digest('hex');
}

export function validateGstin(gstin: string): boolean {
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) return false;
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = chars.indexOf(gstin[i]);
    const w = v * (i % 2 === 0 ? 1 : 2);
    sum += w < 36 ? w : Math.floor(w / 36) + (w % 36);
  }
  return chars[(36 - (sum % 36)) % 36] === gstin[14];
}
