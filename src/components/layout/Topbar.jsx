import { Search, Bell, MessageSquare, Gift, Settings, Smartphone, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ searchQuery, onSearchChange, viewMode, onToggleViewMode }) {
  const { admin } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#f3f2f7]">
      {/* Search input (Sedap style) */}
      <div className="relative flex-1 min-w-[220px] max-w-xl">
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search here"
          className="w-full rounded-xl bg-white pl-4 pr-10 py-2.5 text-sm text-gray-700 placeholder-gray-400 border border-transparent focus:border-[#00b074] focus:outline-none shadow-xs"
        />
        <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Action Badges + Profile */}
      <div className="flex items-center gap-3">
        {/* View mode toggle: Desktop Sedap vs Mobile Profit Kings preview */}
        {onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition border border-gray-100"
            title="Switch between Sedap Desktop & Profit Kings Mobile View"
          >
            {viewMode === 'mobile' ? (
              <>
                <Monitor className="w-4 h-4 text-[#00b074]" />
                <span>Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-[#00b074]" />
                <span>Profit Kings View</span>
              </>
            )}
          </button>
        )}

        {/* 4 Sedap Notification Badges */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            className="relative w-10 h-10 rounded-xl bg-[#2d9cdb]/15 text-[#2d9cdb] flex items-center justify-center hover:bg-[#2d9cdb]/25 transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2d9cdb] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#f3f2f7]">
              21
            </span>
          </button>

          <button
            type="button"
            className="relative w-10 h-10 rounded-xl bg-[#2d9cdb]/15 text-[#2d9cdb] flex items-center justify-center hover:bg-[#2d9cdb]/25 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2d9cdb] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#f3f2f7]">
              53
            </span>
          </button>

          <button
            type="button"
            className="relative w-10 h-10 rounded-xl bg-[#5e6c93]/15 text-[#5e6c93] flex items-center justify-center hover:bg-[#5e6c93]/25 transition"
          >
            <Gift className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5e6c93] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#f3f2f7]">
              15
            </span>
          </button>

          <button
            type="button"
            className="relative w-10 h-10 rounded-xl bg-[#ff5b5b]/15 text-[#ff5b5b] flex items-center justify-center hover:bg-[#ff5b5b]/25 transition"
          >
            <Settings className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff5b5b] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#f3f2f7]">
              19
            </span>
          </button>
        </div>

        <div className="h-7 w-px bg-gray-200 hidden md:block mx-1" />

        {/* Greeting & Avatar */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-gray-600">
            Hello, <strong className="font-bold text-gray-900">{admin?.name || 'Admin'}</strong>
          </span>
          <div className="w-10 h-10 rounded-full bg-[#00b074] text-white font-bold text-sm flex items-center justify-center ring-2 ring-white shadow-xs">
            {admin?.initial || 'F'}
          </div>
        </div>
      </div>
    </header>
  );
}

