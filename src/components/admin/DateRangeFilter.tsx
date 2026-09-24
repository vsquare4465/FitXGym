import { useState } from 'react';

export type DatePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface Props {
  period: DatePeriod;
  from: string;
  to: string;
  onChange: (period: DatePeriod, from: string, to: string) => void;
}

const PRESETS: { id: DatePeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

export default function DateRangeFilter({ period, from, to, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(period === 'custom');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            if (p.id === 'custom') {
              setShowCustom(true);
              onChange('custom', from, to);
            } else {
              setShowCustom(false);
              onChange(p.id, '', '');
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            period === p.id
              ? 'bg-orange-600 text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={from}
            onChange={e => onChange('custom', e.target.value, to)}
            className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs"
          />
          <span className="text-zinc-600 text-xs">to</span>
          <input
            type="date"
            value={to}
            onChange={e => onChange('custom', from, e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs"
          />
        </div>
      )}
    </div>
  );
}
