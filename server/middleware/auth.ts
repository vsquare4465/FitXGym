import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import {
  AdminModule,
  AdminPermissions,
  canAccess,
  isAdminRole,
  resolvePermissions,
} from '../lib/permissions.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'RECEPTION' | 'TRAINER' | 'MEMBER';
  memberId?: string | null;
  jobTitle?: string | null;
  permissions: AdminPermissions;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberId: user.memberId,
      jobTitle: user.jobTitle,
      permissions: user.permissions,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

async function buildAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  memberId: string | null;
  jobTitle: string | null;
  permissions: unknown;
}): Promise<AuthUser> {
  const overrides = (user.permissions && typeof user.permissions === 'object'
    ? user.permissions
    : {}) as Partial<AdminPermissions>;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    memberId: user.memberId,
    jobTitle: user.jobTitle,
    permissions: resolvePermissions(user.role, overrides),
  };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = await buildAuthUser(user);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
}

export function requirePermission(mod: AdminModule, level: 'read' | 'write' = 'read') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!canAccess(req.user.permissions, mod, level)) {
      return res.status(403).json({ error: `No ${level} access to ${mod}` });
    }
    next();
  };
}

export { JWT_SECRET, buildAuthUser };
