import { motion } from 'motion/react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';

interface Props {
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const sizeMap = {
  sm: 'text-lg md:text-xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl lg:text-5xl',
  hero: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
};

/** Stylized 3D gym name — best as hero brand when no custom logo is uploaded. */
export default function GymWordmark3D({ name = 'Fit X Gym', size = 'lg', className = '' }: Props) {
  const compact = useIsCompactPreview();
  const resolvedSize = compact && size === 'hero' ? 'md' : size;
  const parts = name.trim().split(/\s+/);
  const lead = parts.slice(0, -1).join(' ') || parts[0] || name;
  const accent = parts.length > 1 ? parts[parts.length - 1] : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`select-none hero-brand-float ${className}`}
      aria-label={name}
    >
      <div
        className={`font-black uppercase tracking-tight leading-[0.92] ${sizeMap[resolvedSize]}`}
        style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
      >
        <span className="wordmark-3d block text-white">{lead}</span>
        {accent && (
          <span className="wordmark-3d-accent block mt-0.5 text-orange-500">{accent}</span>
        )}
      </div>
    </motion.div>
  );
}
