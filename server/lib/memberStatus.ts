import { daysUntil } from './dateRange.js';
import { memberOutstandingBalance } from './memberBalance.js';

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
  pendingPayments: Parameters<typeof memberOutstandingBalance>[1],
  memberships: Parameters<typeof memberOutstandingBalance>[0],
  memberId: string,
): boolean {
  return memberOutstandingBalance(memberships, pendingPayments, memberId) > 0;
}
