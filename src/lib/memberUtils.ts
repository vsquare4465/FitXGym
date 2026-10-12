import { Member, MemberDisplayStatus, Payment } from '../types';
import { istToday } from './ist';

const EXPIRING_DAYS = 7;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function todayISO(): string {
  return istToday();
}

export function addMonthsISO(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + months);
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function planDurationMonths(duration: string): number {
  const m = duration.match(/(\d+)/);
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  if (/year|annual/i.test(duration)) return n * 12;
  if (/week/i.test(duration)) return Math.max(1, Math.round((n * 7) / 30));
  if (/day/i.test(duration)) return Math.max(1, Math.round(n / 30));
  return n;
}

export function addPlanDuration(startDate: string, duration: string): string {
  const n = parseInt(duration.match(/(\d+)/)?.[1] || '1', 10);
  if (/year|annual/i.test(duration)) return addMonthsISO(startDate, n * 12);
  if (/week/i.test(duration)) return addDaysISO(startDate, n * 7);
  if (/day/i.test(duration)) return addDaysISO(startDate, n);
  return addMonthsISO(startDate, n);
}

export function daysUntil(dateStr: string): number {
  const today = istToday();
  const target = Date.parse(`${dateStr.slice(0, 10)}T00:00:00+05:30`);
  const now = Date.parse(`${today}T00:00:00+05:30`);
  if (Number.isNaN(target) || Number.isNaN(now)) return 0;
  return Math.round((target - now) / 86400000);
}

export function getMemberDisplayStatus(
  member: Member,
  payments: Payment[],
): MemberDisplayStatus {
  const hasPending = payments.some(
    p => p.memberId === member.id && p.status === 'Pending',
  );
  const paymentExempt = member.membershipType === 'Complimentary' || member.membershipType === 'Staff';
  if (member.status === 'Frozen') return 'Inactive';
  if (member.status === 'Pending') return 'Pending';
  if (!paymentExempt && hasPending) return 'Payment Pending';

  const days = daysUntil(member.expiryDate);
  if (days < 0 || member.status === 'Expired') return 'Expired';
  if (days <= EXPIRING_DAYS) return 'Expiring Soon';
  return 'Active';
}

export function statusBadgeClass(status: MemberDisplayStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Expiring Soon':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Expired':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'Payment Pending':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Inactive':
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    default:
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  }
}
