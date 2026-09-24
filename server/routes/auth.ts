import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authMiddleware, buildAuthUser, signToken } from '../middleware/auth.js';
import { isAdminRole } from '../lib/permissions.js';
import { rateLimit } from '../lib/rateLimit.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Try again in 15 minutes.',
});

function adminClientUser(authUser: Awaited<ReturnType<typeof buildAuthUser>>) {
  return {
    role: 'admin' as const,
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    adminRole: authUser.role as 'OWNER' | 'RECEPTION' | 'TRAINER',
    jobTitle: authUser.jobTitle,
    permissions: authUser.permissions,
  };
}

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password, loginType } = req.body as {
    email?: string;
    password?: string;
    loginType?: 'admin' | 'member';
  };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (loginType === 'admin') {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !isAdminRole(user.role)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const authUser = await buildAuthUser(user);
    const token = signToken(authUser);
    await prisma.auditLog.create({
      data: { message: `SECURITY: ${user.name} logged in (${user.role})` },
    });
    return res.json({ token, user: adminClientUser(authUser) });
  }

  const cleaned = normalizedEmail.replace(/\s+/g, '');
  const member = await prisma.member.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { phone: { contains: cleaned.slice(-10) } },
      ],
    },
  });

  if (!member) {
    return res.status(401).json({ error: 'No member found with that email or phone' });
  }

  let user = await prisma.user.findUnique({ where: { memberId: member.id } });
  if (!user) {
    const hash = member.passwordHash || await bcrypt.hash('123456', 10);
    user = await prisma.user.create({
      data: {
        email: member.email,
        passwordHash: hash,
        name: member.name,
        role: 'MEMBER',
        memberId: member.id,
      },
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  const authUser = await buildAuthUser(user);
  const token = signToken(authUser);
  return res.json({
    token,
    user: {
      role: 'member' as const,
      memberId: member.id,
      name: member.name,
      email: member.email,
    },
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  const u = req.user!;
  if (u.role === 'MEMBER') {
    return res.json({
      user: { role: 'member', memberId: u.memberId, name: u.name, email: u.email },
    });
  }
  return res.json({ user: adminClientUser(u) });
});

router.put('/me', authMiddleware, async (req, res) => {
  const u = req.user!;
  if (!isAdminRole(u.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, email } = req.body as { name?: string; email?: string };
  const data: { name?: string; email?: string } = {};
  if (name?.trim()) data.name = name.trim();
  if (email?.trim()) data.email = email.trim().toLowerCase();

  if (!Object.keys(data).length) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: u.id } },
    });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
  }

  const updated = await prisma.user.update({ where: { id: u.id }, data });
  const authUser = await buildAuthUser(updated);
  await prisma.auditLog.create({
    data: { message: `PROFILE: ${authUser.name} updated their admin profile` },
  });
  return res.json({ user: adminClientUser(authUser) });
});

router.put('/password', authMiddleware, async (req, res) => {
  const u = req.user!;
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Current password and new password (min 6 chars) required' });
  }

  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  await prisma.user.update({
    where: { id: u.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  await prisma.auditLog.create({
    data: { message: `SECURITY: ${user.name} changed their password` },
  });
  return res.json({ ok: true });
});

router.post('/logout', authMiddleware, async (req, res) => {
  await prisma.auditLog.create({
    data: { message: `SECURITY: ${req.user!.name} logged out` },
  });
  res.json({ ok: true });
});

export default router;
