import { useState } from 'react';
import { Bell, ChevronDown, Crown, Search, X, Link2, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ searchQuery, onSearchChange, onOpenDrawer }) {
  const { admin, setConnectModalOpen, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const connectedAcc = admin?.connectedBetauraAccount;

  function handleLogout() {
    logoutAdmin();
    navigate('/login');
  }

  function handleMobileSearch(e) {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    if (!q) return;
    setSearchOpen(false);
    if (/^(BA-|GHY|[A-Z0-9]{6}$)/i.test(q)) {
      navigate(`/order-detail?code=${encodeURIComponent(q)}`);
    } else {
      navigate(`/fixtures?search=${encodeURIComponent(q)}`);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100/80">
      <div className="flex items-center justify-between px-4 py-3">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer select-none min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0e9f47] flex items-center justify-center text-white shadow-xs shrink-0">
            <Crown className="w-5 h-5 fill-white" />
          </div>
          <div className="truncate">
            <h1 className="text-base font-extrabold text-gray-900 leading-tight tracking-tight truncate">
              BetAura
            </h1>
            <p className="text-[11px] text-gray-500 font-medium truncate">
              Admin Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setConnectModalOpen(true)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold transition shadow-xs ${
              connectedAcc
                ? 'bg-[#d9f3ea] text-[#00b074]'
                : 'bg-[#00b074] text-white'
            }`}
            title="Connect BetAura Account"
          >
            {connectedAcc ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="max-w-[75px] truncate">
                  {connectedAcc.username || connectedAcc.phone_number}
                </span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                <span>Connect</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="p-2 text-gray-600 hover:bg-gray-100 active:scale-95 rounded-full transition"
            aria-label="Search"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/audit-logs')}
            className="relative p-2 text-gray-600 hover:bg-gray-100 active:scale-95 rounded-full transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex items-center gap-1 p-1 rounded-full hover:bg-gray-100 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#0e9f47] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {admin?.initial || 'F'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-50 active:scale-95 rounded-full transition"
            aria-label="Log Out"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Mobile App Search Bar */}
      {searchOpen && (
        <form onSubmit={handleMobileSearch} className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search ticket ID, team, or league..."
              autoFocus
              className="w-full rounded-xl bg-gray-100 pl-3.5 pr-9 py-2 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0e9f47]/30 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </header>
  );
}
