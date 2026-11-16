import bcrypt from '@fitx/password';
import { prisma } from '@fitx/db';

const OTP_TTL_MS = 15 * 60 * 1000;

export function generateOtp(): string {
  // Rejection sampling avoids modulo bias and Math.random's predictability.
  let value: number;
  do { value = crypto.getRandomValues(new Uint32Array(1))[0]; } while (value >= 4294800000);
  return String(100000 + (value % 900000));
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

  const consumed = await prisma.passwordOtp.updateMany({ where: { id: row.id, used: false }, data: { used: true } });
  return consumed.count === 1;
}

export const OTP_EXPIRES_MINUTES = 15;
