import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Receipt, QrCode, LogOut, Menu,
  Layers, UserPlus, Globe, MessageCircle, Shield, UserCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGymData } from '../context/GymDataProvider';
import { AdminModule, ROLE_LABELS } from '../lib/adminPermissions';
import BrandLogo from '../components/public/BrandLogo';

const navItems: { to: string; end?: boolean; icon: typeof LayoutDashboard; label: string; module: AdminModule }[] = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' },
  { to: '/admin/members', icon: Users, label: 'Members', module: 'members' },
  { to: '/admin/plans', icon: Layers, label: 'Plans', module: 'plans' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments', module: 'payments' },
  { to: '/admin/expenses', icon: Receipt, label: 'Expenses', module: 'expenses' },
  { to: '/admin/attendance', icon: QrCode, label: 'Attendance', module: 'attendance' },
  { to: '/admin/leads', icon: UserPlus, label: 'Leads', module: 'leads' },
  { to: '/admin/messages', icon: MessageCircle, label: 'Messages', module: 'messages' },
  { to: '/admin/website', icon: Globe, label: 'Website', module: 'website' },
  { to: '/admin/team', icon: Shield, label: 'Team', module: 'team' },
];

export default function AdminLayout() {
  const { user, logout, can } = useAuth();
  const { logoUrl, settings } = useGymData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isWebsiteEditor = location.pathname === '/admin/website';
  const gymName = settings.gymName || 'Fit X Gym';

  const visibleNav = navItems.filter(item => can(item.module, 'read'));

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const adminUser = user?.role === 'admin' ? user : null;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <Link to="/admin" className="flex flex-col gap-2 min-w-0">
          <BrandLogo src={logoUrl} name={gymName} size="admin" />
          <div>
            <p className="font-bold text-sm text-white leading-tight">{gymName}</p>
            <p className="text-[10px] text-zinc-500">
              Admin · {adminUser ? ROLE_LABELS[adminUser.adminRole] : 'Portal'}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-orange-600 text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <Link
          to="/admin/profile"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 mb-3 px-1 rounded-lg hover:bg-zinc-800/60 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-zinc-500 truncate">Profile & password</p>
          </div>
          <UserCircle size={16} className="text-zinc-600 ml-auto flex-shrink-0" />
        </Link>
        <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80">
          <LogOut size={16} /> Sign out
        </button>
        <Link to="/" className="block text-center text-[10px] text-zinc-600 hover:text-zinc-400 mt-3">View public website</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="hidden lg:flex w-60 border-r border-zinc-800 bg-zinc-900/50 flex-shrink-0 flex-col fixed inset-y-0 left-0">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">{sidebar}</aside>
        </div>
      )}

      <div
        className={`flex-1 lg:ml-60 flex flex-col min-w-0 ${
          isWebsiteEditor ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-screen'
        }`}
      >
        <header className="lg:hidden flex-shrink-0 z-40 h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur flex items-center px-4 gap-3">
          <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400"><Menu size={20} /></button>
          <BrandLogo src={logoUrl} name={gymName} size="admin" />
        </header>

        <div className={`flex-1 min-h-0 min-w-0 ${isWebsiteEditor ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
          <Outlet />
        </div>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur flex justify-around py-2 z-40">
          {visibleNav.slice(0, 4).map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-1 py-1 min-w-[56px] ${isActive ? 'text-orange-500' : 'text-zinc-500'}`}>
              <Icon size={20} /><span className="text-[8px] font-medium">{label}</span>
            </NavLink>
          ))}
          <button type="button" onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-0.5 px-1 py-1 text-zinc-500">
            <Menu size={20} /><span className="text-[8px] font-medium">More</span>
          </button>
        </nav>
        <div className="lg:hidden h-16" />
      </div>
    </div>
  );
}
