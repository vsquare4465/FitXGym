import { useEffect, useState } from 'react';
import { Plus, Trash2, Shield } from 'lucide-react';
import { teamApi } from '../../api/client';
import { AdminTeamUser } from '../../types';
import {
  ADMIN_MODULES,
  MODULE_LABELS,
  ROLE_LABELS,
  AdminModule,
  AdminPermissions,
  PermissionLevel,
  resolvePermissions,
} from '../../lib/adminPermissions';
import { useAuth } from '../../context/AuthContext';

const STAFF_ROLES = ['RECEPTION', 'TRAINER'] as const;

export default function TeamPage() {
  const { user, can } = useAuth();
  const [team, setTeam] = useState<AdminTeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AdminTeamUser | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTION' as 'RECEPTION' | 'TRAINER',
    jobTitle: '',
  });
  const [permOverrides, setPermOverrides] = useState<Partial<AdminPermissions>>({});

  const load = () => {
    setLoading(true);
    teamApi.list()
      .then(setTeam)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (!can('team', 'read')) {
    return (
      <div className="p-6 text-center text-zinc-500 text-sm">
        You don&apos;t have access to team management.
      </div>
    );
  }

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'RECEPTION', jobTitle: '' });
    setPermOverrides({});
    setEditing(null);
    setShowAdd(true);
  };

  const openEdit = (u: AdminTeamUser) => {
    if (u.role === 'OWNER') return;
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role as 'RECEPTION' | 'TRAINER',
      jobTitle: u.jobTitle || '',
    });
    setPermOverrides(u.permissions);
    setEditing(u);
    setShowAdd(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await teamApi.update(editing.id, {
        name: form.name,
        email: form.email,
        role: form.role,
        jobTitle: form.jobTitle,
        ...(form.password ? { password: form.password } : {}),
        permissions: permOverrides,
      });
    } else {
      await teamApi.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        jobTitle: form.jobTitle || undefined,
        permissions: permOverrides,
      });
    }
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this staff login? They will no longer access the admin portal.')) return;
    await teamApi.remove(id);
    load();
  };

  const setPerm = (mod: AdminModule, level: PermissionLevel) => {
    setPermOverrides(prev => ({ ...prev, [mod]: level }));
  };

  const previewPerms = resolvePermissions(form.role, permOverrides);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} className="text-orange-500" /> Team & access
          </h1>
          <p className="text-sm text-zinc-500">Create staff logins and control what each person can see or edit.</p>
        </div>
        {can('team', 'write') && (
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold">
            <Plus size={16} /> Add staff login
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading team...</p>
      ) : (
        <div className="space-y-3">
          {team.map(u => (
            <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
                <p className="text-xs text-orange-400 mt-1">
                  {ROLE_LABELS[u.role]} {u.jobTitle ? `· ${u.jobTitle}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {u.role !== 'OWNER' && can('team', 'write') && (
                  <>
                    <button type="button" onClick={() => openEdit(u)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">Edit access</button>
                    {user?.role === 'admin' && u.email !== user.email && (
                      <button type="button" onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
                {u.role === 'OWNER' && (
                  <span className="text-xs text-zinc-500 px-2 py-1">Full access</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAdd(false)} />
          <form onSubmit={handleSave} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-semibold">{editing ? 'Edit staff access' : 'New staff login'}</h3>

            <input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input required type="email" placeholder="Email (login)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input required={!editing} type="password" placeholder={editing ? 'New password (leave blank to keep)' : 'Password (min 6 chars)'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />

            <select value={form.role} onChange={e => { setForm({ ...form, role: e.target.value as 'RECEPTION' | 'TRAINER' }); setPermOverrides({}); }} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm">
              {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <input placeholder="Job title (e.g. Front desk, Coach)" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />

            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase">Feature access</p>
              <p className="text-[10px] text-zinc-600 mb-3">Defaults apply for the role — override any module below.</p>
              <div className="space-y-2">
                {ADMIN_MODULES.filter(m => m !== 'team').map(mod => (
                  <div key={mod} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-400">{MODULE_LABELS[mod]}</span>
                    <select
                      value={previewPerms[mod]}
                      onChange={e => setPerm(mod, e.target.value as PermissionLevel)}
                      className="px-2 py-1 rounded bg-zinc-950 border border-zinc-700 text-xs"
                    >
                      <option value="none">Hidden</option>
                      <option value="read">Read only</option>
                      <option value="write">Full access</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-600 text-black font-semibold text-sm">
              {editing ? 'Save changes' : 'Create login'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
