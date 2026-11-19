interface BalanceMembership {
  id: string;
  memberId: string;
  amount: number;
  paidAmount: number;
}
interface BalancePayment {
  memberId: string;
  membershipId?: string | null;
  status: string;
  amount: number;
  expectedAmount?: number | null;
}

/** Membership balances already include their receipts. Historical pending rows
 * are not additional invoices and must never override or duplicate that balance. */
export function memberOutstandingBalance(
  memberships: BalanceMembership[], payments: BalancePayment[], memberId: string,
): number {
  const memberMemberships = memberships.filter(m => m.memberId === memberId);
  const linkedIds = new Set(memberMemberships.map(m => m.id));
  const membershipDue = memberMemberships.reduce((sum, m) => sum + Math.max(0, m.amount - m.paidAmount), 0);
  const standaloneDue = payments.filter(p => p.memberId === memberId && p.status === 'Pending'
    && (!p.membershipId || !linkedIds.has(p.membershipId)))
    .reduce((sum, p) => sum + Math.max(0, p.expectedAmount != null ? p.expectedAmount - p.amount : p.amount), 0);
  return membershipDue + standaloneDue;
}
