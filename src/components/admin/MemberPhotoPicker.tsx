import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { fileToMemberPhoto } from '../../lib/memberPhoto';

export function MemberAvatar({ photo, name, size = 'md' }: { photo?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'sm' ? 'w-9 h-9 text-[10px]' : 'w-10 h-10 text-xs';
  if (photo) return <img src={photo} alt="" className={`${box} rounded-full object-cover shrink-0`} />;
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
  return (
    <div className={`${box} rounded-full bg-zinc-800 text-zinc-300 font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

interface Props {
  value: string;
  onChange: (photo: string) => void;
  onError?: (message: string) => void;
}

export default function MemberPhotoPicker({ value, onChange, onError }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      onChange(await fileToMemberPhoto(file));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not use that photo.');
    }
  };

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="w-16 h-16 rounded-full object-cover border border-zinc-700 shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
          <Camera size={22} />
        </div>
      )}
      <div className="flex flex-col gap-1.5 min-w-0">
        <p className="text-xs text-zinc-400">Member photo</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium"
          >
            <Camera size={14} /> Take photo
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium"
          >
            <ImagePlus size={14} /> Choose photo
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="px-2.5 py-1.5 text-xs text-zinc-500">
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-600">On a phone, Take photo opens the camera.</p>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
