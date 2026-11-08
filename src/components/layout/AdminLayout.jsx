import { useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { Link2, X, CheckCircle2, Unlink } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const {
    admin,
    isLoggedOut,
    connectModalOpen,
    setConnectModalOpen,
    connectBetauraAccount,
    disconnectBetauraAccount,
  } = useAuth();

  const [betauraPhone, setBetauraPhone] = useState(
    admin?.connectedBetauraAccount?.phone_number || ''
  );
  const [betauraPassword, setBetauraPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState('');

  if (isLoggedOut) {
    return <Navigate to="/login" replace />;
  }

  async function handleConnectSubmit(e) {
    e.preventDefault();
    try {
      setConnecting(true);
      setConnectError('');
      setConnectSuccess('');
      const connected = await connectBetauraAccount(betauraPhone, betauraPassword);
      setConnectSuccess(
        `Connected BetAura account (${connected.username || connected.phone_number})! You can now edit your slips, manage games, and track your referral earnings.`
      );
      setBetauraPassword('');
      setTimeout(() => {
        setConnectModalOpen(false);
        setConnectSuccess('');
      }, 1400);
    } catch (err) {
      setConnectError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to connect BetAura account. Please check your phone number and password.'
      );
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white lg:bg-[#f3f2f7] flex justify-center lg:justify-start">
      {/* Global Connect BetAura Account Modal */}
      {connectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConnectModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Connect BetAura Account
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Enter the phone number & password you used on BetAura
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {admin?.connectedBetauraAccount && (
              <div className="rounded-2xl bg-[#eaf7ef] border border-[#00b074]/30 p-3.5 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <p className="font-extrabold text-[#0a873c] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Currently Linked:{' '}
                    {admin.connectedBetauraAccount.username ||
                      admin.connectedBetauraAccount.phone_number}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Phone: {admin.connectedBetauraAccount.phone_number} • Referral Code:{' '}
                    <strong>{admin.connectedBetauraAccount.referral_code}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => disconnectBetauraAccount()}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-50 text-red-600 px-2.5 py-1.5 text-[11px] font-bold hover:bg-red-100 shrink-0"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Unlink</span>
                </button>
              </div>
            )}

            {connectError && (
              <div className="rounded-xl bg-red-50 text-red-600 px-3.5 py-2.5 text-xs font-bold">
                {connectError}
              </div>
            )}

            {connectSuccess && (
              <div className="rounded-xl bg-[#d9f3ea] text-[#0a873c] px-3.5 py-2.5 text-xs font-bold">
                {connectSuccess}
              </div>
            )}

            <form onSubmit={handleConnectSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  BetAura Phone Number or Username
                </label>
                <input
                  type="text"
                  required
                  value={betauraPhone}
                  onChange={(e) => setBetauraPhone(e.target.value)}
                  placeholder="e.g. +233541234567 or username"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#00b074] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  BetAura Account Password
                </label>
                <input
                  type="password"
                  required
                  value={betauraPassword}
                  onChange={(e) => setBetauraPassword(e.target.value)}
                  placeholder="Enter your BetAura password"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#00b074] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white py-3 text-xs font-extrabold shadow-sm transition disabled:opacity-50"
              >
                {connecting ? 'Connecting BetAura Account...' : 'Connect BetAura Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Left Desktop Sidebar (Visible on lg+ screens) */}
      <Sidebar onQuickAction={() => navigate('/live-sync')} />

      {/* Main Content Wrapper */}
      <div className="w-full max-w-md lg:max-w-none flex-1 flex flex-col min-w-0 pb-24 lg:pb-8 bg-white lg:bg-[#f3f2f7] min-h-screen shadow-xs lg:shadow-none">
        {/* Mobile App Native Header (Visible on <lg screens) */}
        <div className="lg:hidden">
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenDrawer={() => navigate('/settings')}
          />
        </div>

        {/* Desktop Sedap Topbar (Visible on lg+ screens) */}
        <div className="hidden lg:block">
          <Topbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 lg:pt-2 pb-6 space-y-5 lg:space-y-6">
          <Outlet context={{ searchQuery }} />
        </main>

        {/* Mobile App Fixed Bottom Navigation (Visible on <lg screens) */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
