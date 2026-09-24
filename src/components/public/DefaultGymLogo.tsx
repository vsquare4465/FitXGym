type LogoSize = 'header' | 'footer' | 'hero';

interface Props {
  name?: string;
  size?: LogoSize;
  className?: string;
}

const heights: Record<LogoSize, number> = {
  header: 44,
  footer: 56,
  hero: 88,
};

/** Inline SVG brand mark — used when no custom logo is uploaded. */
export default function DefaultGymLogo({ name = 'Fit X Gym', size = 'header', className = '' }: Props) {
  const h = heights[size];

  return (
    <svg
      viewBox="0 0 220 56"
      height={h}
      className={`w-auto ${className}`}
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id="fx-flame" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="55%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
        <linearGradient id="fx-text" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
        <filter id="fx-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ea580c" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Icon mark */}
      <g filter="url(#fx-glow)">
        <rect x="2" y="6" width="44" height="44" rx="12" fill="#18181b" stroke="#ea580c" strokeOpacity="0.35" />
        <path
          d="M24 42c0-8 6-12 6-18 0-3-1.5-5-3-7 2 1.5 4 4 4 8 0 5-4 8-4 12 2-3 6-5 8-10-1 8-6 12-11 15z"
          fill="url(#fx-flame)"
        />
        <text x="24" y="30" textAnchor="middle" fill="#0a0a0a" fontSize="11" fontWeight="900" fontFamily="Inter, sans-serif">
          X
        </text>
      </g>

      {/* Wordmark */}
      <text x="58" y="26" fill="url(#fx-text)" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="1">
        FIT X
      </text>
      <text x="58" y="44" fill="#ea580c" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="4">
        GYM
      </text>
    </svg>
  );
}
