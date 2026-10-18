export function isValidEmail(email: string): boolean {
  const v = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function isValidIndianPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return /^[6-9]\d{9}$/.test(d);
  if (d.length === 12) return /^91[6-9]\d{9}$/.test(d);
  return false;
}

/** Blank is 0 (unpaid). Rejects negative / non-numeric values. */
export function parseRupees(raw: unknown): { ok: true; value: number } | { ok: false } {
  if (raw === undefined || raw === null || String(raw).trim() === '') return { ok: true, value: 0 };
  const n = Number(String(raw).replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, value: n };
}

export function normalizeStaffPhone(phone?: string | null): string | null {
  if (!phone?.trim()) return null;
  if (!isValidIndianPhone(phone)) return null;
  return phone.replace(/\D/g, '').slice(-10);
}

export function normalizeAadhaar(raw: unknown): string | null {
  const d = String(raw || '').replace(/\D/g, '');
  return d || null;
}

export function isValidAadhaar(raw: string): boolean {
  return /^\d{12}$/.test(raw.replace(/\D/g, ''));
}

export function shortAddress(raw: unknown): string | null {
  const v = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!v) return null;
  return v.slice(0, 80);
}
