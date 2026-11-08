import { Bell, ChevronDown, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { admin } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#0e9f47] flex items-center justify-center text-white shadow-sm">
          <Crown className="w-6 h-6 fill-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Profit Kings</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <div className="w-8 h-8 rounded-full bg-[#0e9f47] text-white font-semibold text-sm flex items-center justify-center">
            {admin?.initial || 'F'}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </header>
  );
}

