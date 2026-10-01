import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { publicApi } from '../api/client';
import BrandLogo from '../components/public/BrandLogo';
import SocialLinks from '../components/public/SocialLinks';
import { jumpToId, jumpToTop } from '../lib/scroll';

type NavItem = {
  href: string;
  label: string;
  hash?: string;
  isRoute?: boolean;
};

export default function PublicLayout() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    publicApi.settings()
      .then(s => { setSettings(s); setApiError(false); })
      .catch(() => setApiError(true));
  }, []);

  const location = useLocation();
  const gymName = settings.gymName || 'Fit X Gym';
  const whatsapp = settings.whatsapp || '919760260553';
  const showPt = settings.ptEnabled !== 'false';
  const onHome = location.pathname === '/';
  const currentHash = onHome ? location.hash : '';
  const onLegal = location.pathname.startsWith('/legal');

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (onLegal) return undefined;
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      jumpToId(id);
      const timers = [80, 250, 600].map(ms => window.setTimeout(() => jumpToId(id), ms));
      return () => timers.forEach(t => window.clearTimeout(t));
    }
    jumpToTop();
    return undefined;
  }, [location.pathname, location.hash, onLegal]);

  const nav: NavItem[] = [
    { href: '/#about', hash: '#about', label: 'About' },
    { href: '/owner', label: 'Coach', isRoute: true },
    { href: '/#plans', hash: '#plans', label: 'Plans' },
    ...(showPt ? [{ href: '/#training', hash: '#training', label: 'Training' }] : []),
    { href: '/#gallery', hash: '#gallery', label: 'Gallery' },
    { href: '/#contact', hash: '#contact', label: 'Contact' },
  ];

  const linkClass = (n: NavItem) => {
    const active = n.isRoute
      ? location.pathname === n.href
      : onHome && !!n.hash && n.hash === currentHash;
    return `transition-colors ${active ? 'text-white' : 'text-zinc-400 hover:text-white'}`;
  };

  const renderNavLink = (n: NavItem, extra = '') => (
    n.isRoute
      ? <Link key={n.href} to={n.href} className={`${extra} ${linkClass(n)}`}>{n.label}</Link>
      : (
        <Link
          key={n.href}
          to={{ pathname: '/', hash: n.hash }}
          className={`${extra} ${linkClass(n)}`}
        >
          {n.label}
        </Link>
      )
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {apiError && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 text-center text-xs text-red-300">
          Cannot reach the API — website content may be missing. Run <code className="text-red-200">npm run dev:clean</code> and open <strong>http://localhost:3000</strong>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 md:h-[4.5rem] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 min-w-0 shrink-0">
            <BrandLogo src={settings.logoUrl} name={gymName} size="header" />
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            {nav.map(n => renderNavLink(n))}
          </nav>

          <button type="button" className="md:hidden p-2 text-zinc-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-zinc-800 px-4 py-3 space-y-2 bg-zinc-950">
            {nav.map(n => renderNavLink(n, 'block py-2 text-sm'))}
          </div>
        )}
      </header>

      <Outlet />

      <footer className="border-t border-white/5 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            <div>
              <BrandLogo src={settings.logoUrl} name={gymName} size="footer" className="mb-3" />
              <p className="text-zinc-500 text-xs leading-relaxed mb-4">{settings.address}</p>
              <SocialLinks whatsapp={whatsapp} email={settings.email} instagram={settings.instagram} facebook={settings.facebook} size="sm" />
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Quick links</p>
              <ul className="space-y-2 text-xs text-zinc-500">
                {nav.map(n => (
                  <li key={n.href}>{renderNavLink(n)}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Legal</p>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li><Link to="/legal/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/legal/terms" className="hover:text-white">Terms &amp; Conditions</Link></li>
                <li><Link to="/legal/refund" className="hover:text-white">Refund Policy</Link></li>
                <li>
                  <Link to={{ pathname: '/', hash: '#contact' }} className="hover:text-white">Contact Us</Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Visit us</p>
              <p className="text-xs text-zinc-500 mb-1">{settings.phone}</p>
              <p className="text-xs text-zinc-500">Mon–Sat: {settings.weekdayHours}</p>
              <p className="text-xs text-zinc-500">Sun: {settings.weekendHours}</p>
            </div>
          </div>

          <p className="mt-10 pt-6 border-t border-zinc-800/50 text-[10px] text-zinc-600 text-center">
            © {new Date().getFullYear()} {gymName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
