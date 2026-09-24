import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';
import TrendChart from '../../components/admin/TrendChart';

const CATEGORIES = [
  'Rent', 'Electricity', 'Water', 'Internet', 'Salary', 'Trainer',
  'Equipment', 'Repair', 'Maintenance', 'Cleaning', 'Marketing', 'Supplies', 'Miscellaneous', 'Other',
];

export default function ExpensesPage() {
  const { expenses, onAddExpense, refresh } = useGymData();
  const list = expenses as Expense[];
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'chart'>('chart');
  const [form, setForm] = useState({
    category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0],
    description: '', paymentMethod: 'Cash', vendor: '', paidBy: '', notes: '',
  });

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().split('T')[0];
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const thisMonth = useMemo(
    () => list.filter(e => e.date >= monthStart && e.date <= today),
    [list, monthStart, today],
  );

  const lastMonth = useMemo(
    () => list.filter(e => e.date >= prevMonthStart && e.date <= prevMonthEnd),
    [list, prevMonthStart, prevMonthEnd],
  );

  const last6Months = useMemo(() => {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    return list.filter(e => e.date >= cutoff);
  }, [list, now]);

  const byCategory = useMemo(() => {
    const source = thisMonth.length > 0 ? thisMonth : last6Months;
    const map: Record<string, number> = {};
    for (const e of source) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map)
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonth, last6Months]);

  const monthlyTrend = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const map: Record<string, number> = Object.fromEntries(months.map(m => [m, 0]));
    for (const e of list) {
      const key = e.date.slice(0, 7);
      if (key in map) map[key] += e.amount;
    }
    return months.map(label => ({ label, amount: map[label] }));
  }, [list, now]);

  const filtered = useMemo(() => {
    return list.filter(e => {
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [list, categoryFilter, search]);

  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = lastMonth.reduce((s, e) => s + e.amount, 0);
  const allTimeTotal = list.reduce((s, e) => s + e.amount, 0);
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);
  const categoryTotal = byCategory.reduce((s, c) => s + c.amount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddExpense({
      id: `exp_${Date.now()}`,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      description: form.description,
      paymentMethod: form.paymentMethod,
      vendor: form.vendor || undefined,
      paidBy: form.paidBy || undefined,
      notes: form.notes || undefined,
      status: 'Paid',
    });
    setShowForm(false);
    refresh();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Expenses</h1>
          <p className="text-sm text-zinc-500">Track and review gym spending</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold">
          <Plus size={16} /> Add expense
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setView('chart')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'chart' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>Overview</button>
        <button type="button" onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'list' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>All expenses</button>
      </div>

      {view === 'chart' && (
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-[10px] text-zinc-500 uppercase">This month</p>
              <p className="text-lg font-bold text-red-400 mt-1">{formatCurrency(monthTotal)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-[10px] text-zinc-500 uppercase">Last month</p>
              <p className="text-lg font-bold text-zinc-300 mt-1">{formatCurrency(lastMonthTotal)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-[10px] text-zinc-500 uppercase">All time</p>
              <p className="text-lg font-bold text-zinc-300 mt-1">{formatCurrency(allTimeTotal)}</p>
            </div>
          </div>

          <TrendChart title="Monthly expense trend (last 6 months)" data={monthlyTrend} color="#ef4444" />

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-semibold mb-1">
              {thisMonth.length > 0 ? 'This month by category' : 'By category (last 6 months)'}
            </h2>
            {thisMonth.length === 0 && (
              <p className="text-[10px] text-zinc-500 mb-3">No expenses recorded this month yet — showing recent history</p>
            )}
            {byCategory.length === 0 ? (
              <p className="text-xs text-zinc-500">No expense data yet. Add your first expense to see breakdowns.</p>
            ) : (
              <div className="space-y-3 mt-3">
                {byCategory.map(({ label, amount }) => {
                  const pct = categoryTotal > 0 ? (amount / categoryTotal) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="text-zinc-400">{formatCurrency(amount)} · {Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-red-500/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <p className="text-xs text-zinc-500 mb-3">Showing {formatCurrency(filteredTotal)}</p>
          <div className="space-y-2">
            {filtered.map(e => (
              <div key={e.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex justify-between gap-3">
                <div>
                  <p className="font-medium">{e.category}</p>
                  <p className="text-sm text-zinc-400">{e.description}</p>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(e.date)} · {e.paymentMethod}{e.vendor ? ` · ${e.vendor}` : ''}</p>
                </div>
                <p className="font-bold text-red-400">{formatCurrency(e.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <form onSubmit={submit} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold">Add expense</h3>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input required type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'].map(m => <option key={m}>{m}</option>)}
            </select>
            <input placeholder="Vendor" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input placeholder="Paid by" value={form.paidBy} onChange={e => setForm({ ...form, paidBy: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" rows={2} />
            <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm">Save expense</button>
          </form>
        </div>
      )}
    </div>
  );
}
