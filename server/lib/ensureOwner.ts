import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { isProd } from './config.js';

async function ensureOwner(emailRaw?: string, password?: string, name = 'Gym Owner') {
  const email = emailRaw?.trim().toLowerCase();
  if (!email || !password || password.length < 6) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  const syncPassword = process.env.SEED_SYNC_OWNER_PASSWORD === 'true';

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        name,
        role: 'OWNER',
      },
    });
    console.log(`Created owner login for ${email}`);
    return;
  }

  if (syncPassword && (existing.role === 'OWNER' || existing.role === 'RECEPTION')) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: await bcrypt.hash(password, 12), role: 'OWNER' },
    });
    console.log(`Updated owner password for ${email}`);
  }
}

/** Creates the Render env owner if that email is not in the database yet. */
export async function ensureProductionOwners() {
  if (!isProd) return;
  await ensureOwner(
    process.env.SEED_OWNER1_EMAIL,
    process.env.SEED_OWNER1_PASSWORD,
    'Gym Owner 1',
  );
  await ensureOwner(
    process.env.SEED_OWNER2_EMAIL,
    process.env.SEED_OWNER2_PASSWORD,
    'Gym Owner 2',
  );
}
