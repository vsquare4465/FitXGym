import React, { useState } from 'react';
import { Member } from '../types';
import { Lock, Mail, ShieldAlert, KeyRound, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPortalProps {
  members: Member[];
  onLoginSuccess: (user: { role: 'admin' | 'member'; memberId?: string; name: string; email: string }) => void;
  onCancel: () => void;
}

export default function LoginPortal({ members, onLoginSuccess, onCancel }: LoginPortalProps) {
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (activeTab === 'admin') {
        const normalizedUser = adminUsername.trim().toLowerCase();
        if ((normalizedUser === 'admin' || normalizedUser === 'admin@fitx.com') && password === 'admin') {
          setSuccess('Access Granted. Redirecting to Management Hub...');
          setTimeout(() => {
            onLoginSuccess({
              role: 'admin',
              name: 'Deepak Solanki (Admin)',
              email: 'admin@fitx.com'
            });
            setLoading(false);
          }, 1000);
        } else {
          setError('Invalid administrator credentials. Hint: use user "admin" and password "admin"');
          setLoading(false);
        }
      } else {
        // Member login
        const cleanedInput = emailOrPhone.trim().toLowerCase();
        const foundMember = members.find(m => 
          m.email.toLowerCase() === cleanedInput || 
          m.phone.replace(/\s+/g, '') === cleanedInput.replace(/\s+/g, '') ||
          m.phone === cleanedInput
        );

        if (foundMember) {
          // If member has no password, let them log in with '123456' as fallback
          const targetPassword = foundMember.password || '123456';
          if (password === targetPassword) {
            setSuccess(`Welcome back, ${foundMember.name}! Loading your portal...`);
            setTimeout(() => {
              onLoginSuccess({
                role: 'member',
                memberId: foundMember.id,
                name: foundMember.name,
                email: foundMember.email
              });
              setLoading(false);
            }, 1000);
          } else {
            setError('Incorrect password. Please try again (Pre-seeded accounts use "123456")');
            setLoading(false);
          }
        } else {
          setError('No active member found with that email or phone number. Register first if you are new!');
          setLoading(false);
        }
      }
    }, 1000);
  };

  return (
    <div className="bg-zinc-950 text-white p-4 md:p-8 min-h-[85vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-600/10 rounded-full blur-xl" />

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-black font-black mx-auto shadow-lg shadow-orange-600/20">
            <Lock size={20} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-2">GateKeeper Auth</h2>
          <p className="text-zinc-400 text-xs font-light">Provide credentials to enter your private gym workspace.</p>
        </div>

        {/* Auth Role Select tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => { setActiveTab('member'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'member' ? 'bg-orange-600 text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Member Portal
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'admin' ? 'bg-orange-600 text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Staff Admin
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 flex gap-2.5 items-start">
            <ShieldAlert size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex gap-2.5 items-start">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-400 font-medium leading-relaxed">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'member' ? (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">MEMBER EMAIL OR PHONE</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  required
                  placeholder="e.g. kabir.m@gmail.com or +91 98765 43210"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">STAFF USERNAME / EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Enter 'admin'"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">PASSWORD</label>
              {activeTab === 'member' && (
                <span className="text-[9px] text-zinc-600 font-medium">Pre-seeded accounts: 123456</span>
              )}
              {activeTab === 'admin' && (
                <span className="text-[9px] text-zinc-600 font-medium">Default: admin</span>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded text-xs text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-lg shadow-orange-600/10"
          >
            {loading ? (
              <span>VERIFYING SYSTEM KEYS...</span>
            ) : (
              <>
                <span>SECURE LOGIN ACCESS</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 bg-transparent hover:bg-zinc-850 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded transition-all"
          >
            Cancel and Return
          </button>
        </form>
      </motion.div>
    </div>
  );
}
