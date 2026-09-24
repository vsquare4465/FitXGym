export type PermissionLevel = 'none' | 'read' | 'write';

export type AdminModule =
  | 'dashboard'
  | 'members'
  | 'plans'
  | 'payments'
  | 'expenses'
  | 'attendance'
  | 'leads'
  | 'messages'
  | 'website'
  | 'team';

export type AdminPermissions = Record<AdminModule, PermissionLevel>;

export type AdminRole = 'OWNER' | 'RECEPTION' | 'TRAINER';

export const ADMIN_MODULES: AdminModule[] = [
  'dashboard', 'members', 'plans', 'payments', 'expenses',
  'attendance', 'leads', 'messages', 'website', 'team',
];

export const MODULE_LABELS: Record<AdminModule, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  plans: 'Plans',
  payments: 'Payments',
  expenses: 'Expenses',
  attendance: 'Attendance',
  leads: 'Leads',
  messages: 'Messages',
  website: 'Website',
  team: 'Team & access',
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  OWNER: 'Owner (full access)',
  RECEPTION: 'Receptionist',
  TRAINER: 'Trainer',
};

const FULL: AdminPermissions = Object.fromEntries(
  ADMIN_MODULES.map(m => [m, 'write']),
) as AdminPermissions;

const NONE: AdminPermissions = Object.fromEntries(
  ADMIN_MODULES.map(m => [m, 'none']),
) as AdminPermissions;

export function defaultPermissions(role: AdminRole | string): AdminPermissions {
  switch (role) {
    case 'OWNER':
      return { ...FULL };
    case 'RECEPTION':
      return {
        ...NONE,
        dashboard: 'read',
        members: 'write',
        plans: 'read',
        payments: 'write',
        attendance: 'write',
        leads: 'write',
        messages: 'write',
      };
    case 'TRAINER':
      return {
        ...NONE,
        dashboard: 'read',
        members: 'read',
        attendance: 'read',
        messages: 'write',
      };
    default:
      return { ...NONE };
  }
}

export function resolvePermissions(
  role: AdminRole | string,
  overrides?: Partial<AdminPermissions> | null,
): AdminPermissions {
  const base = defaultPermissions(role);
  if (role === 'OWNER') return base;
  if (!overrides || typeof overrides !== 'object') return base;
  const merged = { ...base };
  for (const mod of ADMIN_MODULES) {
    const level = overrides[mod];
    if (level === 'none' || level === 'read' || level === 'write') {
      merged[mod] = level;
    }
  }
  return merged;
}

export function canAccess(
  perms: AdminPermissions,
  mod: AdminModule,
  level: 'read' | 'write' = 'read',
): boolean {
  const p = perms[mod];
  if (level === 'read') return p === 'read' || p === 'write';
  return p === 'write';
}

export const NAV_MODULE_MAP: Record<string, AdminModule> = {
  '/admin': 'dashboard',
  '/admin/members': 'members',
  '/admin/plans': 'plans',
  '/admin/payments': 'payments',
  '/admin/expenses': 'expenses',
  '/admin/attendance': 'attendance',
  '/admin/leads': 'leads',
  '/admin/messages': 'messages',
  '/admin/website': 'website',
  '/admin/team': 'team',
  '/admin/profile': 'dashboard',
};
