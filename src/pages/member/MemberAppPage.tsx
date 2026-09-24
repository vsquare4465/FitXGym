import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberPortal from '../../components/MemberPortal';
import { Member, Payment } from '../../types';
import { memberApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function MemberAppPage() {
  const { user, logout } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([memberApi.me(), memberApi.payments()])
      .then(([m, p]) => {
        setMember(m as Member);
        setPayments(p as Payment[]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !member || !user || user.role !== 'member') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-orange-500 text-sm animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="text-sm text-zinc-500 hover:text-white">← Website</Link>
        <button type="button" onClick={() => logout()} className="text-sm text-zinc-500 hover:text-red-400">
          Sign out
        </button>
      </header>
      <MemberPortal
        currentMember={member}
        allMembers={[member]}
        onUpdateMember={async updated => {
          const m = await memberApi.updateMe(updated);
          setMember(m as Member);
        }}
        onRenewSuccess={async (memberId, planId, paidAmount, paymentMethod) => {
          const m = await memberApi.renew(planId, paidAmount, paymentMethod);
          setMember(m as Member);
          const p = await memberApi.payments();
          setPayments(p as Payment[]);
        }}
        payments={payments}
        loggedInUser={user}
      />
    </div>
  );
}
