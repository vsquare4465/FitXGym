import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Monitor, Smartphone } from 'lucide-react';
import HomePage from '../../pages/public/HomePage';
import OwnerPage from '../../pages/public/OwnerPage';
import { GalleryImage, Plan, Review } from '../../types';
import { PreviewViewportProvider } from '../../context/PreviewViewportContext';
import { PreviewFooter, PreviewHeader } from './PreviewChrome';

const SECTIONS = [
  { id: 'top', label: 'Top', page: 'home' as const, hash: '' },
  { id: 'about', label: 'About', page: 'home' as const, hash: '#about' },
  { id: 'plans', label: 'Plans', page: 'home' as const, hash: '#plans' },
  { id: 'training', label: 'Training', page: 'home' as const, hash: '#training' },
  { id: 'gallery', label: 'Gallery', page: 'home' as const, hash: '#gallery' },
  { id: 'contact', label: 'Contact', page: 'home' as const, hash: '#contact' },
  { id: 'owner', label: 'Coach', page: 'owner' as const, hash: '' },
];

interface Props {
  settings: Record<string, string>;
  gallery: GalleryImage[];
  plans: Plan[];
  testimonials: Review[];
  hasUnpublishedChanges?: boolean;
}

export default function WebsitePreview({
  settings,
  gallery,
  plans,
  testimonials,
  hasUnpublishedChanges,
}: Props) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const scrollRef = useRef<HTMLDivElement>(null);

  const section = SECTIONS[sectionIdx];
  const activeGallery = gallery.filter(g => g.active !== false);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    if (section.page !== 'home' || !section.hash) {
      root.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = root.querySelector(section.hash);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [sectionIdx, section.hash, section.page]);

  const openLiveSite = () => {
    window.open('/', '_blank', 'noopener,noreferrer');
  };

  const frameWidth = viewMode === 'mobile' ? 'w-[min(100%,375px)]' : 'w-full max-w-3xl';

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-3 py-2.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-300">Live preview</p>
            <p className="text-[10px] text-emerald-400/90 truncate">Updates as you type · draft only</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Mobile view"
            >
              <Smartphone size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Desktop view"
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              onClick={openLiveSite}
              className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-white"
              title="Open published site"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionIdx(i)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                sectionIdx === i ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {hasUnpublishedChanges && (
          <p className="text-[10px] text-amber-400/90">Unpublished — hit Publish to update the live site.</p>
        )}
      </div>

      {/* Device canvas — centered, single scroll inside frame only */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-[#0a0a0b] flex justify-center p-3 sm:p-4">
        <div
          className={`${frameWidth} min-h-0 h-full max-h-full flex flex-col rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden`}
        >
          {viewMode === 'mobile' && (
            <div className="flex-shrink-0 h-6 bg-zinc-900 border-b border-zinc-800 flex items-center justify-center">
              <div className="w-16 h-1 rounded-full bg-zinc-700" />
            </div>
          )}

          <div
            ref={scrollRef}
            className={`preview-site-content flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y ${
              viewMode === 'mobile' ? 'preview-mobile' : 'preview-desktop'
            }`}
          >
            <PreviewViewportProvider value={viewMode}>
              <PreviewHeader settings={settings} compact={viewMode === 'mobile'} />
              {section.page === 'home' ? (
                <HomePage
                  previewMode
                  previewSettings={settings}
                  previewGallery={activeGallery}
                  previewPlans={plans}
                  previewTestimonials={testimonials}
                />
              ) : (
                <OwnerPage previewMode previewSettings={settings} />
              )}
              <PreviewFooter settings={settings} />
            </PreviewViewportProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
