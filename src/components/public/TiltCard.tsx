import { useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';

interface Props {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

/** Mouse-tilt card with depth shadow and moving glare. */
export default function TiltCard({ children, className = '', glow = false }: Props) {
  const compact = useIsCompactPreview();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 260, damping: 22 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), spring);
  const lift = useSpring(useTransform(x, [-0.5, 0.5], [0, 10]), spring);
  const glareX = useTransform(x, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['5%', '95%']);

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
        transformPerspective: 900,
      }}
      className={`relative overflow-hidden card-depth ${className} ${
        glow
          ? 'hover:shadow-[0_28px_60px_-18px_rgba(234,88,12,0.22)]'
          : 'hover:shadow-[0_24px_52px_-20px_rgba(0,0,0,0.8)]'
      } transition-shadow duration-300`}
    >
      {!compact && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute w-[70%] h-[70%] rounded-full blur-3xl bg-white/10 mix-blend-overlay z-10"
          style={{ left: glareX, top: glareY, x: '-50%', y: '-50%' }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
