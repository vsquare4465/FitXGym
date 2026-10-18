import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, MessageCircle, Eye, Trash2 } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { Member, MembershipType, Payment, Plan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';
import { addPlanDuration, getMemberDisplayStatus, todayISO } from '../../lib/memberUtils';
import StatusBadge from '../../components/admin/StatusBadge';
import MemberProfileDrawer from '../../components/admin/MemberProfileDrawer';
import MemberPhotoPicker, { MemberAvatar } from '../../components/admin/MemberPhotoPicker';
import { adminApi } from '../../api/client';
import { fillTemplate, openWhatsApp, WHATSAPP_TEMPLATES } from '../../lib/whatsapp';
import { aadhaarValidationMessage, digitsOnly, parseOptionalAmount, phoneValidationMessage, shortAddress } from '../../lib/validation';

type Filter = 'all' | 'active' | 'expiring' | 'expired' | 'pending' | 'free';
type PayMode = 'later' | 'now';

const EMPTY_ADD = {
  name: '',
  phone: '',
  aadhaar: '',
  address: '',
  photo: '',
  planId: '',
  paidAmount: '',
  discount: '',
  paymentMethod: 'Cash',
  payMode: 'later' as PayMode,
  membershipType: 'Paid' as MembershipType,
  gender: '',
  alcoholic: false,
  weight: '',
  notes: '',
  joinDate: todayISO(),
  planStartDate: todayISO(),
  expiryDate: '',
};

export default function MembersPage() {
  const { can } = useAuth();
  const { members, payments, plans, settings, refresh } = useGymData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_ADD);

  const planList = plans as Plan[];
  const planMap = useMemo(() => Object.fromEntries(planList.map(p => [p.id, p])), [planList]);
  const selectedPlanId = planList.some(p => p.id === form.planId) ? form.planId : (planList[0]?.id || '');
  const selectedPlan = planList.find(p => p.id === selectedPlanId);
  const planPrice = selectedPlan?.price || 0;
  const discountValue = parseOptionalAmount(form.discount).value || 0;
  const chargedDue = Math.max(0, planPrice - Math.min(discountValue, planPrice));

  useEffect(() => {
    if (selectedPlanId && selectedPlanId !== form.planId) {
      setForm(f => ({ ...f, planId: selectedPlanId }));
    }
  }, [selectedPlanId, form.planId]);

  useEffect(() => {
    if (!selectedPlan) return;
    const start = form.planStartDate || form.joinDate;
    if (!start) return;
    const expiry = addPlanDuration(start, selectedPlan.duration);
    setForm(f => (f.expiryDate === expiry ? f : { ...f, expiryDate: expiry }));
  }, [selectedPlanId, selectedPlan?.duration, form.joinDate, form.planStartDate]);

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
      (member.phone || '').includes(q) || member.id.toLowerCase().includes(q) ||
      (member.address || '').toLowerCase().includes(q) ||
      digitsOnly(member.aadhaar || '').includes(digitsOnly(q));
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
    if (saving) return;
    setFormError('');
    if (!form.name.trim()) {
      setFormError("Enter the member's full name.");
      return;
    }
    if (!selectedPlanId) {
      setFormError('Pick a membership plan.');
      return;
    }
    if (!form.joinDate) {
      setFormError('Enter the joining date.');
      return;
    }
    if (form.phone.trim()) {
      const phoneError = phoneValidationMessage(form.phone);
      if (phoneError) {
        setFormError(phoneError);
        return;
      }
    }
    const aadhaarError = aadhaarValidationMessage(form.aadhaar);
    if (aadhaarError) {
      setFormError(aadhaarError);
      return;
    }
    const discountParsed = parseOptionalAmount(form.discount);
    if (discountParsed.error) {
      setFormError(discountParsed.error);
      return;
    }
    let paidAmount = 0;
    if (form.membershipType === 'Paid' && form.payMode === 'now') {
      const amount = parseOptionalAmount(form.paidAmount);
      if (amount.error || amount.value === undefined) {
        setFormError('Enter the amount paid, or choose Pay later.');
        return;
      }
      paidAmount = amount.value;
    }
    setSaving(true);
    try {
      await adminApi.createMember({
        name: form.name.trim(),
        phone: form.phone.trim(),
        aadhaar: digitsOnly(form.aadhaar) || undefined,
        address: shortAddress(form.address) || undefined,
        photo: form.photo || undefined,
        planId: selectedPlanId,
        membershipType: form.membershipType,
        paidAmount,
        discount: discountParsed.value || 0,
        paymentMethod: form.payMode === 'now' ? form.paymentMethod : 'Cash',
        gender: form.gender || undefined,
        alcoholic: form.alcoholic,
        weight: form.weight.trim() || undefined,
        notes: form.notes.trim() || undefined,
        joinDate: form.joinDate,
        planStartDate: form.planStartDate || form.joinDate,
        expiryDate: form.expiryDate,
      });
      setShowAdd(false);
      setForm({ ...EMPTY_ADD, planId: planList[0]?.id || '' });
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This removes their membership, payments, and attendance.`)) return;
    try {
      await adminApi.deleteMember(id);
      if (selectedId === id) setSelectedId(null);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete member');
    }
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
          <button type="button" onClick={() => { const today = todayISO(); setForm({ ...EMPTY_ADD, planId: planList[0]?.id || '', joinDate: today, planStartDate: today }); setFormError(''); setShowAdd(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold">
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
            placeholder="Search name, phone, ID, locality..."
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
              <div className="flex items-start gap-3 min-w-0">
                <MemberAvatar photo={member.photo} name={member.name} />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{member.name}</p>
                  <p className="text-xs text-zinc-500">{member.id}{member.phone ? ` · ${member.phone}` : ''}</p>
                  {member.address && <p className="text-xs text-zinc-500 truncate">{member.address}</p>}
                </div>
              </div>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-zinc-400 mb-3">{planName} · Expires {formatDate(member.expiryDate)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedId(member.id)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-xs font-medium flex items-center justify-center gap-1">
                <Eye size={14} /> View
              </button>
              {(member.whatsapp || member.phone) && (
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
              )}
              {can('members', 'write') && (
                <button type="button" onClick={() => handleDelete(member.id, member.name)} className="p-2 rounded-lg bg-red-500/10 text-red-400">
                  <Trash2 size={16} />
                </button>
              )}
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
                  <div className="flex items-center gap-3">
                    <MemberAvatar photo={member.photo} name={member.name} size="sm" />
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.id}{member.phone ? ` · ${member.phone}` : ''}{member.address ? ` · ${member.address}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-zinc-400">{planName}</td>
                <td className="p-3 text-zinc-400">{formatDate(member.expiryDate)}</td>
                <td className="p-3"><StatusBadge status={status} /></td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setSelectedId(member.id)} className="px-2 py-1 rounded bg-zinc-800 text-xs">View</button>
                    {can('members', 'write') && (
                      <button type="button" onClick={() => handleDelete(member.id, member.name)} className="px-2 py-1 rounded bg-red-500/10 text-xs text-red-400">Delete</button>
                    )}
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
          <form noValidate onSubmit={handleAdd} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold">Add new member</h3>
            <p className="text-xs text-zinc-500">Member ID is assigned in sequence (MEM-0001, MEM-0002, …).</p>
            <MemberPhotoPicker value={form.photo} onChange={photo => { setForm({ ...form, photo }); setFormError(''); }} onError={setFormError} />
            <input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input inputMode="numeric" placeholder="10-digit mobile (optional)" value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); setFormError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input inputMode="numeric" maxLength={12} placeholder="Aadhaar (optional, 12 digits)" value={form.aadhaar} onChange={e => { setForm({ ...form, aadhaar: digitsOnly(e.target.value).slice(0, 12) }); setFormError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input maxLength={80} placeholder="Locality / area (e.g. Senthli, Khurja)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              {(['Male', 'Female'] as const).map(g => (
                <label key={g} className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm cursor-pointer ${form.gender === g ? 'border-orange-500 bg-orange-600/15 text-orange-300' : 'border-zinc-700 text-zinc-400'}`}>
                  <input type="radio" name="gender" className="sr-only" checked={form.gender === g} onChange={() => setForm({ ...form, gender: g })} />
                  {g}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={form.alcoholic} onChange={e => setForm({ ...form, alcoholic: e.target.checked })} className="rounded border-zinc-600" />
              Consumes alcohol
            </label>
            <input type="text" inputMode="decimal" placeholder="Weight in kg (optional)" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <textarea placeholder="Optional notes — vitals, measurements, or anything else" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm resize-none" />
            <select value={form.membershipType} onChange={e => setForm({ ...form, membershipType: e.target.value as MembershipType, paidAmount: e.target.value !== 'Paid' ? '' : form.paidAmount })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              <option value="Paid">Paid member</option>
              <option value="Complimentary">Complimentary (free / known person)</option>
              <option value="Staff">Staff (gym team)</option>
            </select>
            <select value={selectedPlanId} onChange={e => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              {!selectedPlanId && <option value="">Select a plan</option>}
              {planList.map(p => <option key={p.id} value={p.id}>{p.name} – ₹{p.price}</option>)}
            </select>
            <p className="text-xs text-zinc-500">For past members, set the real joining and plan start dates. Expiry is calculated from the plan duration.</p>
            <label className="block text-xs text-zinc-500">Joining date
              <input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value, planStartDate: form.planStartDate === form.joinDate || !form.planStartDate ? e.target.value : form.planStartDate })} className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
            </label>
            <label className="block text-xs text-zinc-500">Plan start date
              <input type="date" value={form.planStartDate} onChange={e => setForm({ ...form, planStartDate: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
            </label>
            <label className="block text-xs text-zinc-500">Expiry date (from {selectedPlan?.duration || 'plan'})
              <input type="date" readOnly value={form.expiryDate} className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950/70 border border-zinc-700 text-sm text-zinc-300" />
            </label>
            {form.membershipType === 'Paid' && (
              <>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Discount (optional) e.g. 200"
                  value={form.discount}
                  onChange={e => { setForm({ ...form, discount: e.target.value }); setFormError(''); }}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Plan ₹{planPrice}
                  {discountValue > 0 ? ` · Discount ₹${Math.min(discountValue, planPrice)}` : ''}
                  {' '}· Due ₹{chargedDue}
                  {discountValue > 0 ? ' — paying this due amount is fully paid' : ''}
                </p>
                <select
                  value={form.payMode}
                  onChange={e => setForm({ ...form, payMode: e.target.value as PayMode, paidAmount: e.target.value === 'later' ? '' : form.paidAmount })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
                >
                  <option value="later">Pay later (no payment now)</option>
                  <option value="now">Paid now</option>
                </select>
                {form.payMode === 'later' && (
                  <p className="text-xs text-zinc-500">Member is created with ₹{chargedDue} due. Record payment anytime from their profile.</p>
                )}
                {form.payMode === 'now' && (
                  <>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={`Amount paid now (₹${chargedDue} = full)`}
                      value={form.paidAmount}
                      onChange={e => { setForm({ ...form, paidAmount: e.target.value }); setFormError(''); }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
                    />
                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                      {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'].map(method => <option key={method}>{method}</option>)}
                    </select>
                  </>
                )}
              </>
            )}
            {form.membershipType !== 'Paid' && (
              <p className="text-xs text-violet-300">No payment will be recorded for complimentary / staff members.</p>
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm disabled:opacity-50">
              {saving ? 'Creating...' : 'Create member'}
            </button>
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
