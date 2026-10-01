import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Check } from 'lucide-react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';
import { Plan } from '../../types';
import { stripFeatureTick } from '../../lib/parseFeatures';

interface Props {
  plan: Plan;
}

export default function PlanCard3D({ plan }: Props) {
  const compact = useIsCompactPreview();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 280, damping: 24 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), spring);

  const popular = !!plan.popular;
  const tilt = !compact && !popular;
  const features = (plan.features || []).map(stripFeatureTick).filter(Boolean).slice(0, 5);

  const onMove = (e: React.MouseEvent) => {
    if (!tilt) return;
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

  const body = (
    <>
      {popular && (
        <span className="self-start mb-3 px-2.5 py-1 bg-orange-600 text-black text-[10px] font-bold rounded-md tracking-wide leading-none">
          POPULAR
        </span>
      )}
      <h3 className="font-bold text-lg leading-tight">{plan.name}</h3>
      <p className="text-sm text-zinc-500 mb-1">{plan.duration}</p>
      <p className="text-2xl font-bold mb-3 text-white">
        ₹{plan.price.toLocaleString('en-IN')}
      </p>
      {plan.description && <p className="text-xs text-zinc-500 mb-3">{plan.description}</p>}
      <ul className="space-y-1.5 mb-5 flex-1">
        {features.map(f => (
          <li key={f} className="text-xs text-zinc-400 flex gap-2 items-start">
            <Check size={14} className="text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href="#contact"
        className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          popular ? 'bg-orange-600 text-black hover:bg-orange-500' : 'bg-zinc-800 text-white hover:bg-zinc-700'
        }`}
      >
        Enquire now
      </a>
    </>
  );

  const cardClass = `flex flex-col h-full rounded-2xl border p-5 ${
    popular
      ? 'border-orange-500 bg-zinc-900 shadow-[0_0_0_1px_rgba(234,88,12,0.35)]'
      : 'border-zinc-800 bg-zinc-900/40'
  }`;

  if (!tilt) {
    return <div className={cardClass}>{body}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cardClass}
    >
      {body}
    </motion.div>
  );
}
