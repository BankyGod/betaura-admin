import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BarChart2,
  Users,
  Settings,
  LayoutGrid,
  X,
  ListOrdered,
  FileText,
  Trophy,
  Sliders,
  UserCheck,
  Calendar,
  RefreshCw,
  Wallet,
  Sparkles,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const primaryTabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/custom-games', label: 'Games', icon: Sparkles },
  { to: '/orders', label: 'Tickets', icon: ListOrdered },
  { to: '/customers', label: 'Players', icon: Users },
];

const appMenuActions = [
  { to: '/custom-games', label: 'Create & Mix', icon: Sparkles, color: 'bg-emerald-50 text-[#0e9f47]', perm: ['create_games', 'mix_booking'] },
  { to: '/orders', label: 'Bet Tickets', icon: ListOrdered, color: 'bg-emerald-50 text-[#0e9f47]', perm: 'override_tickets' },
  { to: '/order-detail', label: 'Ticket → WON', icon: FileText, color: 'bg-blue-50 text-[#2d9cdb]', perm: 'override_tickets' },
  { to: '/customers', label: 'Players & Tiers', icon: Users, color: 'bg-purple-50 text-purple-600', perm: 'manage_users' },
  { to: '/sub-admins', label: 'Sub-Admins', icon: ShieldCheck, color: 'bg-amber-50 text-amber-600', perm: 'manage_subadmins' },
  { to: '/fixtures', label: 'Live Fixtures', icon: Trophy, color: 'bg-amber-50 text-amber-600', perm: 'manage_trading' },
  { to: '/trading', label: 'Trading Desk', icon: Sliders, color: 'bg-red-50 text-[#ff5b5b]', perm: 'manage_trading' },
  { to: '/wallet', label: 'Wallet & Payout', icon: Wallet, color: 'bg-emerald-50 text-[#0e9f47]', perm: 'manage_wallet' },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, color: 'bg-indigo-50 text-indigo-600', perm: 'view_analytics' },
  { to: '/referrals', label: 'Referrals', icon: UserCheck, color: 'bg-teal-50 text-teal-600', perm: 'view_dashboard' },
  { to: '/live-sync', label: 'Feed Sync', icon: RefreshCw, color: 'bg-indigo-50 text-indigo-600', perm: 'manage_trading' },
  { to: '/settings', label: 'Settings', icon: Settings, color: 'bg-gray-100 text-gray-700' },
];

export default function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { admin, hasPermission, logoutAdmin } = useAuth();

  function handleLogout() {
    setSheetOpen(false);
    logoutAdmin();
    navigate('/login');
  }

  const visibleActions = appMenuActions.filter((item) => {
    if (!item.perm) return true;
    if (Array.isArray(item.perm)) {
      return item.perm.some((p) => hasPermission(p));
    }
    return hasPermission(item.perm);
  });

  return (
    <>
      {/* Mobile App Slide-Up Action Sheet for All Admin Modules */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center lg:hidden"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Admin Console</h3>
                <p className="text-xs text-gray-400">Quick access to all BetAura tools</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {visibleActions.map(({ to, label, icon: Icon, color }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    navigate(to);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100 active:scale-95 transition text-center"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 py-3 text-xs font-extrabold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out ({admin?.name || 'Admin'})</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom App Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 select-none">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center pt-1.5 pb-2 px-2">
          {primaryTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSheetOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-[11px] font-semibold transition active:scale-95 ${
                  isActive ? 'text-[#0e9f47]' : 'text-gray-400 hover:text-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* 5th Tab: More / Tools Drawer */}
          <button
            type="button"
            onClick={() => setSheetOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-[11px] font-semibold transition active:scale-95 ${
              sheetOpen ? 'text-[#0e9f47]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Tools</span>
          </button>
        </div>

        {/* Native iOS-style bottom home indicator pill */}
        <div className=" pb-1.5 flex justify-center">
          <div className="w-28 h-1 rounded-full bg-gray-900/80" />
        </div>
      </nav>
    </>
  );
}
