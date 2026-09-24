import { daysUntil } from './dateRange.js';

export type MemberDisplayStatus =
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Payment Pending'
  | 'Inactive'
  | 'Pending';

const EXPIRING_THRESHOLD_DAYS = 7;

export function computeMemberDisplayStatus(
  status: string,
  expiryDate: string,
  hasPendingPayment: boolean,
  paymentExempt = false,
): MemberDisplayStatus {
  if (status === 'Frozen') return 'Inactive';
  if (status === 'Pending') return 'Pending';
  if (!paymentExempt && hasPendingPayment) return 'Payment Pending';

  const days = daysUntil(expiryDate);
  if (days < 0 || status === 'Expired') return 'Expired';
  if (days <= EXPIRING_THRESHOLD_DAYS) return 'Expiring Soon';
  if (status === 'Active') return 'Active';
  return 'Expired';
}

export function memberHasPendingPayment(
  pendingPayments: { memberId: string; status: string }[],
  memberships: { memberId: string; amount: number; paidAmount: number; endDate: string }[],
  memberId: string,
): boolean {
  if (pendingPayments.some(p => p.memberId === memberId && p.status === 'Pending')) {
    return true;
  }
  const current = memberships
    .filter(m => m.memberId === memberId)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  if (current && current.amount > 0 && current.paidAmount < current.amount) {
    return true;
  }
  return false;
}
