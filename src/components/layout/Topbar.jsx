import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, Gift, Settings, Link2, CheckCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/endpoints';

export default function Topbar({ searchQuery, onSearchChange }) {
  const { admin, isSuperAdmin, setConnectModalOpen, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const connectedAcc = admin?.connectedBetauraAccount;
  const [supportUnread, setSupportUnread] = useState(0);

  // Live unread customer-care count (Super Admin only)
  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    let active = true;
    const load = async () => {
      try {
        const res = await adminApi.getSupportThreads();
        if (active && Array.isArray(res.data)) {
          setSupportUnread(
            res.data.reduce((sum, t) => sum + Number(t.unread_count || 0), 0)
          );
        }
      } catch {
        // ignore transient errors
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [isSuperAdmin]);

  function handleLogout() {
    logoutAdmin();
    navigate('/login');
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    if (!q) return;
    if (/^(BA-|GHY|[A-Z0-9]{6}$)/i.test(q)) {
      navigate(`/order-detail?code=${encodeURIComponent(q)}`);
    } else {
      navigate(`/fixtures?search=${encodeURIComponent(q)}`);
    }
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3.5 bg-[#f3f2f7]">
      {/* Search input (Sedap style) - flex-1 min-w-0 prevents wrapping */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 max-w-md lg:max-w-xl">
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search ticket ID (BA-...), team, or league..."
          className="w-full rounded-xl bg-white pl-4 pr-9 py-2.5 text-xs sm:text-sm text-gray-700 placeholder-gray-400 border border-transparent focus:border-[#00b074] focus:outline-none shadow-xs"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00b074]"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Right Side Action Badges + Profile (shrink-0 keeps it on the same row) */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setConnectModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition shadow-xs ${
            connectedAcc
              ? 'bg-[#d9f3ea] text-[#00b074] hover:bg-[#c5ebd9]'
              : 'bg-[#00b074] text-white hover:bg-[#0a873c]'
          }`}
        >
          {connectedAcc ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                BetAura: {connectedAcc.username || connectedAcc.phone_number}
              </span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              <span>Connect BetAura Account</span>
            </>
          )}
        </button>

        {/* 4 Sedap Action Badges wired to admin sections */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/audit-logs')}
            title="Audit Logs & Alerts"
            className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#2d9cdb]/15 text-[#2d9cdb] flex items-center justify-center hover:bg-[#2d9cdb]/25 transition"
          >
            <Bell className="w-4 h-4" />
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => navigate('/customer-care')}
              title="Customer Care Inbox (Super Admin Only)"
              className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#2d9cdb]/15 text-[#2d9cdb] flex items-center justify-center hover:bg-[#2d9cdb]/25 transition"
            >
              <MessageSquare className="w-4 h-4" />
              {supportUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff5b5b] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[#f3f2f7]">
                  {supportUnread > 99 ? '99+' : supportUnread}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/referrals')}
            title="Referral Bonuses"
            className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#5e6c93]/15 text-[#5e6c93] flex items-center justify-center hover:bg-[#5e6c93]/25 transition"
          >
            <Gift className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            title="Admin Settings"
            className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#ff5b5b]/15 text-[#ff5b5b] flex items-center justify-center hover:bg-[#ff5b5b]/25 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden md:block mx-0.5" />

        {/* Greeting & Avatar - always on the right, never wraps */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition"
        >
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            Hello, <strong className="font-bold text-gray-900">{admin?.name || 'Admin'}</strong>
          </span>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#00b074] text-white font-bold text-sm flex items-center justify-center ring-2 ring-white shadow-xs shrink-0">
            {admin?.initial || 'F'}
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title="Log Out"
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-xs font-extrabold transition shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}
