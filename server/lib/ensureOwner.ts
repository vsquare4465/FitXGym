import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { isProd } from './config.js';

const OWNER_NAME = 'Deepak Solanki';

function pickKeepOwner<T extends { id: string; name: string; email: string; createdAt: Date }>(
  owners: T[],
  preferredEmail?: string,
): T | undefined {
  if (!owners.length) return undefined;
  const byName = owners.find(o => /deepak\s+solanki/i.test(o.name)) || owners.find(o => /deepak/i.test(o.name));
  if (byName) return byName;
  if (preferredEmail) {
    const byEmail = owners.find(o => o.email === preferredEmail);
    if (byEmail) return byEmail;
  }
  return [...owners].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
}

async function pruneExtraOwners(keepId: string) {
  const extras = await prisma.user.findMany({
    where: { role: 'OWNER', NOT: { id: keepId } },
    select: { id: true, email: true, name: true },
  });
  if (!extras.length) return;
  await prisma.user.deleteMany({ where: { id: { in: extras.map(u => u.id) } } });
  console.log(`Removed ${extras.length} extra owner login(s); kept ${OWNER_NAME}.`);
}

/** One owner only: Deepak Solanki. Extra owner logins are removed. Staff are added from Team. */
export async function ensureProductionOwners() {
  const preferredEmail = process.env.SEED_OWNER1_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_OWNER1_PASSWORD;

  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    orderBy: { createdAt: 'asc' },
  });

  let keep = pickKeepOwner(owners, preferredEmail);

  if (!keep) {
    if (!preferredEmail || !password || password.length < 6) {
      if (isProd) console.warn('No owner account found. Set SEED_OWNER1_EMAIL and SEED_OWNER1_PASSWORD.');
      return;
    }
    keep = await prisma.user.create({
      data: {
        email: preferredEmail,
        passwordHash: await bcrypt.hash(password, 12),
        name: OWNER_NAME,
        role: 'OWNER',
      },
    });
    console.log(`Created owner login for ${preferredEmail}`);
  } else if (keep.name !== OWNER_NAME) {
    keep = await prisma.user.update({
      where: { id: keep.id },
      data: { name: OWNER_NAME },
    });
  }

  await pruneExtraOwners(keep.id);
}
