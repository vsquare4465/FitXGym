import { prisma } from '../db.js';
import { resolveDateRange, inRange, daysUntil, monthKey, type DateRange } from './dateRange.js';
import { computeMemberDisplayStatus, memberHasPendingPayment } from './memberStatus.js';
import { isPaymentExempt } from './permissions.js';
import { toClientMember } from './memberMapper.js';

const MEMBERSHIP_CATEGORIES = [
  'Membership',
  'Registration',
  'New Membership',
  'Renewal',
  'Partial Payment',
  'Advance Payment',
];

export async function buildDashboard(query: {
  period?: string;
  from?: string;
  to?: string;
}) {
  const range = resolveDateRange(query.period || 'month', query.from, query.to);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const yearStart = `${now.getFullYear()}-01-01`;

  const [members, allPayments, allExpenses, attendance, memberships, auditLogs, plans] =
    await Promise.all([
      prisma.member.findMany({ orderBy: { name: 'asc' } }),
      prisma.payment.findMany({ orderBy: { date: 'desc' } }),
      prisma.expense.findMany({ orderBy: { date: 'desc' } }),
      prisma.attendanceRecord.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.membership.findMany({ orderBy: { endDate: 'desc' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
      prisma.plan.findMany(),
    ]);

  const pendingPaymentsList = allPayments.filter(p => p.status === 'Pending');
  const completedPayments = allPayments.filter(p => p.status === 'Completed');

  const revenueInRange = (payments: typeof allPayments, r: DateRange) =>
    payments
      .filter(p => p.status === 'Completed' && inRange(p.date, r))
      .reduce((s, p) => s + p.amount, 0);

  const expensesInRange = (expenses: typeof allExpenses, r: DateRange) =>
    expenses.filter(e => inRange(e.date, r)).reduce((s, e) => s + e.amount, 0);

  const monthRange = { start: monthStart, end: today, label: 'This month' };
  const yearRange = { start: yearStart, end: today, label: 'This year' };

  const monthlyRevenue = revenueInRange(completedPayments, monthRange);
  const monthlyExpenses = expensesInRange(allExpenses, monthRange);
  const yearlyRevenue = revenueInRange(completedPayments, yearRange);
  const yearlyExpenses = expensesInRange(allExpenses, yearRange);

  const periodRevenue = revenueInRange(completedPayments, range);
  const periodExpenses = expensesInRange(allExpenses, range);

  const activeMembers = members.filter(m => m.status === 'Active').length;
  const newMembers = members.filter(
    m => inRange(m.joinDate, range),
  ).length;

  const renewalsDue = members.filter(m => {
    if (m.status !== 'Active') return false;
    const d = daysUntil(m.expiryDate);
    return d >= 0 && d <= 15;
  }).length;

  const todayRecords = attendance.filter(a => a.date === today);
  const todayAttendance = todayRecords.length;
  const currentlyInside = todayRecords.filter(a => !a.checkOut).length;

  const planMap = Object.fromEntries(plans.map(p => [p.id, p]));

  const upcomingRenewals = members
    .filter(m => {
      if (m.status !== 'Active') return false;
      const d = daysUntil(m.expiryDate);
      return d >= 0 && d <= 30;
    })
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .slice(0, 8)
    .map(m => ({
      ...toClientMember(m),
      planName: planMap[m.planId]?.name || m.planId,
      daysLeft: daysUntil(m.expiryDate),
      displayStatus: computeMemberDisplayStatus(
        m.status,
        m.expiryDate,
        memberHasPendingPayment(pendingPaymentsList, memberships, m.id),
        isPaymentExempt(m.membershipType),
      ),
    }));

  // Always show last 6 calendar months on charts (not limited to selected period)
  const sortedMonths: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    sortedMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const revenueTrend = sortedMonths.map(m => ({
    label: m,
    amount: completedPayments
      .filter(p => p.status === 'Completed' && monthKey(p.date) === m)
      .reduce((s, p) => s + p.amount, 0),
  }));

  const expenseTrend = sortedMonths.map(m => ({
    label: m,
    amount: allExpenses
      .filter(e => monthKey(e.date) === m)
      .reduce((s, e) => s + e.amount, 0),
  }));

  const profitTrend = sortedMonths.map(m => {
    const rev = revenueTrend.find(r => r.label === m)?.amount || 0;
    const exp = expenseTrend.find(e => e.label === m)?.amount || 0;
    return { label: m, amount: rev - exp };
  });

  const membershipRevenue = completedPayments
    .filter(p => inRange(p.date, range) && MEMBERSHIP_CATEGORIES.includes(p.category))
    .reduce((s, p) => s + p.amount, 0);

  const otherIncome = periodRevenue - membershipRevenue;

  return {
    range,
    stats: {
      totalMembers: members.length,
      activeMembers,
      newMembers,
      renewalsDue,
      pendingPayments: pendingPaymentsList.length,
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      yearlyRevenue,
      yearlyExpenses,
      yearlyProfit: yearlyRevenue - yearlyExpenses,
      revenue: periodRevenue,
      expenses: periodExpenses,
      profit: periodRevenue - periodExpenses,
      todayAttendance,
      currentlyInside,
      membershipRevenue,
      otherIncome,
    },
    trends: {
      revenue: revenueTrend,
      expenses: expenseTrend,
      profit: profitTrend,
    },
    todayAttendanceList: todayRecords.slice(0, 20),
    upcomingRenewals,
    pendingPaymentsList: pendingPaymentsList.slice(0, 10).map(p => ({
      ...p,
      planName: planMap[members.find(m => m.id === p.memberId)?.planId || '']?.name,
    })),
    recentActivity: auditLogs.map(l => ({
      message: l.message,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export async function getMemberProfile(memberId: string) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return null;

  const [memberships, payments, attendance, plans, pendingPayments] = await Promise.all([
    prisma.membership.findMany({ where: { memberId }, orderBy: { startDate: 'desc' } }),
    prisma.payment.findMany({ where: { memberId }, orderBy: { date: 'desc' } }),
    prisma.attendanceRecord.findMany({ where: { memberId }, orderBy: { date: 'desc' }, take: 30 }),
    prisma.plan.findMany(),
    prisma.payment.findMany({ where: { memberId, status: 'Pending' } }),
  ]);

  const planMap = Object.fromEntries(plans.map(p => [p.id, p]));
  const currentMembership = memberships[0];
  const currentPlan = planMap[member.planId];
  const hasPending = memberHasPendingPayment(pendingPayments, memberships, memberId);
  const totalVisits = attendance.length;
  const lastVisit = attendance[0];

  const currentAmount = currentMembership?.amount ?? currentPlan?.price ?? 0;
  const currentPaid = currentMembership?.paidAmount ?? 0;
  const membershipOwed = Math.max(0, currentAmount - currentPaid);
  const pendingFromRecords = pendingPayments.reduce((sum, p) => {
    if (p.expectedAmount != null && p.expectedAmount > p.amount) {
      return sum + (p.expectedAmount - p.amount);
    }
    return sum + p.amount;
  }, 0);

  return {
    member: toClientMember(member),
    displayStatus: computeMemberDisplayStatus(
      member.status,
      member.expiryDate,
      hasPending,
      isPaymentExempt(member.membershipType),
    ),
    currentMembership: currentMembership
      ? {
          ...currentMembership,
          planName: planMap[currentMembership.planId]?.name || currentMembership.planId,
          pending: Math.max(0, currentAmount - currentPaid),
        }
      : null,
    currentPlan,
    memberships: memberships.map(ms => ({
      ...ms,
      planName: planMap[ms.planId]?.name || ms.planId,
      pending: Math.max(0, ms.amount - ms.paidAmount),
    })),
    payments,
    attendance: {
      totalVisits,
      lastVisit: lastVisit || null,
      recent: attendance,
    },
    pendingAmount: Math.max(membershipOwed, pendingFromRecords),
  };
}
