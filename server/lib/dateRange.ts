export type DatePeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export interface DateRange {
  start: string;
  end: string;
  label: string;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function resolveDateRange(
  period: string,
  from?: string,
  to?: string,
): DateRange {
  const now = new Date();
  const end = to || toDateStr(now);

  if (period === 'custom' && from && to) {
    return { start: from, end: to, label: 'Custom range' };
  }

  if (period === 'today') {
    const today = toDateStr(now);
    return { start: today, end: today, label: 'Today' };
  }

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { start: toDateStr(start), end, label: 'This week' };
  }

  if (period === 'year') {
    return {
      start: `${now.getFullYear()}-01-01`,
      end,
      label: 'This year',
    };
  }

  if (period === 'all') {
    return { start: '2000-01-01', end, label: 'All time' };
  }

  // default: month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: toDateStr(monthStart),
    end,
    label: 'This month',
  };
}

export function inRange(dateStr: string, range: DateRange): boolean {
  return dateStr >= range.start && dateStr <= range.end;
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}
