import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, AlertCircle, Wallet, Activity, MessageCircle,
  CreditCard, Receipt, QrCode, TrendingUp, TrendingDown,
} from 'lucide-react';
import { adminApi } from '../../api/client';
import { DashboardData } from '../../types';
import { formatCurrency } from '../../lib/format';
import StatCard from '../../components/admin/StatCard';
import TrendChart from '../../components/admin/TrendChart';
import StatusBadge from '../../components/admin/StatusBadge';

const quickLinks = [
  { to: '/admin/members', icon: Users, label: 'Members' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/admin/attendance', icon: QrCode, label: 'Attendance' },
  { to: '/admin/messages', icon: MessageCircle, label: 'WhatsApp' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminApi.dashboard('month');
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = data?.stats;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Good {getGreeting()}, Owner</h1>
        <p className="text-sm text-zinc-500">Overview of your gym this month</p>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading...</p>}

      {s && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Active members" value={s.activeMembers} icon={UserCheck} accent="green" sub={`${s.totalMembers} total`} />
            <StatCard label="This month revenue" value={formatCurrency(s.monthlyRevenue)} icon={Wallet} accent="green" />
            <StatCard label="This month expenses" value={formatCurrency(s.monthlyExpenses)} icon={Receipt} accent="red" />
            <StatCard
              label="This month profit"
              value={formatCurrency(s.monthlyProfit)}
              icon={s.monthlyProfit >= 0 ? TrendingUp : TrendingDown}
              accent={s.monthlyProfit >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Finance summary strip */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">This month at a glance</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-3 px-2">
                <p className="text-[10px] text-emerald-400/80 uppercase">Revenue</p>
                <p className="text-sm sm:text-base font-bold text-emerald-300 mt-0.5">{formatCurrency(s.monthlyRevenue)}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 py-3 px-2">
                <p className="text-[10px] text-red-400/80 uppercase">Expenses</p>
                <p className="text-sm sm:text-base font-bold text-red-300 mt-0.5">{formatCurrency(s.monthlyExpenses)}</p>
              </div>
              <div className={`rounded-lg py-3 px-2 border ${s.monthlyProfit >= 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <p className={`text-[10px] uppercase ${s.monthlyProfit >= 0 ? 'text-orange-400/80' : 'text-amber-400/80'}`}>Profit</p>
                <p className={`text-sm sm:text-base font-bold mt-0.5 ${s.monthlyProfit >= 0 ? 'text-orange-300' : 'text-amber-300'}`}>
                  {formatCurrency(s.monthlyProfit)}
                </p>
              </div>
            </div>
          </div>

          {(s.renewalsDue > 0 || s.pendingPayments > 0) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {s.renewalsDue > 0 && (
                <Link to="/admin/members" className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-colors">
                  <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">{s.renewalsDue} renewals due</p>
                    <p className="text-xs text-amber-200/60">Expiring in 15 days</p>
                  </div>
                </Link>
              )}
              {s.pendingPayments > 0 && (
                <Link to="/admin/payments" className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15 transition-colors">
                  <AlertCircle className="text-orange-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-orange-200">{s.pendingPayments} pending payments</p>
                    <p className="text-xs text-orange-200/60">Tap to review</p>
                  </div>
                </Link>
              )}
            </div>
          )}

          <TrendChart
            title="Revenue vs expenses (last 6 months)"
            data={data.trends.revenue}
            series2={data.trends.expenses}
            color="#22c55e"
            color2="#ef4444"
            series1Label="Revenue"
            series2Label="Expenses"
          />

          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 font-medium">Quick links</p>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm hover:border-zinc-600 transition-colors">
                  <Icon size={16} className="text-orange-500" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/attendance" className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors block">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Activity size={16} className="text-orange-500" />
                Today&apos;s attendance
              </h2>
              <div className="flex gap-4 mb-3">
                <div>
                  <p className="text-2xl font-bold">{s.todayAttendance}</p>
                  <p className="text-[10px] text-zinc-500">visits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{s.currentlyInside}</p>
                  <p className="text-[10px] text-zinc-500">inside now</p>
                </div>
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {data.todayAttendanceList.length === 0 ? (
                  <p className="text-xs text-zinc-500">No check-ins yet today</p>
                ) : (
                  data.todayAttendanceList.slice(0, 5).map(a => (
                    <div key={a.id} className="flex justify-between text-xs text-zinc-400">
                      <span>{a.memberName}</span>
                      <span>{a.checkIn}{a.checkOut ? ` – ${a.checkOut}` : ' · inside'}</span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[10px] text-orange-500/80 mt-2">View full attendance log →</p>
            </Link>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-sm font-semibold mb-3">Upcoming renewals</h2>
              {data.upcomingRenewals.length === 0 ? (
                <p className="text-xs text-zinc-500">None in next 30 days</p>
              ) : (
                <div className="space-y-2">
                  {data.upcomingRenewals.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{m.name}</span>
                      <StatusBadge status={m.displayStatus} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {data.recentActivity.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-sm font-semibold mb-2">Recent activity</h2>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {data.recentActivity.slice(0, 5).map((a, i) => (
                  <p key={i} className="text-xs text-zinc-500 truncate">{a.message}</p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
