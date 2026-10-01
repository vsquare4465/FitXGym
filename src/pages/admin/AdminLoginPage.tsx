import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, authApi, publicApi } from '../../api/client';
import BrandLogo from '../../components/public/BrandLogo';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState({ logoUrl: '', gymName: 'Fit X Gym' });
  const { loginAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/admin';

  useEffect(() => {
    publicApi.settings()
      .then(s => setBrand({ logoUrl: s.logoUrl || '', gymName: s.gymName || 'Fit X Gym' }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Enter your login email or 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await loginAdmin(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const canSendOtp = identifier.trim().length > 0;

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    if (!canSendOtp) {
      setError('Enter your login email or 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.requestOtp(identifier.trim());
      setOtpSent(true);
      setSuccess(res.message || 'If this account exists, a 6-digit code was sent.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setError(
          local
            ? 'Send OTP does not need a login. This computer is running an old API on port 3001. In this FitXGym folder run npm run dev (website + API), then try again.'
            : 'Password reset is not on the live server yet. Deploy the latest FitXGym code, then try Send OTP again.',
        );
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Could not send code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(identifier.trim(), otp.trim(), newPassword);
      setSuccess('Password updated. You can sign in now.');
      setMode('login');
      setEmail(identifier.includes('@') ? identifier.trim() : email);
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo src={brand.logoUrl} name={brand.gymName} size="header" />
          </div>
          <h1 className="text-2xl font-bold text-white">{mode === 'login' ? 'Admin sign in' : 'Reset password'}</h1>
          <p className="text-sm text-zinc-500 mt-1">{brand.gymName} management portal</p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email or mobile</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white"
                placeholder="you@email.com or 10-digit mobile"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-semibold text-sm transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setIdentifier(email);
                setError('');
                setSuccess('');
                setOtpSent(false);
              }}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {success}
              </div>
            )}
            <p className="text-xs text-zinc-500">
              Enter the email or mobile number on your team profile, then send a 6-digit code. An owner can also generate a code from Team.
            </p>
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email or mobile</label>
                <input
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white"
                  placeholder="you@email.com or 10-digit mobile"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !canSendOtp}
                className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-black font-semibold text-sm transition-colors"
              >
                {loading && !otpSent ? 'Sending…' : otpSent ? 'Resend code' : 'Send OTP'}
              </button>
            </form>

            {otpSent && (
              <form onSubmit={handleReset} className="space-y-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">6-digit code</label>
                  <input
                    required
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white tracking-[0.4em] text-center"
                    placeholder="000000"
                  />
                </div>
                <input
                  required
                  type="password"
                  minLength={6}
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white"
                />
                <input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-semibold text-sm transition-colors"
                >
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); setOtpSent(false); }}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300"
            >
              Back to sign in
            </button>
          </div>
        )}

        <p className="text-center text-xs text-zinc-600 mt-6">
          <Link to="/" className="hover:text-zinc-400 transition-colors">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
