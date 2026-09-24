import { useMemo, useState } from 'react';
import { Search, Plus, MessageCircle, Eye } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { Member, MembershipType, Payment, Plan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';
import { getMemberDisplayStatus } from '../../lib/memberUtils';
import StatusBadge from '../../components/admin/StatusBadge';
import MemberProfileDrawer from '../../components/admin/MemberProfileDrawer';
import { adminApi } from '../../api/client';
import { fillTemplate, openWhatsApp, WHATSAPP_TEMPLATES } from '../../lib/whatsapp';

type Filter = 'all' | 'active' | 'expiring' | 'expired' | 'pending' | 'free';

export default function MembersPage() {
  const { can } = useAuth();
  const { members, payments, plans, settings, refresh } = useGymData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    planId: 'plan_monthly',
    paidAmount: '',
    membershipType: 'Paid' as MembershipType,
  });

  const planMap = useMemo(() => Object.fromEntries((plans as Plan[]).map(p => [p.id, p])), [plans]);

  const enriched = useMemo(() => {
    return (members as Member[]).map(m => ({
      member: m,
      status: getMemberDisplayStatus(m, payments as Payment[]),
      planName: planMap[m.planId]?.name || m.planId,
    }));
  }, [members, payments, planMap]);

  const filtered = enriched.filter(({ member, status }) => {
    const q = search.toLowerCase();
    const matchSearch = !q || member.name.toLowerCase().includes(q) ||
      member.phone.includes(q) || member.id.toLowerCase().includes(q) || member.email.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && status === 'Active') ||
      (filter === 'expiring' && status === 'Expiring Soon') ||
      (filter === 'expired' && status === 'Expired') ||
      (filter === 'pending' && (status === 'Payment Pending' || status === 'Pending')) ||
      (filter === 'free' && (member.membershipType === 'Complimentary' || member.membershipType === 'Staff'));
    return matchSearch && matchFilter;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminApi.createMember({
      ...form,
      paidAmount: form.paidAmount ? parseFloat(form.paidAmount) : undefined,
      paymentMethod: 'Cash',
    });
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', planId: 'plan_monthly', paidAmount: '', membershipType: 'Paid' });
    refresh();
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this member?')) return;
    await adminApi.deactivateMember(id);
    refresh();
  };

  const gymName = settings.gymName || 'Fit X Gym';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Members</h1>
          <p className="text-sm text-zinc-500">{members.length} total · {filtered.length} shown</p>
        </div>
        {can('members', 'write') && (
          <button type="button" onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold">
            <Plus size={16} /> Add member
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'expiring', 'expired', 'pending', 'free'] as Filter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(({ member, status, planName }) => (
          <div key={member.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-zinc-500">{member.id} · {member.phone}</p>
              </div>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-zinc-400 mb-3">{planName} · Expires {formatDate(member.expiryDate)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedId(member.id)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-xs font-medium flex items-center justify-center gap-1">
                <Eye size={14} /> View
              </button>
              <button
                type="button"
                onClick={() => {
                  const tpl = WHATSAPP_TEMPLATES[0];
                  openWhatsApp(member.whatsapp || member.phone, fillTemplate(tpl.template, { memberName: member.name, gymName, membershipName: planName, expiryDate: formatDate(member.expiryDate), pendingAmount: '' }));
                }}
                className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-zinc-500 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Member</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Expiry</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ member, status, planName }) => (
              <tr key={member.id} className="border-t border-zinc-800/80 hover:bg-zinc-900/30">
                <td className="p-3">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-zinc-500">{member.id} · {member.phone}</p>
                </td>
                <td className="p-3 text-zinc-400">{planName}</td>
                <td className="p-3 text-zinc-400">{formatDate(member.expiryDate)}</td>
                <td className="p-3"><StatusBadge status={status} /></td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setSelectedId(member.id)} className="px-2 py-1 rounded bg-zinc-800 text-xs">View</button>
                    <button type="button" onClick={() => handleDeactivate(member.id)} className="px-2 py-1 rounded bg-zinc-800 text-xs text-red-400">Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAdd(false)} />
          <form onSubmit={handleAdd} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-semibold">Add new member</h3>
            <input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input required placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <select value={form.membershipType} onChange={e => setForm({ ...form, membershipType: e.target.value as MembershipType, paidAmount: e.target.value !== 'Paid' ? '' : form.paidAmount })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              <option value="Paid">Paid member</option>
              <option value="Complimentary">Complimentary (free / known person)</option>
              <option value="Staff">Staff (gym team)</option>
            </select>
            <select value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              {(plans as Plan[]).map(p => <option key={p.id} value={p.id}>{p.name} – ₹{p.price}</option>)}
            </select>
            {form.membershipType === 'Paid' && (
              <>
                <input type="number" min={0} placeholder="Amount paid now (leave empty if not paid yet)" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
                <p className="text-xs text-zinc-500">If left empty, the full plan fee stays due and you can send a WhatsApp payment reminder from the member profile.</p>
              </>
            )}
            {form.membershipType !== 'Paid' && (
              <p className="text-xs text-violet-300">No payment will be recorded for complimentary / staff members.</p>
            )}
            <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm">Create member</button>
          </form>
        </div>
      )}

      <MemberProfileDrawer
        memberId={selectedId}
        plans={plans as Plan[]}
        gymName={gymName}
        onClose={() => setSelectedId(null)}
        onRefresh={refresh}
      />
    </div>
  );
}
