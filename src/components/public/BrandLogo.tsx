import DefaultGymLogo from './DefaultGymLogo';

type LogoSize = 'header' | 'footer' | 'hero';
type LogoVariant = 'default' | 'floating';

interface Props {
  src?: string;
  name: string;
  size?: LogoSize;
  /** @deprecated use variant="floating" on hero via HeroBrand */
  highlight?: boolean;
  variant?: LogoVariant;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  header: 'h-10 md:h-12 w-auto max-w-[150px] md:max-w-[190px]',
  footer: 'h-14 md:h-16 w-auto max-w-[200px] md:max-w-[240px]',
  hero: 'h-24 sm:h-28 md:h-32 lg:h-36 w-auto max-w-[320px] md:max-w-[420px]',
};

export default function BrandLogo({
  src,
  name,
  size = 'header',
  highlight = false,
  variant = 'default',
  className = '',
}: Props) {
  const floating = variant === 'floating' || highlight;

  if (src) {
    const img = (
      <img
        src={src}
        alt={name}
        className={`object-contain object-left ${sizeClasses[size]} ${floating ? 'logo-drop-shadow' : ''} ${className}`}
        referrerPolicy="no-referrer"
      />
    );

    if (size === 'header') {
      return (
        <span className="inline-flex items-center rounded-xl bg-zinc-900/60 px-2 py-1 ring-1 ring-white/5">
          {img}
        </span>
      );
    }

    return img;
  }

  return <DefaultGymLogo name={name} size={size} className={className} />;
}
