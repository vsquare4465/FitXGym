import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Flame, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/admin';

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center mx-auto mb-4">
            <Flame size={28} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin sign in</h1>
          <p className="text-sm text-zinc-500 mt-1">Fit X Gym management portal</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm text-white"
              placeholder="owner@fitxgym.com"
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
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          <Link to="/" className="hover:text-zinc-400 transition-colors">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
