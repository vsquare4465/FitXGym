export function isValidEmail(email: string): boolean {
  const v = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** Indian mobile: 10 digits starting 6–9, or 91 + those 10 digits. */
export function isValidIndianPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return /^[6-9]\d{9}$/.test(d);
  if (d.length === 12) return /^91[6-9]\d{9}$/.test(d);
  if (d.length === 13 && d.startsWith('0')) return false;
  return false;
}

/** Optional rupees field — blank is allowed (unpaid). */
export function parseOptionalAmount(raw?: string | number | null): { value?: number; error?: string } {
  if (raw === undefined || raw === null) return {};
  const s = String(raw).trim();
  if (!s) return {};
  const n = Number(s.replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0) return { error: 'Enter a valid amount, or leave it blank if not paid yet.' };
  return { value: n };
}

export function phoneValidationMessage(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  if (d.length < 10) return 'Enter a 10-digit Indian mobile number.';
  if (!isValidIndianPhone(phone)) return 'Phone must be a valid 10-digit Indian mobile (start with 6–9).';
  return null;
}

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Optional 12-digit Aadhaar. Blank is allowed. */
export function isValidAadhaar(raw: string): boolean {
  return /^\d{12}$/.test(digitsOnly(raw));
}

export function aadhaarValidationMessage(raw: string): string | null {
  const d = digitsOnly(raw);
  if (!d) return null;
  if (d.length !== 12) return 'Enter a 12-digit Aadhaar number, or leave it blank.';
  return null;
}

export function maskAadhaar(raw?: string | null): string {
  const d = digitsOnly(raw || '');
  if (d.length !== 12) return '—';
  return `XXXX XXXX ${d.slice(-4)}`;
}

/** Short locality, e.g. "Senthli, Khurja". */
export function shortAddress(raw?: string | null): string {
  return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}
