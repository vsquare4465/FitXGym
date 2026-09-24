import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: 'orange' | 'green' | 'red' | 'blue' | 'zinc';
}

const accents = {
  orange: 'text-orange-500 bg-orange-500/10',
  green: 'text-emerald-400 bg-emerald-500/10',
  red: 'text-red-400 bg-red-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  zinc: 'text-zinc-400 bg-zinc-500/10',
};

export default function StatCard({ label, value, sub, icon: Icon, accent = 'orange' }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 truncate">{value}</p>
          {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg flex-shrink-0 ${accents[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
