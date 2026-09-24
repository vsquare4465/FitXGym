import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { UserCheck, LogOut, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { publicApi, ApiError } from '../../api/client';
import { loadSavedCheckIn, saveCheckIn, clearSavedCheckIn } from '../../lib/checkinStorage';

export default function CheckInPage() {
  const [params] = useSearchParams();
  const tokenParam = params.get('t') || '';
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [memberId, setMemberId] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      publicApi.validateCheckinToken(tokenParam).then(r => setValidToken(r.valid));
    } else {
      setValidToken(false);
    }
  }, [tokenParam]);

  useEffect(() => {
    const saved = loadSavedCheckIn();
    if (saved?.memberId) {
      setMemberId(saved.memberId);
      setMemberName(saved.memberName || '');
      setSavedLabel(saved.memberName ? `${saved.memberName} (${saved.memberId})` : saved.memberId);
    }
  }, []);

  useEffect(() => {
    if (!validToken || !tokenParam || !memberId.trim()) return;
    publicApi.checkinStatus(tokenParam, memberId.trim().toUpperCase())
      .then(status => {
        setMemberName(status.memberName);
        setCheckedIn(status.checkedIn);
        setCheckInTime(status.checkIn);
        if (status.checkedIn) {
          setSavedLabel(`${status.memberName} (${memberId.trim().toUpperCase()})`);
        }
      })
      .catch(() => { /* ignore — user can still enter ID manually */ });
  }, [validToken, tokenParam, memberId]);

  const submit = async (action: 'in' | 'out') => {
    if (!tokenParam || !memberId.trim()) return;
    setLoading(true);
    setMessage(null);
    const id = memberId.trim().toUpperCase();
    try {
      const res = await publicApi.checkIn({ token: tokenParam, memberId: id, action });
      setMemberName(res.memberName);
      if (rememberDevice) {
        saveCheckIn({ memberId: id, memberName: res.memberName, savedAt: new Date().toISOString() });
        setSavedLabel(`${res.memberName} (${id})`);
      }
      if (res.action === 'checkin') {
        setCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setMessage({ type: 'success', text: `Welcome, ${res.memberName}! Checked in.` });
      } else {
        setCheckedIn(false);
        setCheckInTime(null);
        setMessage({ type: 'success', text: `Good workout, ${res.memberName}! Checked out.` });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message;
      if (msg?.includes('Already checked in')) {
        setCheckedIn(true);
        setMessage({ type: 'error', text: 'You are already checked in. Tap Check Out when you leave.' });
      } else {
        setMessage({ type: 'error', text: msg || 'Check-in failed. Verify your member ID.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const forgetDevice = () => {
    clearSavedCheckIn();
    setMemberId('');
    setMemberName('');
    setSavedLabel(null);
    setCheckedIn(false);
    setCheckInTime(null);
    setMessage(null);
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
        Verifying QR code...
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-center">
        <div className="max-w-sm">
          <AlertCircle className="mx-auto text-red-400 mb-3" size={32} />
          <p className="text-white font-semibold mb-2">Invalid or expired QR code</p>
          <p className="text-sm text-zinc-500 mb-4">Scan the current QR poster at the gym entrance.</p>
          <Link to="/" className="text-orange-500 text-sm">Back to website</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="p-4 border-b border-zinc-800 text-center">
        <p className="font-bold text-lg">Fit X Gym</p>
        <p className="text-xs text-zinc-500">Scan QR · Enter member ID · Check in/out</p>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          {message && (
            <div className={`p-4 rounded-xl text-sm flex gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {message.type === 'success' ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
              {message.text}
            </div>
          )}

          {savedLabel && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-400">Saved on this device: <span className="text-white font-medium">{savedLabel}</span></span>
              <button type="button" onClick={forgetDevice} className="text-zinc-500 hover:text-red-400 p-1" title="Forget saved ID">
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {checkedIn ? (
            <>
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <UserCheck className="mx-auto text-emerald-400 mb-2" size={28} />
                <p className="font-semibold text-emerald-300">{memberName || savedLabel}</p>
                <p className="text-sm text-zinc-400 mt-1">You&apos;re checked in{checkInTime ? ` since ${checkInTime}` : ''}</p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => submit('out')}
                className="w-full py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                {loading ? 'Please wait...' : 'Check Out'}
              </button>
              <p className="text-center text-[10px] text-zinc-600">Tap Check Out when you leave the gym</p>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-400 text-center">Enter your member ID from your membership card.</p>
              <input
                type="text"
                placeholder="Member ID (e.g. MEM-9021)"
                value={memberId}
                onChange={e => setMemberId(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-lg font-mono text-center tracking-wide"
                autoComplete="off"
              />
              <label className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} className="rounded" />
                Remember on this device
              </label>
              <button
                type="button"
                disabled={loading || !memberId.trim()}
                onClick={() => submit('in')}
                className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-bold text-base flex items-center justify-center gap-2"
              >
                <UserCheck size={20} />
                {loading ? 'Please wait...' : 'Check In'}
              </button>
            </>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-[10px] text-zinc-600">
        Need help? Ask at the front desk.
      </footer>
    </div>
  );
}
