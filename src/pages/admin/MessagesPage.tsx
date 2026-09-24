import { useMemo, useState } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { useGymData } from '../../context/GymDataProvider';
import { Member } from '../../types';
import {
  BROADCAST_TEMPLATES,
  fillTemplate,
  openWhatsApp,
  openWhatsAppPicker,
  sendBulkWhatsApp,
} from '../../lib/whatsapp';

export default function MessagesPage() {
  const { members, settings } = useGymData();
  const gymName = settings.gymName || 'Fit X Gym';
  const list = members as Member[];

  const [templateId, setTemplateId] = useState(BROADCAST_TEMPLATES[0]?.id || 'holiday');
  const [customMessage, setCustomMessage] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customReason, setCustomReason] = useState('a holiday');
  const [customHours, setCustomHours] = useState('Mon–Sat 6 AM – 10 PM');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active'>('active');
  const [sending, setSending] = useState(false);

  const filteredMembers = useMemo(() => {
    return list.filter(m => filter === 'all' || m.status === 'Active');
  }, [list, filter]);

  const template = BROADCAST_TEMPLATES.find(t => t.id === templateId)!;

  const buildMessage = (memberName?: string) => fillTemplate(template.template, {
    memberName: memberName || 'Member',
    gymName,
    membershipName: 'membership',
    expiryDate: '',
    pendingAmount: '',
    customMessage,
    customDate: customDate || 'the announced date',
    customReason,
    customHours,
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filteredMembers.map(m => m.id)));
  const clearAll = () => setSelected(new Set());

  const selectedMembers = filteredMembers.filter(m => selected.has(m.id));

  const handleSendToSelected = async () => {
    if (selectedMembers.length === 0) return;
    setSending(true);
    try {
      await sendBulkWhatsApp(
        selectedMembers.map(m => ({ phone: m.whatsapp || m.phone, name: m.name })),
        name => buildMessage(name),
      );
    } finally {
      setSending(false);
    }
  };

  const preview = buildMessage('Rahul');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="text-emerald-400" size={22} />
          WhatsApp messages
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          No automated API — opens WhatsApp with a pre-filled message. On phone you can pick any contact.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90">
        <strong>Note:</strong> True WhatsApp broadcast to arbitrary contacts from a website is not possible without WhatsApp Business API.
        Use &quot;Open WhatsApp &amp; pick contacts&quot; on your phone, or send to selected gym members one chat at a time.
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
        <h2 className="text-sm font-semibold">Message template</h2>
        <select
          value={templateId}
          onChange={e => setTemplateId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
        >
          {BROADCAST_TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {templateId === 'holiday' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
            <input placeholder="Reason (e.g. Diwali)" value={customReason} onChange={e => setCustomReason(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
          </div>
        )}
        {templateId === 'timing_change' && (
          <input placeholder="New timings" value={customHours} onChange={e => setCustomHours(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm" />
        )}
        {(templateId === 'general_broadcast' || templateId === 'rain_off') && (
          <textarea
            rows={3}
            placeholder="Your announcement..."
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
          />
        )}

        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-400 italic">
          Preview: {preview}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWhatsAppPicker(preview)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
          >
            <Send size={16} />
            Open WhatsApp &amp; pick contacts
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(preview)}
            className="px-4 py-2.5 rounded-lg bg-zinc-800 text-sm"
          >
            Copy message
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users size={16} /> Send to gym members ({selected.size} selected)
          </h2>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => setFilter('active')} className={`px-2 py-1 rounded ${filter === 'active' ? 'bg-orange-600 text-black' : 'bg-zinc-800'}`}>Active</button>
            <button type="button" onClick={() => setFilter('all')} className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-zinc-800'}`}>All</button>
            <button type="button" onClick={selectAll} className="px-2 py-1 rounded bg-zinc-800">Select all</button>
            <button type="button" onClick={clearAll} className="px-2 py-1 rounded bg-zinc-800">Clear</button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredMembers.map(m => (
            <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer text-sm">
              <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
              <span className="flex-1">{m.name}</span>
              <span className="text-xs text-zinc-500">{m.phone}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={selectedMembers.length === 0 || sending}
          onClick={handleSendToSelected}
          className="w-full py-3 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-semibold text-sm disabled:opacity-40"
        >
          {sending ? 'Opening WhatsApp...' : `Send to ${selectedMembers.length} member(s) — opens one chat each`}
        </button>
      </section>
    </div>
  );
}
