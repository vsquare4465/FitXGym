import { motion } from 'motion/react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';
import BrandLogo from './BrandLogo';
import GymWordmark3D from './GymWordmark3D';

interface Props {
  logoUrl?: string;
  gymName: string;
}

/**
 * Hero branding strategy:
 * - Custom logo → large floating mark (recognition)
 * - No logo → animated 3D wordmark (impact)
 * Value proposition stays in the h1 below — we don't duplicate the gym name in both places.
 */
export default function HeroBrand({ logoUrl, gymName }: Props) {
  const compact = useIsCompactPreview();

  if (logoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-7 hero-brand-float"
        style={{ perspective: '1000px' }}
      >
        <div className="relative inline-block">
          <div
            aria-hidden
            className={`absolute rounded-full bg-orange-500/15 blur-2xl ${compact ? '-inset-4' : '-inset-6 md:-inset-8'}`}
          />
          <div className={`relative rounded-2xl bg-zinc-950/40 backdrop-blur-sm shadow-[0_24px_64px_-20px_rgba(0,0,0,0.85),0_0_40px_-12px_rgba(234,88,12,0.25)] ring-1 ring-white/10 ${compact ? 'px-4 py-3' : 'px-5 py-4 md:px-7 md:py-5'}`}>
            <BrandLogo src={logoUrl} name={gymName} size={compact ? 'header' : 'hero'} variant="floating" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mb-6">
      <GymWordmark3D name={gymName} size={compact ? 'md' : 'hero'} />
    </div>
  );
}
