import { useEffect, useState } from 'react';
import { MessageCircle, Phone, UserPlus } from 'lucide-react';
import { adminApi } from '../../api/client';
import { Lead } from '../../types';
import { formatDate } from '../../lib/format';
import { openWhatsApp } from '../../lib/whatsapp';

const STATUSES = ['New', 'Contacted', 'Interested', 'Follow Up', 'Converted', 'Not Interested'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('all');
  const [notesEdit, setNotesEdit] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const load = () => adminApi.leads().then(setLeads);
  useEffect(() => { load(); }, []);

  const filtered = leads.filter(l => filter === 'all' || l.status === filter);

  const updateStatus = async (id: string, status: string) => {
    await adminApi.updateLead(id, { status });
    load();
  };

  const saveNotes = async (id: string) => {
    await adminApi.updateLead(id, { notes });
    setNotesEdit(null);
    load();
  };

  const convert = async (id: string) => {
    if (!confirm('Convert this lead to a member? Default password will be 123456')) return;
    await adminApi.convertLead(id);
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Leads & enquiries</h1>
        <p className="text-sm text-zinc-500">{leads.filter(l => l.status === 'New').length} new enquiries</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs ${filter === s ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(lead => (
          <div key={lead.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{lead.name}</p>
                <p className="text-xs text-zinc-500">{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</p>
                {lead.subject && <p className="text-xs text-orange-400 mt-1">Subject: {lead.subject}</p>}
                {lead.interestedPlan && <p className="text-xs text-zinc-500 mt-1">Plan: {lead.interestedPlan}</p>}
                {lead.message && <p className="text-sm text-zinc-400 mt-2">{lead.message}</p>}
                <p className="text-[10px] text-zinc-600 mt-1">{formatDate(lead.createdAt.slice(0, 10))} · {lead.source}</p>
                {lead.notes && notesEdit !== lead.id && <p className="text-xs text-zinc-500 mt-2 italic">Note: {lead.notes}</p>}
              </div>
              <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)} className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs self-start">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {notesEdit === lead.id ? (
              <div className="mt-3 flex gap-2">
                <input value={notes} onChange={e => setNotes(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" placeholder="Add notes..." />
                <button type="button" onClick={() => saveNotes(lead.id)} className="px-3 py-2 rounded-lg bg-orange-600 text-black text-xs font-semibold">Save</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs"><Phone size={14} /> Call</a>
                <button type="button" onClick={() => openWhatsApp(lead.whatsapp || lead.phone, `Hi ${lead.name}, thanks for your enquiry at Fit X Gym!`)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs"><MessageCircle size={14} /> WhatsApp</button>
                <button type="button" onClick={() => { setNotesEdit(lead.id); setNotes(lead.notes || ''); }} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs">Notes</button>
                {lead.status !== 'Converted' && (
                  <button type="button" onClick={() => convert(lead.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600/20 text-orange-400 text-xs"><UserPlus size={14} /> Convert to member</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
