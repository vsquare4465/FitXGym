import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Check } from 'lucide-react';
import { useIsCompactPreview } from '../../context/PreviewViewportContext';
import { Plan } from '../../types';

interface Props {
  plan: Plan;
}

export default function PlanCard3D({ plan }: Props) {
  const compact = useIsCompactPreview();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 280, damping: 24 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), spring);
  const lift = useSpring(useTransform(y, [-0.5, 0.5], [0, 16]), spring);
  const glareX = useTransform(x, [-0.5, 0.5], ['15%', '85%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['10%', '90%']);

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

  const popular = plan.popular;

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
      className={`relative rounded-2xl border p-5 flex flex-col h-full card-depth overflow-hidden ${
        popular
          ? 'border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-zinc-900/60'
          : 'border-zinc-800 bg-zinc-900/40'
      }`}
    >
      {!compact && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute w-[65%] h-[65%] rounded-full blur-3xl bg-orange-400/10 mix-blend-soft-light"
          style={{ left: glareX, top: glareY, x: '-50%', y: '-50%' }}
        />
      )}
      {popular && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-orange-600 text-black text-[10px] font-bold rounded badge-3d z-10">
          POPULAR
        </span>
      )}
      <div className="relative z-[1] flex flex-col h-full">
        <h3 className="font-bold text-lg">{plan.name}</h3>
        <p className="text-sm text-zinc-500 mb-1">{plan.duration}</p>
        <p className="text-price-3d text-2xl font-bold mb-3 text-white">
          ₹{plan.price.toLocaleString('en-IN')}
        </p>
        {plan.description && <p className="text-xs text-zinc-500 mb-3">{plan.description}</p>}
        <ul className="space-y-1.5 mb-5 flex-1">
          {plan.features.slice(0, 5).map(f => (
            <li key={f} className="text-xs text-zinc-400 flex gap-2">
              <span className="icon-badge-3d flex-shrink-0 mt-0.5">
                <Check size={12} className="text-orange-500" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className={`btn-3d block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            popular ? 'bg-orange-600 text-black hover:bg-orange-500' : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          Enquire now
        </a>
      </div>
    </motion.div>
  );
}
