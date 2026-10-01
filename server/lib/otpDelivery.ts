import { prisma } from '../db.js';
import { normalizeWhatsAppNumber } from './whatsapp.js';

export async function deliverPasswordOtp(opts: {
  name: string;
  email: string;
  phone?: string | null;
  code: string;
}): Promise<string[]> {
  const sent: string[] = [];
  const gymRows = await prisma.websiteSetting.findMany({
    where: { key: { in: ['gymName'] } },
  });
  const gymName = gymRows.find(r => r.key === 'gymName')?.value || 'Fit X Gym';
  const text = `${gymName} password reset code: ${opts.code}. It expires in 15 minutes. Do not share this code.`;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.OTP_FROM_EMAIL;
  if (resendKey && fromEmail && opts.email) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [opts.email],
          subject: `${gymName} password reset code`,
          text,
        }),
      });
      if (res.ok) sent.push('email');
    } catch {
      /* email optional */
    }
  }

  const wa = normalizeWhatsAppNumber(opts.phone || '');
  const last10 = wa.slice(-10);
  const callmeKey = process.env.CALLMEBOT_APIKEY;
  if (callmeKey && wa) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${wa}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(callmeKey)}`;
      const res = await fetch(url);
      if (res.ok) sent.push('whatsapp');
    } catch {
      /* whatsapp optional */
    }
  }

  const fast2sms = process.env.FAST2SMS_API_KEY;
  if (fast2sms && last10.length === 10) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2sms)}&route=otp&variables_values=${encodeURIComponent(opts.code)}&flash=0&numbers=${last10}`;
      const res = await fetch(url);
      if (res.ok) sent.push('sms');
    } catch {
      /* sms optional */
    }
  }

  if (sent.length === 0) {
    console.warn(`[otp] No delivery channel sent a code for ${opts.email}. Set RESEND_API_KEY + OTP_FROM_EMAIL, FAST2SMS_API_KEY, or CALLMEBOT_APIKEY. An owner can still generate a code from Team.`);
  }

  return sent;
}
