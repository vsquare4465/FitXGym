import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RegistrationPortal from '../../components/RegistrationPortal';
import { Member, Plan } from '../../types';
import { publicApi } from '../../api/client';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const planId = params.get('plan') || 'plan_quarterly';

  useEffect(() => {
    publicApi.plans().then(p => setPlans(p as Plan[])).catch(console.error);
  }, []);

  const handleRegisterSuccess = async (
    newMember: Member,
    planPrice: number,
    paymentMethod: 'UPI' | 'Card' | 'Cash'
  ) => {
    await publicApi.register({ member: newMember, planPrice, paymentMethod });
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-8">
      <RegistrationPortal
        plans={plans}
        onRegisterSuccess={handleRegisterSuccess}
        preSelectedPlanId={planId}
      />
    </div>
  );
}
