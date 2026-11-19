import { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { imageUpload } from '../../lib/imageUpload';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function AadhaarPicker({ value, onChange, onBusyChange }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function select(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); onBusyChange?.(true); setError('');
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Choose a document smaller than 8 MB.');
      const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      const pdf = String.fromCharCode(...header) === '%PDF-';
      const result = pdf ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read this PDF.'));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(new Blob([file], { type: 'application/pdf' }));
      }) : await imageUpload(file);
      onChange(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not read this document.'); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  return (
    <div className="rounded-lg border border-zinc-700 p-3 space-y-2">
      <p className="text-xs text-zinc-400">Aadhaar document (optional)</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => camera.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-xs disabled:opacity-50"><Camera size={14} /> Take Aadhaar photo</button>
        <button type="button" disabled={busy} onClick={() => upload.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-xs disabled:opacity-50"><Upload size={14} /> Upload Aadhaar</button>
      </div>
      <p className="text-[11px] text-zinc-500">Image or PDF, up to 8 MB. On supported phones, Take photo opens the rear camera.</p>
      {busy && <p role="status" className="text-xs text-zinc-400">Preparing document…</p>}
      {value && <div className="flex items-center gap-3 text-xs">
        {value.startsWith('/api/public/media/') ? <a href={value} target="_blank" rel="noreferrer" className="text-orange-400 underline">View saved Aadhaar</a> : <span className="text-emerald-400">Document selected — save to upload</span>}
        <button type="button" disabled={busy} onClick={() => { onChange(''); setError(''); }} className="text-zinc-400">Remove document</button>
      </div>}
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <input aria-label="Take Aadhaar photo" ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={select} />
      <input aria-label="Upload Aadhaar document" ref={upload} type="file" accept="image/*,application/pdf,.pdf" className="hidden" onChange={select} />
    </div>
  );
}
