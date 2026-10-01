import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authMiddleware, requireAdmin, requirePermission } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { AdminPermissions, isAdminRole, resolvePermissions } from '../lib/permissions.js';
import { createPasswordOtp, OTP_EXPIRES_MINUTES } from '../lib/passwordOtp.js';
import { normalizeStaffPhone } from '../lib/validation.js';
import { deliverPasswordOtp } from '../lib/otpDelivery.js';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin());

function toTeamUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  jobTitle: string | null;
  permissions: unknown;
  createdAt: Date;
}) {
  const overrides = (user.permissions && typeof user.permissions === 'object'
    ? user.permissions
    : {}) as Partial<AdminPermissions>;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    jobTitle: user.jobTitle,
    permissions: resolvePermissions(user.role, overrides),
    createdAt: user.createdAt.toISOString(),
  };
}

router.get('/', requirePermission('team', 'read'), async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { not: 'MEMBER' } },
    orderBy: { name: 'asc' },
  });
  res.json(users.map(u => toTeamUser(u)));
});

router.post('/', requirePermission('team', 'write'), async (req, res) => {
  const { name, email, password, role, jobTitle, phone, permissions } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    jobTitle?: string;
    phone?: string;
    permissions?: Partial<AdminPermissions>;
  };

  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and password (min 6 chars) are required' });
  }
  if (!role || !isAdminRole(role) || role === 'OWNER') {
    return res.status(400).json({ error: 'Pick a staff role (not Owner)' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  let storedPhone: string | null = null;
  if (phone?.trim()) {
    storedPhone = normalizeStaffPhone(phone);
    if (!storedPhone) return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
  }

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      phone: storedPhone,
      passwordHash: await bcrypt.hash(password, 10),
      role: role as UserRole,
      jobTitle: jobTitle?.trim() || null,
      permissions: permissions || {},
    },
  });

  await prisma.auditLog.create({
    data: { message: `TEAM: Created staff login for ${created.name} (${created.role})` },
  });
  res.json(toTeamUser(created));
});

router.put('/:id', requirePermission('team', 'write'), async (req, res) => {
  const { id } = req.params;
  const actor = req.user!;
  const { name, email, password, role, jobTitle, phone, permissions } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    jobTitle?: string;
    phone?: string;
    permissions?: Partial<AdminPermissions>;
  };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !isAdminRole(target.role)) {
    return res.status(404).json({ error: 'Team member not found' });
  }

  if (target.role === 'OWNER' && actor.role !== 'OWNER') {
    return res.status(403).json({ error: 'Only owners can edit owner accounts' });
  }

  const data: {
    name?: string;
    email?: string;
    passwordHash?: string;
    role?: UserRole;
    jobTitle?: string | null;
    phone?: string | null;
    permissions?: Partial<AdminPermissions>;
  } = {};

  if (name?.trim()) data.name = name.trim();
  if (email?.trim()) {
    const normalized = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email: normalized, NOT: { id } },
    });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    data.email = normalized;
  }
  if (password && password.length >= 6) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  if (jobTitle !== undefined) data.jobTitle = jobTitle?.trim() || null;
  if (phone !== undefined) {
    if (!phone.trim()) data.phone = null;
    else {
      const normalized = normalizeStaffPhone(phone);
      if (!normalized) return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      data.phone = normalized;
    }
  }
  if (permissions && typeof permissions === 'object') data.permissions = permissions;

  if (role && isAdminRole(role)) {
    if (target.role === 'OWNER' && role !== 'OWNER') {
      return res.status(400).json({ error: 'Cannot demote the owner account here' });
    }
    if (role !== 'OWNER' || actor.role === 'OWNER') {
      data.role = role as UserRole;
    }
  }

  const updated = await prisma.user.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: { message: `TEAM: Updated access for ${updated.name} (${updated.role})` },
  });
  res.json(toTeamUser(updated));
});

router.delete('/:id', requirePermission('team', 'write'), async (req, res) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !isAdminRole(target.role)) {
    return res.status(404).json({ error: 'Team member not found' });
  }
  if (target.role === 'OWNER') {
    return res.status(400).json({ error: 'Owner accounts cannot be deleted' });
  }

  await prisma.user.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { message: `TEAM: Removed staff login for ${target.name}` },
  });
  res.json({ ok: true });
});

router.post('/:id/reset-otp', requirePermission('team', 'write'), async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || !isAdminRole(target.role)) {
    return res.status(404).json({ error: 'Team member not found' });
  }
  const code = await createPasswordOtp(target.email);
  await deliverPasswordOtp({
    name: target.name,
    email: target.email,
    phone: target.phone,
    code,
  });
  await prisma.auditLog.create({
    data: { message: `SECURITY: Password reset code generated for ${target.name}` },
  });
  res.json({ email: target.email, phone: target.phone, code, expiresInMinutes: OTP_EXPIRES_MINUTES });
});

export default router;
