import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
const magic = Buffer.from('FITXBAK1');
export function backupKey(hex) {
  if (!/^[a-f0-9]{64}$/i.test(hex || '')) throw new Error('A 64-character hexadecimal backup key is required.');
  return Buffer.from(hex, 'hex');
}
export function encrypt(bytes, key) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(magic);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([magic, nonce, cipher.getAuthTag(), ciphertext]);
}
export function decrypt(bytes, key) {
  if (bytes.length < 36 || !bytes.subarray(0, 8).equals(magic)) throw new Error('Invalid FitX backup format.');
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(8, 20));
  cipher.setAAD(magic);
  cipher.setAuthTag(bytes.subarray(20, 36));
  return Buffer.concat([cipher.update(bytes.subarray(36)), cipher.final()]);
}
