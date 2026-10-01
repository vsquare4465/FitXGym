import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

const OTP_TTL_MS = 15 * 60 * 1000;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createPasswordOtp(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const code = generateOtp();
  await prisma.passwordOtp.updateMany({
    where: { email: normalized, used: false },
    data: { used: true },
  });
  await prisma.passwordOtp.create({
    data: {
      email: normalized,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function verifyAndConsumeOtp(email: string, code: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const otp = String(code || '').trim();
  if (!/^\d{6}$/.test(otp)) return false;

  const row = await prisma.passwordOtp.findFirst({
    where: { email: normalized, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return false;

  const ok = await bcrypt.compare(otp, row.codeHash);
  if (!ok) return false;

  await prisma.passwordOtp.update({ where: { id: row.id }, data: { used: true } });
  return true;
}

export const OTP_EXPIRES_MINUTES = 15;
