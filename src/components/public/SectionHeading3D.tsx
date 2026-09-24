import { motion } from 'motion/react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading3D({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: Props) {
  const compact = useIsCompactPreview();
  const alignClass = align === 'center' ? 'text-center' : 'text-left';
  const barAlign = align === 'center' ? 'mx-auto' : '';

  return (
    <motion.div
      initial={compact ? false : { opacity: 0, y: 24, rotateX: 10 }}
      whileInView={compact ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1000, transformOrigin: 'center top' }}
      className={`mb-10 ${alignClass} ${className}`}
    >
      {eyebrow && (
        <p className="text-orange-500 text-sm font-semibold mb-2 tracking-wide uppercase eyebrow-3d">{eyebrow}</p>
      )}
      <h2 className={`font-bold mb-3 ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
        <span className="heading-3d heading-3d-deep">{title}</span>
      </h2>
      <div
        className={`heading-bar-3d h-1 w-16 rounded-full mb-3 ${barAlign}`}
        aria-hidden
      />
      {subtitle && (
        <p className={`text-zinc-500 text-sm max-w-xl ${align === 'center' ? 'mx-auto' : ''}`}>{subtitle}</p>
      )}
    </motion.div>
  );
}
