import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { Plan } from '../../types';

export default function PlansPage() {
  const { plans, setPlans } = useGymData();
  const list = plans as Plan[];
  const [editing, setEditing] = useState<Plan | null>(null);

  const save = async () => {
    if (!editing) return;
    const next = list.some(p => p.id === editing.id)
      ? list.map(p => (p.id === editing.id ? editing : p))
      : [...list, editing];
    await setPlans(next);
    setEditing(null);
  };

  const toggleActive = async (plan: Plan) => {
    const next = list.map(p => (p.id === plan.id ? { ...p, active: !p.active } : p));
    await setPlans(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Membership plans</h1>
          <p className="text-sm text-zinc-500">Templates shown on your public website</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ id: `plan_${Date.now()}`, name: '', duration: '1 Month', price: 0, features: [], description: '', active: true })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold"
        >
          <Plus size={16} /> Add plan
        </button>
      </div>

      <div className="space-y-3">
        {list.map(plan => (
          <div key={plan.id} className={`rounded-xl border p-4 ${plan.active !== false ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-800/50 bg-zinc-900/20 opacity-60'}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.popular && <span className="text-[10px] bg-orange-600 text-black px-1.5 py-0.5 rounded font-bold">POPULAR</span>}
                  {plan.active === false && <span className="text-[10px] text-zinc-500">Inactive</span>}
                </div>
                <p className="text-sm text-zinc-500">{plan.duration} · ₹{plan.price.toLocaleString('en-IN')}</p>
                {plan.description && <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>}
                <ul className="mt-2 space-y-1">
                  {plan.features.slice(0, 4).map(f => (
                    <li key={f} className="text-xs text-zinc-400 flex gap-1"><Check size={12} className="text-orange-500 mt-0.5" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(plan)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">Edit</button>
                <button type="button" onClick={() => toggleActive(plan)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">
                  {plan.active !== false ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold">{list.some(p => p.id === editing.id) ? 'Edit plan' : 'New plan'}</h3>
            <input placeholder="Plan name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input placeholder="Duration (e.g. 3 Months)" value={editing.duration} onChange={e => setEditing({ ...editing, duration: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input type="number" placeholder="Price" value={editing.price || ''} onChange={e => setEditing({ ...editing, price: parseInt(e.target.value, 10) || 0 })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <textarea placeholder="Description" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" rows={2} />
            <textarea placeholder="Benefits (one per line)" value={editing.features.join('\n')} onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').filter(Boolean) })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" rows={4} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.popular || false} onChange={e => setEditing({ ...editing, popular: e.target.checked })} />
              Mark as popular
            </label>
            <button type="button" onClick={save} className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm">Save plan</button>
          </div>
        </div>
      )}
    </div>
  );
}
