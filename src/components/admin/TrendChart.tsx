import { formatCurrency } from '../../lib/format';

interface Point {
  label: string;
  amount: number;
}

interface Props {
  title: string;
  data: Point[];
  series2?: Point[];
  color?: string;
  color2?: string;
  series1Label?: string;
  series2Label?: string;
  height?: number;
}

const CHART_HEIGHT = 128;

function formatMonthLabel(key: string): string {
  const parts = key.split('-');
  if (parts.length < 2) return key;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short' });
}

function barHeight(amount: number, max: number, chartHeight: number): number {
  if (amount <= 0) return 0;
  return Math.max(6, Math.round((amount / max) * chartHeight));
}

export default function TrendChart({
  title,
  data,
  series2,
  color = '#ea580c',
  color2 = '#ef4444',
  series1Label = 'Revenue',
  series2Label = 'Expenses',
  height = CHART_HEIGHT,
}: Props) {
  const labels = [...new Set([...data.map(d => d.label), ...(series2?.map(d => d.label) ?? [])])].sort();
  const allAmounts = [...data.map(d => d.amount), ...(series2?.map(d => d.amount) ?? [])];
  const max = Math.max(...allAmounts, 1);
  const dual = !!series2;

  if (labels.length === 0 || allAmounts.every(a => a === 0)) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm font-semibold text-white mb-2">{title}</p>
        <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50">
          <p className="text-xs text-zinc-500">No data yet — add payments or expenses to see trends</p>
        </div>
      </div>
    );
  }

  const getAmount = (points: Point[], label: string) =>
    points.find(p => p.label === label)?.amount ?? 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        {dual && (
          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              {series1Label}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color2 }} />
              {series2Label}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: height + 36 }}>
        {labels.map(label => {
          const v1 = getAmount(data, label);
          const v2 = series2 ? getAmount(series2, label) : 0;
          const h1 = barHeight(v1, max, height);
          const h2 = barHeight(v2, max, height);

          return (
            <div key={label} className="flex-1 flex flex-col items-center min-w-0 h-full">
              <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                {dual ? (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-end h-full max-w-[18px]">
                      {v1 > 0 && (
                        <span className="text-[8px] text-zinc-500 mb-0.5 truncate max-w-full">
                          {v1 >= 1000 ? `${Math.round(v1 / 1000)}k` : v1}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: h1, backgroundColor: color, opacity: 0.9 }}
                        title={`${series1Label}: ${formatCurrency(v1)}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end h-full max-w-[18px]">
                      {v2 > 0 && (
                        <span className="text-[8px] text-zinc-500 mb-0.5 truncate max-w-full">
                          {v2 >= 1000 ? `${Math.round(v2 / 1000)}k` : v2}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t transition-all"
                        style={{ height: h2, backgroundColor: color2, opacity: 0.9 }}
                        title={`${series2Label}: ${formatCurrency(v2)}`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    {v1 > 0 && (
                      <span className="text-[8px] text-zinc-500 mb-0.5">
                        {v1 >= 1000 ? `${Math.round(v1 / 1000)}k` : v1}
                      </span>
                    )}
                    <div
                      className="w-full max-w-[32px] rounded-t transition-all"
                      style={{ height: h1, backgroundColor: color, opacity: 0.9 }}
                      title={formatCurrency(v1)}
                    />
                  </div>
                )}
              </div>
              <span className="text-[9px] text-zinc-500 mt-1.5 truncate w-full text-center">
                {formatMonthLabel(label)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
