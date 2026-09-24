import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Scroll-triggered 3D fade-up for section blocks. */
export default function ScrollReveal3D({ children, className = '', delay = 0 }: Props) {
  const compact = useIsCompactPreview();

  if (compact) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, rotateX: 12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1200, transformOrigin: 'center top' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
