const IST = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

export function istToday(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: IST });
}

export function istNowTime(date = new Date(), withSeconds = false): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

function parseClock(timeStr: string): { h: number; m: number } | null {
  const s = timeStr.replace(/\s*IST\s*$/i, '').trim();
  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[4]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return { h, m };
}

export function minutesBetweenIst(dateStr: string, startTime: string, end = new Date()): number {
  const clock = parseClock(startTime);
  if (!clock || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 1;
  const hh = String(clock.h).padStart(2, '0');
  const mm = String(clock.m).padStart(2, '0');
  const start = new Date(`${dateStr}T${hh}:${mm}:00${IST_OFFSET}`).getTime();
  if (Number.isNaN(start)) return 1;
  return Math.max(1, Math.round((end.getTime() - start) / 60000));
}
