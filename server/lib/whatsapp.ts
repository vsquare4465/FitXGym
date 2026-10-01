/** Store and match WhatsApp as country-code + 10-digit Indian mobile. */
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
