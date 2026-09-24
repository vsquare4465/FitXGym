#!/usr/bin/env node
/**
 * Pre-deploy checklist — run before going live:
 *   NODE_ENV=production node scripts/prod-check.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const isProd = process.env.NODE_ENV === 'production';
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

if (!isProd) {
  warn('NODE_ENV is not "production" — set it to simulate a live deploy check.');
}

if (!process.env.DATABASE_URL) {
  fail('DATABASE_URL is not set');
} else if (/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) && isProd) {
  warn('DATABASE_URL points to localhost — use managed Postgres (Neon, Supabase, Railway) in production.');
}

const secret = process.env.JWT_SECRET ?? '';
if (secret.length < 32) {
  fail('JWT_SECRET must be at least 32 characters');
} else if (/change-this|dev-secret|FitXOwner/i.test(secret)) {
  fail('JWT_SECRET looks like a default — generate with: openssl rand -base64 32');
}

if (isProd && process.env.TRUST_PROXY !== 'true') {
  warn('TRUST_PROXY is not "true" — set it when behind Render, Railway, Nginx, or Cloudflare.');
}

if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  fail('Frontend not built — run: npm run build');
}

if (!fs.existsSync(path.join(root, 'node_modules', '.prisma', 'client'))) {
  warn('Prisma client not generated — run: npx prisma generate');
}

if (process.env.SEED_DEMO_DATA === 'true' && isProd) {
  warn('SEED_DEMO_DATA=true in production will load sample members/payments on seed.');
}

console.log('\n=== Fit X Gym — production readiness ===\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('All checks passed.\n');
} else {
  if (errors.length) {
    console.log('BLOCKERS (fix before go-live):');
    errors.forEach(e => console.log(`  ✗ ${e}`));
    console.log('');
  }
  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  ! ${w}`));
    console.log('');
  }
}

if (errors.length === 0) {
  console.log('Next steps:');
  console.log('  1. npm run db:push');
  console.log('  2. npm run db:seed          # first time only (owners + plans + website defaults)');
  console.log('  3. npm run start:prod       # or deploy to Render/Railway');
  console.log('  4. Open /admin/login → change owner password');
  console.log('  5. Admin → Website → Publish your content');
  console.log('  6. Admin → Attendance → print QR with your live domain\n');
  process.exit(0);
}

console.log('Fix blockers above, then re-run: npm run prod:check\n');
process.exit(1);
