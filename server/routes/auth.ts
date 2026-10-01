import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authMiddleware, buildAuthUser, signToken } from '../middleware/auth.js';
import { isAdminRole } from '../lib/permissions.js';
import { rateLimit } from '../lib/rateLimit.js';
import { createPasswordOtp, verifyAndConsumeOtp, OTP_EXPIRES_MINUTES } from '../lib/passwordOtp.js';
import { isValidEmail, normalizeStaffPhone } from '../lib/validation.js';
import { deliverPasswordOtp } from '../lib/otpDelivery.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Try again in 15 minutes.',
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many reset attempts. Try again in 15 minutes.',
});

async function findAdminByEmailOrPhone(raw: string) {
  const v = raw.trim();
  if (!v) return null;
  if (isValidEmail(v)) {
    const user = await prisma.user.findUnique({ where: { email: v.toLowerCase() } });
    if (user && isAdminRole(user.role)) return user;
    return null;
  }
  const last10 = v.replace(/\D/g, '').slice(-10);
  if (last10.length !== 10) return null;
  const users = await prisma.user.findMany({
    where: { role: { not: 'MEMBER' }, phone: { not: null } },
  });
  return users.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === last10) || null;
}

function adminClientUser(authUser: Awaited<ReturnType<typeof buildAuthUser>>) {
  return {
    role: 'admin' as const,
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    phone: authUser.phone ?? null,
    adminRole: authUser.role,
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
    return res.status(400).json({ error: 'Email or mobile, and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (loginType === 'admin') {
    const user = await findAdminByEmailOrPhone(email);
    if (!user) {
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

  const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string };
  const data: { name?: string; email?: string; phone?: string | null } = {};
  if (name?.trim()) data.name = name.trim();
  if (email?.trim()) data.email = email.trim().toLowerCase();
  if (phone !== undefined) {
    if (!phone.trim()) data.phone = null;
    else {
      const normalized = normalizeStaffPhone(phone);
      if (!normalized) return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      data.phone = normalized;
    }
  }

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

router.post('/request-otp', otpLimiter, async (req, res) => {
  const { emailOrPhone } = req.body as { emailOrPhone?: string };
  if (!emailOrPhone?.trim()) {
    return res.status(400).json({ error: 'Enter your login email or mobile number' });
  }

  const user = await findAdminByEmailOrPhone(emailOrPhone);
  if (user) {
    const code = await createPasswordOtp(user.email);
    await deliverPasswordOtp({
      name: user.name,
      email: user.email,
      phone: user.phone,
      code,
    });
    await prisma.auditLog.create({
      data: { message: `SECURITY: Password reset code requested for ${user.name}` },
    });
  }

  return res.json({
    ok: true,
    expiresInMinutes: OTP_EXPIRES_MINUTES,
    message: 'If this account exists, a 6-digit code was sent to the email and WhatsApp on file.',
  });
});

router.post('/reset-password', loginLimiter, async (req, res) => {
  const { email, emailOrPhone, otp, newPassword } = req.body as {
    email?: string;
    emailOrPhone?: string;
    otp?: string;
    newPassword?: string;
  };
  const identifier = (emailOrPhone || email || '').trim();
  if (!identifier || !otp || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Email or mobile, 6-digit code, and new password (min 6 chars) are required' });
  }

  const user = await findAdminByEmailOrPhone(identifier);
  if (!user) {
    return res.status(400).json({ error: 'Invalid details or code. Check the number/email, or ask an owner to generate a reset code from Team.' });
  }
  const validCode = await verifyAndConsumeOtp(user.email, otp);
  if (!validCode) {
    return res.status(400).json({ error: 'Invalid details or code. Check the number/email, or ask an owner to generate a reset code from Team.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  await prisma.auditLog.create({
    data: { message: `SECURITY: ${user.name} reset their password with a verification code` },
  });
  return res.json({ ok: true });
});

router.post('/logout', authMiddleware, async (req, res) => {
  await prisma.auditLog.create({
    data: { message: `SECURITY: ${req.user!.name} logged out` },
  });
  res.json({ ok: true });
});

router.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default router;
