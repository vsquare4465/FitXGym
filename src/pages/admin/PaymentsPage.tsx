import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { Member, Payment, Plan } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';

const CATEGORIES = [
  'New Membership', 'Renewal', 'Partial Payment', 'Advance Payment',
  'Personal Training', 'Product Sales', 'Other Income',
];

const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];
type PayType = 'paid' | 'partial' | 'not_paid';

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const { payments, members, plans, onAddPayment, refresh } = useGymData();
  const list = payments as Payment[];
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'not_paid'>('all');
  const [memberFilter, setMemberFilter] = useState(searchParams.get('member') || 'all');

  useEffect(() => {
    const m = searchParams.get('member');
    if (m) setMemberFilter(m);
  }, [searchParams]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    memberId: '',
    payType: 'paid' as PayType,
    amount: '',
    category: 'New Membership',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: '',
    expectedAmount: '',
  });

  const planMap = useMemo(() => Object.fromEntries((plans as Plan[]).map(p => [p.id, p])), [plans]);

  const filtered = useMemo(() => {
    return list.filter(p => {
      const isNotPaid = p.status === 'Pending' && p.amount === 0;
      if (statusFilter === 'completed' && p.status !== 'Completed') return false;
      if (statusFilter === 'pending' && (p.status !== 'Pending' || isNotPaid)) return false;
      if (statusFilter === 'not_paid' && !isNotPaid) return false;
      if (memberFilter !== 'all' && p.memberId !== memberFilter) return false;
      if (search && !p.memberName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, statusFilter, memberFilter, search]);

  const totals = useMemo(() => {
    const completed = list.filter(p => p.status === 'Completed');
    const pending = list.filter(p => p.status === 'Pending' && p.amount > 0);
    const notPaid = list.filter(p => p.status === 'Pending' && p.amount === 0);
    return {
      collected: completed.reduce((s, p) => s + p.amount, 0),
      pending: pending.reduce((s, p) => s + p.amount, 0),
      notPaidCount: notPaid.length,
    };
  }, [list]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = (members as Member[]).find(m => m.id === form.memberId);
    if (!member) return;

    const planPrice = planMap[member.planId]?.price || 0;
    const expected = form.expectedAmount ? parseFloat(form.expectedAmount) : planPrice;

    let amount = 0;
    let status: 'Completed' | 'Pending' = 'Completed';
    if (form.payType === 'paid') {
      amount = parseFloat(form.amount) || expected;
      status = 'Completed';
    } else if (form.payType === 'partial') {
      amount = parseFloat(form.amount) || 0;
      status = 'Pending';
    } else {
      amount = 0;
      status = 'Pending';
    }

    await onAddPayment({
      id: `pay_${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      amount,
      expectedAmount: form.payType !== 'paid' ? expected : undefined,
      date: new Date().toISOString().split('T')[0],
      category: form.category,
      paymentMethod: form.paymentMethod,
      status,
      invoiceNo: `FTX-INV-${Math.floor(6000 + Math.random() * 3000)}`,
      referenceNo: form.referenceNo || undefined,
      notes: form.notes || (form.payType === 'not_paid' ? 'Not paid yet' : undefined),
    });
    setShowForm(false);
    setForm({ memberId: '', payType: 'paid', amount: '', category: 'New Membership', paymentMethod: 'Cash', referenceNo: '', notes: '', expectedAmount: '' });
    refresh();
  };

  const displayStatus = (p: Payment) => {
    if (p.status === 'Pending' && p.amount === 0) return 'Not Paid';
    return p.status;
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <p className="text-sm text-zinc-500">Record paid, partial, or not paid</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold">
          <Plus size={16} /> Record payment
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[10px] text-zinc-500">Collected</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(totals.collected)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[10px] text-zinc-500">Pending</p>
          <p className="text-lg font-bold text-orange-400">{formatCurrency(totals.pending)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[10px] text-zinc-500">Not paid</p>
          <p className="text-lg font-bold text-red-400">{totals.notPaidCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm" />
        </div>
        <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm min-w-[160px]">
          <option value="all">All members</option>
          {(members as Member[]).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['all', 'All'],
          ['completed', 'Paid'],
          ['pending', 'Partial'],
          ['not_paid', 'Not paid'],
        ] as const).map(([f, label]) => (
          <button key={f} type="button" onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === f ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-500 mb-3">{filtered.length} payment(s)</p>

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium">{p.memberName}</p>
              <p className="text-xs text-zinc-500">{p.category} · {formatDate(p.date)} · {p.paymentMethod}</p>
              {p.expectedAmount && p.expectedAmount > p.amount && (
                <p className="text-xs text-orange-400">Due: {formatCurrency(p.expectedAmount - p.amount)} of {formatCurrency(p.expectedAmount)}</p>
              )}
              {p.notes && <p className="text-xs text-zinc-600">{p.notes}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold">{p.amount === 0 ? '—' : formatCurrency(p.amount)}</p>
              <span className={`text-[10px] font-semibold ${
                displayStatus(p) === 'Completed' ? 'text-emerald-400' :
                displayStatus(p) === 'Not Paid' ? 'text-red-400' : 'text-orange-400'
              }`}>{displayStatus(p)}</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <form onSubmit={submit} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold">Record payment</h3>
            <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              <option value="">Select member</option>
              {(members as Member[]).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <div className="grid grid-cols-3 gap-2">
              {(['paid', 'partial', 'not_paid'] as PayType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, payType: t })}
                  className={`py-2 rounded-lg text-xs font-medium capitalize ${form.payType === t ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  {t === 'not_paid' ? 'Not paid' : t}
                </button>
              ))}
            </div>

            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>

            {form.payType !== 'not_paid' && (
              <input required={form.payType === 'paid'} type="number" placeholder={form.payType === 'partial' ? 'Amount paid so far' : 'Amount paid'} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            )}

            {form.payType !== 'paid' && (
              <input type="number" placeholder="Total amount due" value={form.expectedAmount} onChange={e => setForm({ ...form, expectedAmount: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            )}

            {form.payType !== 'not_paid' && (
              <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            )}

            <input placeholder="Reference ID (optional)" value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" rows={2} />
            <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
