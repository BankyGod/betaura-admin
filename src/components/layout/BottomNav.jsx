import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Users, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition ${
                isActive ? 'text-[#0e9f47]' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

