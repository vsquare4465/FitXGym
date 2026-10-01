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
