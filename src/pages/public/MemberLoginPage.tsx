import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';

export default function MemberLoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginMember, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'member') {
      navigate('/member', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginMember(emailOrPhone.trim(), password);
      navigate('/member', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center mx-auto mb-3">
            <Flame size={24} className="text-black" />
          </div>
          <h1 className="text-xl font-bold">Member login</h1>
          <p className="text-sm text-zinc-500 mt-1">Access your profile and membership</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email or phone</label>
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={e => setEmailOrPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm"
              placeholder="you@email.com or +91..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-black font-semibold text-sm"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          New member?{' '}
          <Link to="/" className="text-orange-500 hover:text-orange-400 font-medium">
            Visit us at the gym to join
          </Link>
        </p>
      </div>
    </div>
  );
}
