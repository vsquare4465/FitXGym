import nodemailer from 'nodemailer';
import { prisma } from '../db.js';
import { normalizeWhatsAppNumber } from './whatsapp.js';

const DEFAULT_FROM = 'Fit X Gym <deepaksolanki@fitxgymkhurja.com>';
const DEFAULT_SMTP_USER = 'deepaksolanki@fitxgymkhurja.com';

function fromAddress(): string {
  return process.env.OTP_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

async function sendOtpEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER?.trim() || DEFAULT_SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (smtpPass) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || 'smtpout.secureserver.net',
      port,
      secure: process.env.SMTP_SECURE !== 'false' && port === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: fromAddress(),
      to,
      subject,
      text,
      html,
    });
    return true;
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
    }
    return true;
  }

  return false;
}

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
  const html = `
    <p>Hi ${opts.name || 'there'},</p>
    <p>Your <strong>${gymName}</strong> admin password reset code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:bold">${opts.code}</p>
    <p>It expires in 15 minutes. Do not share this code.</p>
    <p>— ${gymName}</p>
  `;

  if (opts.email) {
    try {
      const ok = await sendOtpEmail(opts.email, `${gymName} password reset code`, text, html);
      if (ok) sent.push('email');
    } catch (err) {
      console.warn('[otp] email send failed:', err instanceof Error ? err.message : err);
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
    } catch (err) {
      console.warn('[otp] whatsapp send failed:', err instanceof Error ? err.message : err);
    }
  }

  const fast2sms = process.env.FAST2SMS_API_KEY;
  if (fast2sms && last10.length === 10) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2sms)}&route=otp&variables_values=${encodeURIComponent(opts.code)}&flash=0&numbers=${last10}`;
      const res = await fetch(url);
      if (res.ok) sent.push('sms');
    } catch (err) {
      console.warn('[otp] sms send failed:', err instanceof Error ? err.message : err);
    }
  }

  if (sent.length === 0) {
    console.warn(`[otp] No delivery channel sent a code for ${opts.email}. Set SMTP_PASS (GoDaddy mailbox ${DEFAULT_SMTP_USER}) or RESEND_API_KEY. An owner can still generate a code from Team.`);
  }

  return sent;
}
