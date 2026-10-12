import nodemailer from 'nodemailer';
import { prisma } from '../db.js';
import { isProd } from './config.js';
import { normalizeWhatsAppNumber } from './whatsapp.js';

const DEFAULT_FROM = 'Fit X Gym <deepaksolanki@fitxgymkhurja.com>';
const DEFAULT_SMTP_USER = 'deepaksolanki@fitxgymkhurja.com';

function fromAddress(): string {
  return process.env.OTP_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

function smtpUser(): string {
  return process.env.SMTP_USER?.trim() || DEFAULT_SMTP_USER;
}

function smtpPass(): string {
  return (process.env.SMTP_PASS || process.env.MAIL_PASSWORD || '').trim();
}

export function otpEmailConfigured(): boolean {
  return Boolean(smtpPass() || process.env.RESEND_API_KEY?.trim());
}

export function otpWhatsappConfigured(): boolean {
  return Boolean(
    (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) ||
    process.env.CALLMEBOT_APIKEY,
  );
}

type SmtpTry = { host: string; port: number; secure: boolean };

function smtpAttempts(): SmtpTry[] {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  if (host && port) {
    return [{ host, port, secure: process.env.SMTP_SECURE !== 'false' && port === 465 }];
  }
  if (host) {
    return [
      { host, port: 465, secure: true },
      { host, port: 587, secure: false },
    ];
  }
  return [
    { host: 'smtpout.secureserver.net', port: 465, secure: true },
    { host: 'smtpout.secureserver.net', port: 587, secure: false },
    { host: 'smtp.office365.com', port: 587, secure: false },
  ];
}

async function sendViaSmtp(to: string, subject: string, text: string, html: string): Promise<void> {
  const pass = smtpPass();
  if (!pass) throw new Error('SMTP_PASS is not set on the server');
  const user = smtpUser();
  let lastError = 'SMTP failed';
  for (const attempt of smtpAttempts()) {
    try {
      const transporter = nodemailer.createTransport({
        host: attempt.host,
        port: attempt.port,
        secure: attempt.secure,
        auth: { user, pass },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 15000,
        tls: { minVersion: 'TLSv1.2' },
      });
      await transporter.sendMail({ from: fromAddress(), to, subject, text, html });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[otp] SMTP ${attempt.host}:${attempt.port} failed: ${lastError}`);
    }
  }
  throw new Error(lastError);
}

async function sendViaResend(to: string, subject: string, text: string, html: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) throw new Error('RESEND_API_KEY is not set');

  const tryFrom = async (from: string) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend ${res.status}: ${body.slice(0, 240)}`);
    }
  };

  try {
    await tryFrom(fromAddress());
  } catch (err) {
    console.warn('[otp] Resend custom from failed:', err instanceof Error ? err.message : err);
    await tryFrom('Fit X Gym <beth.t@example.com>');
  }
}

async function sendOtpEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  if (smtpPass()) {
    await sendViaSmtp(to, subject, text, html);
    return true;
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend(to, subject, text, html);
    return true;
  }
  return false;
}

async function sendWhatsAppCloud(to: string, body: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`WhatsApp Cloud ${res.status}: ${detail.slice(0, 240)}`);
  }
  return true;
}

async function sendCallMeBot(to: string, text: string): Promise<boolean> {
  const key = process.env.CALLMEBOT_APIKEY?.trim();
  if (!key) return false;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${to}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const body = await res.text().catch(() => '');
  if (!res.ok || /invalid|error|not authorized/i.test(body)) {
    throw new Error(`CallMeBot: ${body.slice(0, 200) || res.status}`);
  }
  return true;
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

  if (!isProd) {
    console.log(`[otp] ${opts.email} code ${opts.code} (logged in development only)`);
  }

  if (opts.email) {
    try {
      const ok = await sendOtpEmail(opts.email, `${gymName} password reset code`, text, html);
      if (ok) sent.push('email');
    } catch (err) {
      console.warn('[otp] email send failed:', err instanceof Error ? err.message : err);
    }
  }

  const wa = normalizeWhatsAppNumber(opts.phone || '');
  if (wa) {
    try {
      if (await sendWhatsAppCloud(wa, text)) sent.push('whatsapp');
      else if (await sendCallMeBot(wa, text)) sent.push('whatsapp');
    } catch (err) {
      console.warn('[otp] whatsapp send failed:', err instanceof Error ? err.message : err);
    }
  }

  const last10 = wa.slice(-10);
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
    console.warn(
      `[otp] Nothing delivered for ${opts.email}. Email needs SMTP_PASS (mailbox password for ${DEFAULT_SMTP_USER}) or RESEND_API_KEY. WhatsApp needs WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID (and a mobile on the staff profile).`,
    );
  }

  return sent;
}

export function otpNotConfiguredMessage(): string {
  return 'Could not send the OTP. On Render add SMTP_PASS = the password of deepaksolanki@fitxgymkhurja.com (GoDaddy email). WhatsApp OTP also needs a mobile number on the staff profile plus WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID. Until that is set, open Team → Reset code and share the 6-digit code.';
}
