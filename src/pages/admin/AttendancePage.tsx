import { useMemo, useState } from 'react';
import { QrCode, RefreshCw, Search, UserCheck, LogOut } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { AttendanceRecord, Member } from '../../types';
import { formatDate } from '../../lib/format';

export default function AttendancePage() {
  const { members, attendance, lobbyToken, onRefreshLobbyToken, onCheckInMember, onCheckOutMember, refresh } = useGymData();
  const today = new Date().toISOString().split('T')[0];
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(today);

  const todayRecords = useMemo(
    () => (attendance as AttendanceRecord[]).filter(a => a.date === today),
    [attendance, today],
  );

  const filteredHistory = useMemo(() => {
    return (attendance as AttendanceRecord[])
      .filter(a => a.date === dateFilter)
      .filter(a => !search || a.memberName.toLowerCase().includes(search.toLowerCase()));
  }, [attendance, dateFilter, search]);

  const currentlyInside = todayRecords.filter(a => !a.checkOut);
  const checkInUrl = `${window.location.origin}/checkin?t=${lobbyToken}`;

  const handleManualCheckIn = async (memberId: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      await onCheckInMember(memberId, now);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Already checked in');
    }
  };

  const handleCheckOut = async (memberId: string, checkInTime: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const checkInDate = new Date(`${today} ${checkInTime}`);
    const duration = Math.max(1, Math.round((Date.now() - checkInDate.getTime()) / 60000));
    try {
      await onCheckOutMember(memberId, now, duration);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Check-out failed');
    }
  };

  const rotateQr = async () => {
    await onRefreshLobbyToken();
    refresh();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Attendance</h1>
        <p className="text-sm text-zinc-500">QR check-in, member check-out, and staff log</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><QrCode size={18} className="text-orange-500" /> Gym QR code</h2>
            <p className="text-xs text-zinc-500 mt-1">Members scan this at the entrance to check in and check out</p>
            <p className="text-xs text-zinc-400 mt-2 break-all font-mono">{checkInUrl}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(checkInUrl)}`}
              alt="Gym QR code"
              className="rounded-lg border border-zinc-700 bg-white p-1"
            />
            <button type="button" onClick={rotateQr} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">
              <RefreshCw size={14} /> Regenerate QR
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Today&apos;s visits</p>
          <p className="text-2xl font-bold">{todayRecords.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Currently inside</p>
          <p className="text-2xl font-bold text-emerald-400">{currentlyInside.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Date</p>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="mt-1 bg-transparent text-sm w-full" />
        </div>
      </div>

      {currentlyInside.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-300">
            <LogOut size={16} /> Currently inside — check out
          </h2>
          <div className="space-y-2">
            {currentlyInside.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-emerald-500/20 bg-zinc-900/50">
                <div>
                  <p className="text-sm font-medium">{a.memberName}</p>
                  <p className="text-xs text-zinc-500">In since {a.checkIn}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckOut(a.memberId, a.checkIn)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium"
                >
                  <LogOut size={14} /> Check out
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3">Quick check-in (staff)</h2>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..." className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {(members as Member[])
            .filter(m => m.status === 'Active' && (!search || m.name.toLowerCase().includes(search.toLowerCase())))
            .slice(0, 8)
            .map(m => {
              const open = todayRecords.find(a => a.memberId === m.id && !a.checkOut);
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!!open}
                  onClick={() => handleManualCheckIn(m.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm ${open ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                >
                  <span>{m.name}</span>
                  {open ? <span className="text-xs">In gym since {open.checkIn}</span> : <UserCheck size={16} className="text-zinc-500" />}
                </button>
              );
            })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Attendance log · {formatDate(dateFilter)}</h2>
        <div className="space-y-2">
          {filteredHistory.length === 0 && <p className="text-xs text-zinc-500">No records</p>}
          {filteredHistory.map(a => (
            <div key={a.id} className="flex items-center justify-between gap-3 text-sm rounded-lg border border-zinc-800 p-3">
              <span>{a.memberName}</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{a.checkIn}{a.checkOut ? ` – ${a.checkOut}` : ' · Inside'}</span>
                {!a.checkOut && a.date === today && (
                  <button
                    type="button"
                    onClick={() => handleCheckOut(a.memberId, a.checkIn)}
                    className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    Check out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
