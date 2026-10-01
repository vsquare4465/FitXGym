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

export function phoneValidationMessage(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  if (d.length < 10) return 'Enter a 10-digit Indian mobile number.';
  if (!isValidIndianPhone(phone)) return 'Phone must be a valid 10-digit Indian mobile (start with 6–9).';
  return null;
}
