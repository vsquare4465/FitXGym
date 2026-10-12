import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, MessageCircle, CreditCard, RefreshCw, UserCheck, Pencil, Bell, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/client';
import { Member, MemberProfile, MembershipType, Plan } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';
import StatusBadge from './StatusBadge';
import { fillTemplate, openWhatsApp, WHATSAPP_TEMPLATES } from '../../lib/whatsapp';
import { isValidEmail, parseOptionalAmount, phoneValidationMessage } from '../../lib/validation';
import { useAuth } from '../../context/AuthContext';

interface Props {
  memberId: string | null;
  plans: Plan[];
  gymName: string;
  onClose: () => void;
  onRefresh: () => void;
}

const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  Paid: 'Paid member',
  Complimentary: 'Complimentary (free / known)',
  Staff: 'Staff access',
};

export default function MemberProfileDrawer({ memberId, plans, gymName, onClose, onRefresh }: Props) {
  const { can } = useAuth();
  const canEdit = can('members', 'write');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [renewPayMode, setRenewPayMode] = useState<'later' | 'now'>('later');
  const [renewDiscount, setRenewDiscount] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    dateOfBirth: '',
    address: '',
    membershipType: 'Paid' as MembershipType,
    status: 'Active' as Member['status'],
    gender: '',
    occupation: '',
    alcoholic: false,
    notes: '',
    joinDate: '',
    planStartDate: '',
    expiryDate: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
  });

  const reload = async (id: string) => {
    const p = await adminApi.memberProfile(id);
    setProfile(p);
    return p;
  };

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    adminApi.memberProfile(memberId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [memberId]);

  if (!memberId) return null;

  const m = profile?.member;
  const paymentExempt = m?.membershipType === 'Complimentary' || m?.membershipType === 'Staff';
  const outstanding = profile
    ? Math.max(profile.pendingAmount, profile.currentMembership?.pending ?? 0)
    : 0;
  const renewPlan = plans.find(p => p.id === renewPlanId);
  const renewDisc = parseOptionalAmount(renewDiscount).value || 0;
  const renewCharged = Math.max(0, (renewPlan?.price || 0) - Math.min(renewDisc, renewPlan?.price || 0));

  const openEdit = () => {
    if (!m) return;
    setEditForm({
      name: m.name,
      email: m.email,
      phone: m.phone,
      whatsapp: m.whatsapp || '',
      dateOfBirth: m.dateOfBirth || '',
      address: m.address || '',
      membershipType: m.membershipType || 'Paid',
      status: m.status,
      gender: m.gender || '',
      occupation: m.occupation || '',
      alcoholic: !!m.alcoholic,
      notes: m.notes || '',
      joinDate: m.joinDate || '',
      planStartDate: profile.currentMembership?.startDate || m.joinDate || '',
      expiryDate: m.expiryDate || '',
      emergencyName: m.emergencyContact?.name || '',
      emergencyPhone: m.emergencyContact?.phone || '',
      emergencyRelationship: m.emergencyContact?.relationship || '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    if (!m || !memberId) return;
    if (!isValidEmail(editForm.email)) {
      setEditError('Enter a valid email address.');
      return;
    }
    const phoneError = phoneValidationMessage(editForm.phone);
    if (phoneError) {
      setEditError(phoneError);
      return;
    }
    try {
      await adminApi.updateMember(memberId, {
        ...m,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp || editForm.phone,
        dateOfBirth: editForm.dateOfBirth || undefined,
        address: editForm.address || undefined,
        membershipType: editForm.membershipType,
        status: editForm.status,
        gender: editForm.gender || undefined,
        occupation: editForm.occupation || undefined,
        alcoholic: editForm.alcoholic,
        notes: editForm.notes.trim() || undefined,
        joinDate: editForm.joinDate,
        planStartDate: editForm.planStartDate || editForm.joinDate,
        expiryDate: editForm.expiryDate,
        emergencyContact: {
          name: editForm.emergencyName,
          phone: editForm.emergencyPhone,
          relationship: editForm.emergencyRelationship,
        },
      });
      setShowEdit(false);
      onRefresh();
      await reload(memberId);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const openPaymentReminder = () => {
    if (!m || !profile) return;
    const planName = profile.currentPlan?.name || 'membership';
    const vars = {
      memberName: m.name,
      gymName,
      membershipName: planName,
      expiryDate: formatDate(m.expiryDate),
      pendingAmount: formatCurrency(outstanding),
    };
    if (outstanding > 0) {
      const tpl = WHATSAPP_TEMPLATES.find(t => t.id === 'payment_reminder')!;
      setReminderMsg(fillTemplate(tpl.template, vars));
    } else {
      const tpl = WHATSAPP_TEMPLATES.find(t => t.id === 'expiry_reminder')!;
      setReminderMsg(fillTemplate(tpl.template, vars));
    }
    setShowReminder(true);
  };

  const handleRenew = async () => {
    if (!memberId || !renewPlanId) return;
    setActionError('');
    let amount = 0;
    if (!paymentExempt && renewPayMode === 'now') {
      const parsed = parseOptionalAmount(paidAmount);
      if (parsed.error || parsed.value === undefined) {
        setActionError('Enter the amount paid, or choose Pay later.');
        return;
      }
      amount = parsed.value;
    }
    const discountParsed = parseOptionalAmount(renewDiscount);
    if (discountParsed.error) {
      setActionError(discountParsed.error);
      return;
    }
    setActionSaving(true);
    try {
      await adminApi.renewMember(memberId, {
        planId: renewPlanId,
        paidAmount: amount,
        discount: discountParsed.value || 0,
        paymentMethod: payMethod,
      });
      setShowRenew(false);
      setPaidAmount('');
      setRenewDiscount('');
      setRenewPayMode('later');
      onRefresh();
      await reload(memberId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not renew membership');
    } finally {
      setActionSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!m) return;
    setActionError('');
    const parsed = parseOptionalAmount(payAmount);
    if (parsed.error || parsed.value === undefined || parsed.value <= 0) {
      setActionError('Enter the amount received.');
      return;
    }
    setActionSaving(true);
    try {
      await adminApi.addPayment({
        memberId: m.id,
        memberName: m.name,
        amount: parsed.value,
        date: new Date().toISOString().split('T')[0],
        category: 'Partial Payment',
        paymentMethod: payMethod,
        status: 'Completed',
        membershipId: profile?.currentMembership?.id,
        expectedAmount: outstanding > parsed.value ? outstanding : undefined,
      });
      setShowPayment(false);
      setPayAmount('');
      onRefresh();
      await reload(memberId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save payment');
    } finally {
      setActionSaving(false);
    }
  };

  const handleCheckIn = async () => {
    if (!m) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      await adminApi.checkIn(m.id, now);
      onRefresh();
      await reload(memberId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Check-in failed');
    }
  };

  const handleDelete = async () => {
    if (!m) return;
    if (!confirm(`Permanently delete ${m.name}? This removes their membership, payments, and attendance.`)) return;
    try {
      await adminApi.deleteMember(m.id);
      onRefresh();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const whatsapp = (templateId: string) => {
    if (!m) return;
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === templateId)!;
    const msg = fillTemplate(tpl.template, {
      memberName: m.name,
      gymName,
      membershipName: profile?.currentPlan?.name || 'membership',
      expiryDate: formatDate(m.expiryDate),
      pendingAmount: formatCurrency(profile?.pendingAmount || 0),
    });
    openWhatsApp(m.whatsapp || m.phone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div>
            <h2 className="font-bold text-white">{m?.name || 'Member profile'}</h2>
            <p className="text-xs text-zinc-500">{memberId}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {loading && <p className="p-6 text-sm text-zinc-500">Loading...</p>}

        {profile && m && (
          <div className="p-4 space-y-6 pb-24">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={profile.displayStatus} />
              {m.membershipType && m.membershipType !== 'Paid' && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-violet-500/15 text-violet-300 border-violet-500/30">
                  {MEMBERSHIP_TYPE_LABELS[m.membershipType]}
                </span>
              )}
              <span className="text-xs text-zinc-500">Joined {formatDate(m.joinDate)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <button type="button" onClick={openEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white text-xs font-medium">
                  <Pencil size={14} /> Edit details
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={() => { setRenewPlanId(m.planId); setActionError(''); setRenewPayMode('later'); setPaidAmount(''); setRenewDiscount(''); setShowRenew(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 text-black text-xs font-semibold">
                  <RefreshCw size={14} /> Renew
                </button>
              )}
              {canEdit && !paymentExempt && (
                <button type="button" onClick={() => { setActionError(''); setPayAmount(''); setShowPayment(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white text-xs font-medium">
                  <CreditCard size={14} /> Record payment
                </button>
              )}
              {!paymentExempt && (
                <button type="button" onClick={openPaymentReminder} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                  <Bell size={14} /> Payment reminder · WhatsApp
                </button>
              )}
              <button type="button" onClick={() => whatsapp('general')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium">
                <MessageCircle size={14} /> WhatsApp
              </button>
              {canEdit && (
                <button type="button" onClick={handleCheckIn} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-white text-xs font-medium">
                  <UserCheck size={14} /> Check in
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium">
                  <Trash2 size={14} /> Delete member
                </button>
              )}
            </div>

            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Personal info</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-zinc-500 text-xs">Phone</dt><dd>{m.phone}</dd></div>
                <div><dt className="text-zinc-500 text-xs">WhatsApp</dt><dd>{m.whatsapp || m.phone}</dd></div>
                <div><dt className="text-zinc-500 text-xs">Email</dt><dd className="truncate">{m.email}</dd></div>
                <div><dt className="text-zinc-500 text-xs">DOB</dt><dd>{m.dateOfBirth ? formatDate(m.dateOfBirth) : '-'}</dd></div>
                <div className="col-span-2"><dt className="text-zinc-500 text-xs">Address</dt><dd>{m.address || '-'}</dd></div>
                <div><dt className="text-zinc-500 text-xs">Emergency</dt><dd>{m.emergencyContact?.name || '-'} {m.emergencyContact?.phone}</dd></div>
                <div><dt className="text-zinc-500 text-xs">Type</dt><dd>{MEMBERSHIP_TYPE_LABELS[m.membershipType || 'Paid']}</dd></div>
                <div><dt className="text-zinc-500 text-xs">Gender</dt><dd>{m.gender || '-'}</dd></div>
                <div><dt className="text-zinc-500 text-xs">Occupation</dt><dd>{m.occupation || '-'}</dd></div>
                <div><dt className="text-zinc-500 text-xs">Alcohol</dt><dd>{m.alcoholic ? 'Yes' : 'No'}</dd></div>
                {m.weightHistory?.[0] && (
                  <div><dt className="text-zinc-500 text-xs">Weight</dt><dd>{m.weightHistory[m.weightHistory.length - 1].weight} kg</dd></div>
                )}
                {m.notes && (
                  <div className="col-span-2"><dt className="text-zinc-500 text-xs">Notes / vitals</dt><dd className="whitespace-pre-wrap">{m.notes}</dd></div>
                )}
              </dl>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Current membership</h3>
              <div className="rounded-lg border border-zinc-800 p-3 space-y-1 text-sm">
                <p className="font-medium">{profile.currentPlan?.name || m.planId}</p>
                <p className="text-zinc-500 text-xs">Joined {formatDate(m.joinDate)}</p>
                <p className="text-zinc-500 text-xs">Plan {formatDate(profile.currentMembership?.startDate || m.joinDate)} → {formatDate(m.expiryDate)}</p>
                <div className="flex gap-4 text-xs pt-1">
                  <span>Amount: {paymentExempt ? 'Free' : formatCurrency(profile.currentMembership?.amount || profile.currentPlan?.price || 0)}</span>
                  {!paymentExempt && (profile.currentMembership?.discount || 0) > 0 && (
                    <span className="text-violet-300">Discount: {formatCurrency(profile.currentMembership?.discount || 0)}</span>
                  )}
                  {!paymentExempt && (
                    <>
                      <span>Paid: {formatCurrency(profile.currentMembership?.paidAmount || 0)}</span>
                      {outstanding > 0 && (
                        <span className="text-orange-400 font-medium">Due: {formatCurrency(outstanding)}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Attendance</h3>
              <p className="text-sm">{profile.attendance.totalVisits} total visits</p>
              <p className="text-xs text-zinc-500">Last visit: {profile.attendance.lastVisit ? `${formatDate(profile.attendance.lastVisit.date)} at ${profile.attendance.lastVisit.checkIn}` : 'Never'}</p>
              <div className="mt-2 space-y-1">
                {profile.attendance.recent.slice(0, 5).map(a => (
                  <div key={a.id} className="text-xs flex justify-between text-zinc-400">
                    <span>{formatDate(a.date)}</span>
                    <span>{a.checkIn}{a.checkOut ? ` – ${a.checkOut}` : ' (in gym)'}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase">Payment history</h3>
                <Link to={`/admin/payments?member=${memberId}`} className="text-[10px] text-orange-500 hover:text-orange-400">View all →</Link>
              </div>
              <div className="space-y-2">
                {profile.payments.slice(0, 8).map(p => (
                  <div key={p.id} className="flex justify-between text-xs border-b border-zinc-800/50 pb-2">
                    <div>
                      <p>{p.category}</p>
                      <p className="text-zinc-500">{formatDate(p.date)} · {p.paymentMethod}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
                {profile.payments.length === 0 && (
                  <p className="text-xs text-zinc-500">
                    {paymentExempt
                      ? 'No payments — complimentary / staff member.'
                      : outstanding > 0
                        ? 'No payment received yet — use Payment reminder or Record payment.'
                        : 'No payments recorded yet.'}
                  </p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Membership history</h3>
              <div className="space-y-2">
                {profile.memberships.map(ms => (
                  <div key={ms.id} className="text-xs border border-zinc-800 rounded-lg p-2">
                    <p className="font-medium">{ms.planName || ms.planId}</p>
                    <p className="text-zinc-500">{formatDate(ms.startDate)} – {formatDate(ms.endDate)} · {ms.status}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {showEdit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowEdit(false)} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3">
              <h3 className="font-semibold">Edit member details</h3>
              <input required placeholder="Full name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <input required type="email" placeholder="Email" value={editForm.email} onChange={e => { setEditForm({ ...editForm, email: e.target.value }); setEditError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <input required inputMode="numeric" placeholder="10-digit mobile" value={editForm.phone} onChange={e => { setEditForm({ ...editForm, phone: e.target.value }); setEditError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <input placeholder="WhatsApp" value={editForm.whatsapp} onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <input type="date" placeholder="Date of birth" value={editForm.dateOfBirth} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <label className="block text-xs text-zinc-500">Joining date
                <input type="date" value={editForm.joinDate} onChange={e => setEditForm({ ...editForm, joinDate: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
              </label>
              <label className="block text-xs text-zinc-500">Plan start date
                <input type="date" value={editForm.planStartDate} onChange={e => setEditForm({ ...editForm, planStartDate: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
              </label>
              <label className="block text-xs text-zinc-500">Expiry date
                <input type="date" value={editForm.expiryDate} onChange={e => setEditForm({ ...editForm, expiryDate: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
              </label>
              <textarea placeholder="Address" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm resize-none" />
              <select value={editForm.membershipType} onChange={e => setEditForm({ ...editForm, membershipType: e.target.value as MembershipType })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                <option value="Paid">Paid member</option>
                <option value="Complimentary">Complimentary (free / known person)</option>
                <option value="Staff">Staff (gym team access)</option>
              </select>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as Member['status'] })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                {(['Active', 'Expired', 'Frozen', 'Pending'] as const).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                {(['Male', 'Female'] as const).map(g => (
                  <label key={g} className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm cursor-pointer ${editForm.gender === g ? 'border-orange-500 bg-orange-600/15 text-orange-300' : 'border-zinc-700 text-zinc-400'}`}>
                    <input type="radio" name="edit-gender" className="sr-only" checked={editForm.gender === g} onChange={() => setEditForm({ ...editForm, gender: g })} />
                    {g}
                  </label>
                ))}
              </div>
              <select value={editForm.occupation} onChange={e => setEditForm({ ...editForm, occupation: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                <option value="">Occupation (optional)</option>
                <option value="Housewife">Housewife</option>
                <option value="Business">Business</option>
                <option value="Job">Job</option>
                <option value="Other">Other</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={editForm.alcoholic} onChange={e => setEditForm({ ...editForm, alcoholic: e.target.checked })} className="rounded border-zinc-600" />
                Consumes alcohol
              </label>
              <textarea placeholder="Optional notes — vitals, measurements, weight, or anything else" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm resize-none" />
              <p className="text-xs text-zinc-500 pt-1">Emergency contact</p>
              <input placeholder="Name" value={editForm.emergencyName} onChange={e => setEditForm({ ...editForm, emergencyName: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <input placeholder="Phone" value={editForm.emergencyPhone} onChange={e => setEditForm({ ...editForm, emergencyPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <input placeholder="Relationship" value={editForm.emergencyRelationship} onChange={e => setEditForm({ ...editForm, emergencyRelationship: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              {editError && <p className="text-xs text-red-400">{editError}</p>}
              <button type="button" onClick={handleEditSave} className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm">Save changes</button>
            </div>
          </div>
        )}

        {showReminder && m && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowReminder(false)} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Bell size={16} className="text-amber-400" /> WhatsApp reminder</h3>
              <p className="text-xs text-zinc-500">
                {outstanding > 0
                  ? `Payment due: ${formatCurrency(outstanding)}. Edit the message, then send to ${m.name}.`
                  : `No balance due — pre-filled with renewal reminder. Edit if needed, then send to ${m.name}.`}
              </p>
              <textarea
                value={reminderMsg}
                onChange={e => setReminderMsg(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm resize-none"
              />
              <button
                type="button"
                onClick={() => { openWhatsApp(m.whatsapp || m.phone, reminderMsg); setShowReminder(false); }}
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm"
              >
                Send on WhatsApp
              </button>
            </div>
          </div>
        )}

        {showRenew && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowRenew(false)} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-semibold">Renew membership</h3>
              <select value={renewPlanId} onChange={e => setRenewPlanId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                {plans.filter(p => p.active !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.name} – ₹{p.price}</option>
                ))}
              </select>
              {!paymentExempt && (
                <>
                  <input type="text" inputMode="decimal" placeholder="Discount (optional)" value={renewDiscount} onChange={e => { setRenewDiscount(e.target.value); setActionError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
                  <p className="text-xs text-zinc-500">Plan ₹{renewPlan?.price || 0} · Due ₹{renewCharged}{renewDisc > 0 ? ' (fully paid if they pay this)' : ''}</p>
                  <select value={renewPayMode} onChange={e => setRenewPayMode(e.target.value as 'later' | 'now')} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                    <option value="later">Pay later (no payment now)</option>
                    <option value="now">Paid now</option>
                  </select>
                  {renewPayMode === 'now' && (
                    <>
                      <input type="text" inputMode="decimal" placeholder={`Amount paid now (₹${renewCharged} = full)`} value={paidAmount} onChange={e => { setPaidAmount(e.target.value); setActionError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                        {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'].map(method => <option key={method}>{method}</option>)}
                      </select>
                    </>
                  )}
                  {renewPayMode === 'later' && (
                    <p className="text-xs text-zinc-500">Membership is extended now. Payment stays due until you record it.</p>
                  )}
                </>
              )}
              {paymentExempt && <p className="text-xs text-violet-300">Complimentary / staff — no payment required.</p>}
              {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              <button type="button" disabled={actionSaving} onClick={handleRenew} className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm disabled:opacity-50">
                {actionSaving ? 'Saving...' : 'Confirm renewal'}
              </button>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowPayment(false)} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-semibold">Record payment</h3>
              {outstanding > 0 && <p className="text-xs text-zinc-500">Due now: {formatCurrency(outstanding)}</p>}
              <input type="text" inputMode="decimal" placeholder="Amount received" value={payAmount} onChange={e => { setPayAmount(e.target.value); setActionError(''); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
                {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'].map(method => <option key={method}>{method}</option>)}
              </select>
              {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              <button type="button" disabled={actionSaving} onClick={handlePayment} className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm disabled:opacity-50">
                {actionSaving ? 'Saving...' : 'Save payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
