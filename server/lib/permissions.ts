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

const FULL: AdminPermissions = Object.fromEntries(
  ADMIN_MODULES.map(m => [m, 'write']),
) as AdminPermissions;

const NONE: AdminPermissions = Object.fromEntries(
  ADMIN_MODULES.map(m => [m, 'none']),
) as AdminPermissions;

export function defaultPermissions(role: string): AdminPermissions {
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
  role: string,
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
  level: 'read' | 'write',
): boolean {
  const p = perms[mod];
  if (level === 'read') return p === 'read' || p === 'write';
  return p === 'write';
}

export function isAdminRole(role: string): boolean {
  return role === 'OWNER' || role === 'RECEPTION' || role === 'TRAINER';
}

export function isPaymentExempt(membershipType: string): boolean {
  return membershipType === 'Complimentary' || membershipType === 'Staff';
}
