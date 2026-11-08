import { NavLink } from 'react-router-dom';
import {
  Home,
  ListOrdered,
  FileText,
  Users,
  BarChart2,
  Star,
  Trophy,
  Sliders,
  UserCheck,
  Calendar,
  MessageSquare,
  Wallet,
  Crown,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/orders', label: 'Bet Tickets', icon: ListOrdered },
  { to: '/order-detail', label: 'Ticket Detail', icon: FileText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/referrals', label: 'Referrals', icon: Star },
  { to: '/fixtures', label: 'Fixtures & Odds', icon: Trophy },
  { to: '/trading', label: 'Trading Desk', icon: Sliders },
  { to: '/customer-detail', label: 'KYC & Players', icon: UserCheck },
  { to: '/audit-logs', label: 'Audit Logs', icon: Calendar },
  { to: '/live-sync', label: 'Live Feed Sync', icon: MessageSquare },
  { to: '/wallet', label: 'Wallet & Payouts', icon: Wallet },
];

export default function Sidebar({ onQuickAction }) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-100 shrink-0 min-h-screen select-none">
      {/* Brand Header (Sedap style) */}
      <div className="px-7 pt-7 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#00b074] flex items-center justify-center text-white shadow-sm">
            <Crown className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
              BetAura<span className="text-[#00b074]">.</span>
            </h1>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              Modern Admin Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#d9f3ea] text-[#00b074] font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#00b074] rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#00b074]' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Green Promotional CTA Card (Sedap style) */}
      <div className="p-5">
        <div className="relative overflow-hidden rounded-2xl bg-[#00b074] p-4 text-white shadow-md">
          <div className="relative z-10 max-w-[140px]">
            <p className="text-[11px] leading-relaxed text-white/90 font-medium">
              Organize live matches, odds & payouts via button below!
            </p>
            <button
              type="button"
              onClick={onQuickAction}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 shadow-sm hover:bg-gray-50 transition"
            >
              +Sync Fixtures
            </button>
          </div>
          <Crown className="w-16 h-16 text-white/15 fill-white/15 absolute -bottom-2 -right-2 pointer-events-none" />
        </div>

        <div className="mt-5 px-1 text-[11px] text-gray-400 space-y-0.5">
          <p className="font-semibold text-gray-500">BetAura Sportsbook Admin</p>
          <p>© 2026 All Rights Reserved</p>
          <p className="pt-1">
            Made with <span className="text-red-500">♥</span> for BetAura
          </p>
        </div>
      </div>
    </aside>
  );
}

