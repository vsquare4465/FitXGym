import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { ROLE_LABELS } from '../../lib/adminPermissions';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const admin = user?.role === 'admin' ? user : null;

  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [saving, setSaving] = useState(false);

  if (!admin) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      await authApi.updateProfile({ name, email });
      await refreshUser();
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password changed successfully.');
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold mb-1">My profile</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {ROLE_LABELS[admin.adminRole]} {admin.jobTitle ? `· ${admin.jobTitle}` : ''}
      </p>

      <form onSubmit={handleProfileSave} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4 mb-6">
        <h2 className="font-semibold text-sm">Account details</h2>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Full name</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Login email</label>
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
          />
        </div>
        {profileMsg && (
          <p className={`text-xs ${profileMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{profileMsg}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold disabled:opacity-50"
        >
          Save profile
        </button>
      </form>

      <form onSubmit={handlePasswordSave} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <h2 className="font-semibold text-sm">Change password</h2>
        <input
          required
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
        />
        <input
          required
          type="password"
          placeholder="New password (min 6 characters)"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
        />
        {passwordMsg && (
          <p className={`text-xs ${passwordMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{passwordMsg}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium disabled:opacity-50"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
