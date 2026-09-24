import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';
import { dedupeGalleryByUrl } from '../../lib/galleryUtils';

interface GalleryItem {
  url: string;
  caption?: string;
}

interface Props {
  images: GalleryItem[];
}

function itemTransform(offset: number, animate: boolean): React.CSSProperties {
  const base: React.CSSProperties = animate
    ? { transition: 'transform 0.35s ease-out, opacity 0.35s ease-out' }
    : { transition: 'none' };

  if (offset === 0) {
    return {
      ...base,
      transform: 'perspective(1100px) rotateY(0deg) scale(1) translateZ(24px)',
      opacity: 1,
      zIndex: 10,
    };
  }
  const rotate = offset > 0 ? -18 : 18;
  const scale = Math.max(0.78, 1 - Math.abs(offset) * 0.08);
  const opacity = Math.max(0.45, 1 - Math.abs(offset) * 0.2);
  return {
    ...base,
    transform: `perspective(1100px) rotateY(${rotate}deg) scale(${scale}) translateZ(-${Math.abs(offset) * 16}px)`,
    opacity,
    zIndex: Math.max(1, 8 - Math.abs(offset)),
  };
}

function nearestIndex(el: HTMLDivElement, items: (HTMLDivElement | null)[]): number {
  const center = el.scrollLeft + el.clientWidth / 2;
  let closest = 0;
  let minDist = Infinity;
  items.forEach((item, i) => {
    if (!item) return;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const dist = Math.abs(center - itemCenter);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  });
  return closest;
}

export default function GalleryCarousel({ images }: Props) {
  const compact = useIsCompactPreview();
  const slides = useMemo(() => dedupeGalleryByUrl(images), [images]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const programmaticRef = useRef(false);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const applyIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const syncFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || programmaticRef.current) return;
    applyIndex(nearestIndex(el, itemRefs.current));
  }, [applyIndex]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, slides.length);
    applyIndex(0);
  }, [slides, applyIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (programmaticRef.current) return;
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
      scrollEndTimer.current = setTimeout(syncFromScroll, 120);
    };

    const onScrollEnd = () => {
      if (!programmaticRef.current) syncFromScroll();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    };
  }, [syncFromScroll, slides.length]);

  const goToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const el = scrollRef.current;
    const item = itemRefs.current[clamped];
    if (!el || !item) return;

    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    if (unlockTimer.current) clearTimeout(unlockTimer.current);

    programmaticRef.current = true;
    setAnimating(true);
    applyIndex(clamped);

    const left = item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });

    unlockTimer.current = setTimeout(() => {
      programmaticRef.current = false;
      setAnimating(false);
    }, 450);
  }, [applyIndex, slides.length]);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    goToIndex(activeIndex + dir);
  }, [activeIndex, goToIndex]);

  const handleSlideClick = useCallback((index: number) => {
    if (animating || index === activeIndex) return;
    goToIndex(index);
  }, [activeIndex, animating, goToIndex]);

  if (slides.length === 0) return null;

  const showNav = slides.length > 1;
  const canLeft = activeIndex > 0;
  const canRight = activeIndex < slides.length - 1;

  return (
    <div className="relative select-none">
      {showNav && (
        <>
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft || animating}
            aria-label="Previous photo"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-orange-500/50 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none ${compact ? 'hidden' : 'hidden sm:flex'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canRight || animating}
            aria-label="Next photo"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-orange-500/50 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none ${compact ? 'hidden' : 'hidden sm:flex'}`}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className={`flex overflow-x-auto overflow-y-visible snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          compact ? 'gap-4 px-2 py-6' : 'gap-5 md:gap-7 px-2 sm:px-14 py-8 md:py-10'
        } ${animating ? 'pointer-events-none' : ''}`}
        style={{ perspective: '1200px' }}
      >
        {slides.map((img, i) => (
          <div
            key={img.url}
            ref={el => { itemRefs.current[i] = el; }}
            className={`snap-center flex-shrink-0 cursor-pointer ${
              compact ? 'w-[min(280px,88%)]' : 'w-[78vw] sm:w-[300px] md:w-[360px]'
            }`}
            style={itemTransform(i - activeIndex, !animating)}
            onClick={() => handleSlideClick(i)}
          >
            <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-[0_28px_60px_-16px_rgba(0,0,0,0.85)] bg-zinc-900 group transition-all duration-500 ${i === activeIndex ? 'border-orange-500/40 ring-2 ring-orange-500/20' : 'border-zinc-700/50 ring-1 ring-white/10'}`}>
              <img
                src={img.url}
                alt={img.caption || `Gym photo ${i + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                draggable={false}
              />
              {img.caption && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-xs text-zinc-200">
                  {img.caption}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNav && (
        <>
          <div className={`flex justify-center gap-4 mt-1 ${compact ? '' : 'sm:hidden'}`}>
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              disabled={!canLeft || animating}
              aria-label="Previous photo"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              disabled={!canRight || animating}
              aria-label="Next photo"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToIndex(i)}
                disabled={animating}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 disabled:pointer-events-none ${i === activeIndex ? 'w-7 bg-orange-500' : 'w-1.5 bg-zinc-600 hover:bg-zinc-500'}`}
              />
            ))}
          </div>

          <p className="text-center text-[10px] text-zinc-600 mt-3">
            Swipe or use arrows · {activeIndex + 1} of {slides.length}
          </p>
        </>
      )}
    </div>
  );
}
