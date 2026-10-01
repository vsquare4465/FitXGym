export interface WhatsAppTemplate {
  id: string;
  label: string;
  template: string;
  broadcast?: boolean;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'welcome',
    label: 'Welcome message',
    template: 'Hi {{memberName}}, welcome to {{gymName}}! Your {{membershipName}} membership is now active. See you at the gym!',
  },
  {
    id: 'payment_reminder',
    label: 'Payment reminder',
    template: 'Hi {{memberName}}, this is {{gymName}}. We hope you\'re enjoying your workouts! This is a gentle reminder that your membership payment of {{pendingAmount}} is still pending. Please visit the front desk or reply here on WhatsApp — we\'re happy to help. Thank you for being part of our gym family!',
  },
  {
    id: 'expiry_reminder',
    label: 'Expiry reminder',
    template: 'Hi {{memberName}}, your {{membershipName}} membership at {{gymName}} expires on {{expiryDate}}. Renew early to avoid interruption.',
  },
  {
    id: 'holiday',
    label: 'Holiday / closed',
    broadcast: true,
    template: 'Hi from {{gymName}}! Please note: the gym will remain CLOSED on {{customDate}} for {{customReason}}. Regular hours resume the next working day. Thank you!',
  },
  {
    id: 'rain_off',
    label: 'Rain / weather off',
    broadcast: true,
    template: 'Hi from {{gymName}}! Due to heavy rain / weather today, the gym will remain CLOSED for safety. We will update you when we reopen. Stay safe!',
  },
  {
    id: 'timing_change',
    label: 'Timing change',
    broadcast: true,
    template: 'Hi from {{gymName}}! Our gym timings have changed: {{customHours}}. Please plan your visit accordingly. Thank you!',
  },
  {
    id: 'general_broadcast',
    label: 'General announcement',
    broadcast: true,
    template: 'Hi from {{gymName}}! {{customMessage}}',
  },
  {
    id: 'general',
    label: 'Personal message',
    template: 'Hi {{memberName}}, this is {{gymName}}. ',
  },
];

export const BROADCAST_TEMPLATES = WHATSAPP_TEMPLATES.filter(t => t.broadcast);

export function fillTemplate(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

export function normalizeWhatsAppNumber(raw?: string): string {
  if (!raw?.trim()) return '';
  let v = raw.trim().replace(/^@+/, '');
  const fromLink = v.match(/wa\.me\/(?:\+)?(\d+)/i) || v.match(/[?&]phone=(\+?\d+)/i);
  if (fromLink) v = fromLink[1];
  let digits = v.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) return digits;
  return '';
}

export function whatsappUrl(phone: string, message = ''): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return '';
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Opens WhatsApp so user can pick contacts (works best on mobile). */
export function whatsappPickContactsUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string) {
  const url = whatsappUrl(phone, message);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openWhatsAppPicker(message: string) {
  window.open(whatsappPickContactsUrl(message), '_blank', 'noopener,noreferrer');
}

/** Send to multiple members one-by-one (user confirms each chat). */
export async function sendBulkWhatsApp(
  recipients: { phone: string; name: string }[],
  messageFor: (name: string) => string,
  delayMs = 800,
): Promise<number> {
  let sent = 0;
  for (const r of recipients) {
    const msg = messageFor(r.name);
    openWhatsApp(r.phone, msg);
    sent += 1;
    if (sent < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return sent;
}
