import BrandLogo from '../public/BrandLogo';
import SocialLinks from '../public/SocialLinks';

interface Props {
  settings: Record<string, string>;
  compact?: boolean;
}

export function PreviewHeader({ settings, compact }: Props) {
  const gymName = settings.gymName || 'Fit X Gym';
  const showPt = settings.ptEnabled !== 'false';

  const links = [
    { href: '#about', label: 'About' },
    { href: '#plans', label: 'Plans' },
    ...(showPt ? [{ href: '#training', label: 'Training' }] : []),
    { href: '#gallery', label: 'Gallery' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/95 backdrop-blur-md">
      <div className={`w-full mx-auto px-3 flex items-center justify-between gap-2 ${compact ? 'h-12' : 'h-14'}`}>
        <div className="min-w-0 shrink">
          <BrandLogo src={settings.logoUrl} name={gymName} size="header" />
        </div>
        {!compact && (
          <nav className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-400">
            {links.map(l => (
              <a key={l.href} href={l.href} className="hover:text-white">{l.label}</a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export function PreviewFooter({ settings }: Props) {
  const gymName = settings.gymName || 'Fit X Gym';
  const whatsapp = settings.whatsapp || '919760260553';

  return (
    <footer className="border-t border-white/5 bg-zinc-900/50 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <BrandLogo src={settings.logoUrl} name={gymName} size="footer" className="mb-2" />
        <p className="text-zinc-500 text-[10px] mb-3">{settings.address}</p>
        <SocialLinks whatsapp={whatsapp} email={settings.email} instagram={settings.instagram} facebook={settings.facebook} size="sm" />
        <p className="mt-6 text-[9px] text-zinc-600 text-center">© {new Date().getFullYear()} {gymName}</p>
      </div>
    </footer>
  );
}
