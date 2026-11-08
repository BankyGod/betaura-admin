import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AdminLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' (Sedap) | 'mobile' (Profit Kings)
  const navigate = useNavigate();

  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-4">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className="rounded-full bg-[#00b074] text-white px-4 py-1.5 text-xs font-bold shadow-sm hover:bg-[#0a873c] transition"
          >
            ← Back to Sedap Desktop Dashboard
          </button>
        </div>
        <div className="w-full max-w-md bg-white min-h-[820px] rounded-3xl pb-20 shadow-lg flex flex-col overflow-hidden border border-gray-200 relative">
          <Header />
          <main className="flex-1 px-4 pt-2 pb-6 space-y-4">
            <Outlet context={{ viewMode: 'mobile', searchQuery }} />
          </main>
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f2f7] flex">
      {/* Left Desktop Sidebar (Sedap style) */}
      <Sidebar onQuickAction={() => navigate('/live-sync')} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onToggleViewMode={() =>
            setViewMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'))
          }
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-2 pb-8 space-y-6">
          <Outlet context={{ viewMode: 'desktop', searchQuery }} />
        </main>

        {/* Mobile Bottom Nav on small screens */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
