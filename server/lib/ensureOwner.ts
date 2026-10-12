import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { isProd } from './config.js';

/** Keep only the owner email/password from Render (SEED_OWNER1_*). Do not rename or replace that account. */
export async function ensureProductionOwners() {
  const email = process.env.SEED_OWNER1_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_OWNER1_PASSWORD;
  const createName = process.env.SEED_OWNER1_NAME?.trim() || 'Owner';

  if (!email) {
    if (isProd) console.warn('SEED_OWNER1_EMAIL is not set; owner logins were left unchanged.');
    return;
  }

  let keep = await prisma.user.findUnique({ where: { email } });
  const syncPassword = process.env.SEED_SYNC_OWNER_PASSWORD === 'true';

  if (!keep) {
    if (!password || password.length < 6) {
      if (isProd) console.warn('SEED_OWNER1_PASSWORD is missing; could not create the Render owner login.');
      return;
    }
    keep = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        name: createName,
        role: 'OWNER',
      },
    });
    console.log(`Created owner login for ${email}`);
  } else {
    const data: { role?: 'OWNER'; passwordHash?: string } = {};
    if (keep.role !== 'OWNER') data.role = 'OWNER';
    if (syncPassword && password && password.length >= 6) {
      data.passwordHash = await bcrypt.hash(password, 12);
    }
    if (Object.keys(data).length) {
      keep = await prisma.user.update({ where: { id: keep.id }, data });
    }
  }

  const extras = await prisma.user.findMany({
    where: { role: 'OWNER', NOT: { id: keep.id } },
    select: { id: true, email: true },
  });
  if (extras.length) {
    await prisma.user.deleteMany({ where: { id: { in: extras.map(u => u.id) } } });
    console.log(`Removed ${extras.length} extra owner login(s); kept ${email}.`);
  }
}
