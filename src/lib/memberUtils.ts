import { Member, MemberDisplayStatus, Payment } from '../types';

const EXPIRING_DAYS = 7;

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
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
