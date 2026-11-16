export const isProd = true;
export const port = 3001;
export const distPath = '';
export function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
}
export function validateProductionEnv() {
  if ((process.env.JWT_SECRET || '').length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
}
