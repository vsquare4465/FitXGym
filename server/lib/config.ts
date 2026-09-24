import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const isProd = process.env.NODE_ENV === 'production';
export const port = Number(process.env.PORT) || 3001;
export const distPath = path.join(__dirname, '../../dist');

export function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function validateProductionEnv(): void {
  if (!isProd) return;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  } else if (
    secret.includes('change-this') ||
    secret === 'dev-secret-change-me' ||
    /fitxowner|deepak123/i.test(secret)
  ) {
    errors.push('JWT_SECRET must be changed from the default value');
  }

  if (process.env.TRUST_PROXY !== 'true') {
    warnings.push('TRUST_PROXY is not "true" — recommended behind Render, Railway, Nginx, or Cloudflare');
  }

  if (!process.env.PUBLIC_SITE_URL) {
    warnings.push('PUBLIC_SITE_URL is not set — QR check-in URLs use the browser origin instead');
  }

  if (errors.length > 0) {
    console.error('Production environment check failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('Production warnings:');
    warnings.forEach(w => console.warn(`  ! ${w}`));
  }
}
