import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

/** Framed photo with mouse-tilt depth and edge glow. */
export default function ImageFrame3D({ src, alt, className = '' }: Props) {
  const compact = useIsCompactPreview();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 220, damping: 26 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), spring);
  const lift = useSpring(useTransform(y, [-0.5, 0.5], [4, 14]), spring);
  const glareX = useTransform(x, [-0.5, 0.5], ['20%', '80%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['15%', '85%']);

  const onMove = (e: React.MouseEvent) => {
    if (compact) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: compact ? 0 : rotateX,
        rotateY: compact ? 0 : rotateY,
        z: compact ? 0 : lift,
        transformPerspective: 1100,
      }}
      className={`relative image-frame-3d ${className}`}
    >
      <div className="absolute -inset-3 rounded-[1.35rem] bg-gradient-to-br from-orange-500/20 via-transparent to-zinc-800/40 blur-xl opacity-70" aria-hidden />
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-depth-lg ring-1 ring-white/10">
        <img src={src} alt={alt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        {!compact && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute w-[55%] h-[55%] rounded-full blur-2xl bg-white/25 mix-blend-soft-light"
            style={{ left: glareX, top: glareY, x: '-50%', y: '-50%' }}
          />
        )}
      </div>
    </motion.div>
  );
}
