import { useState, useEffect } from 'react';
import {
  KeyRound,
  Link2,
  Unlink,
  ShieldCheck,
  Copy,
  Check,
  User,
  Phone,
  Award,
  Globe,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const CAPABILITY_ITEMS = [
  {
    key: 'view_dashboard',
    title: 'Dashboard & Revenue Analytics',
    desc: 'View platform overview, charts, and referral performance metrics',
  },
  {
    key: 'create_games',
    title: 'Create Custom Matches & Odds',
    desc: 'Publish custom fixtures and markets directly to BetAura sportsbook',
  },
  {
    key: 'mix_booking',
    title: 'Mix & Generate Booking Codes',
    desc: 'Build multi-leg accumulators and generate shareable booking codes',
  },
  {
    key: 'override_tickets',
    title: 'Settle & Override Bet Tickets',
    desc: 'Force-win, void, or edit legs on active and settled betslips',
  },
  {
    key: 'manage_users',
    title: 'Player Accounts & KYC Tiers',
    desc: 'Upgrade player levels (Level 1–4), suspend, or remove accounts',
  },
  {
    key: 'manage_wallet',
    title: 'Wallet Credit & Payout Approval',
    desc: 'Credit/debit player wallets and approve high-value withdrawals',
  },
];

export default function Settings() {
  const {
    admin,
    isSuperAdmin,
    hasPermission,
    changeSubAdminPassword,
    connectBetauraAccount,
    disconnectBetauraAccount,
  } = useAuth();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Connect BetAura Account State
  const [betauraPhone, setBetauraPhone] = useState(
    admin?.connectedBetauraAccount?.phone_number || ''
  );
  const [betauraPassword, setBetauraPassword] = useState('');
  const [showBetauraPass, setShowBetauraPass] = useState(false);

  // Copy & API status state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const connectedAcc = admin?.connectedBetauraAccount;
  const referralCode =
    connectedAcc?.referral_code ||
    admin?.referral_code ||
    (isSuperAdmin ? 'AURA-PROFIT' : `AURA-${(admin?.username || 'ADMIN').slice(0, 6).toUpperCase()}`);
  const referralLink = `https://betaura.onrender.com/register?ref=${encodeURIComponent(referralCode)}`;

  async function checkBackendStatus() {
    try {
      setCheckingHealth(true);
      const res = await adminApi.getHealth();
      setHealth(res.data);
    } catch {
      setHealth(null);
    } finally {
      setCheckingHealth(false);
    }
  }

  useEffect(() => {
    checkBackendStatus();
  }, []);

  function handleCopyCode() {
    navigator.clipboard?.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setErrMsg('');
    setMsg('');
    if (newPassword !== confirmPassword) {
      setErrMsg('New password and confirmation do not match.');
      return;
    }
    try {
      await changeSubAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg(`Password updated successfully for ${admin?.name}!`);
    } catch (err) {
      setErrMsg(err.response?.data?.detail || err.message);
    }
  }

  async function handleConnectBetaura(e) {
    e.preventDefault();
    setErrMsg('');
    setMsg('Connecting your BetAura account...');
    try {
      const connected = await connectBetauraAccount(betauraPhone, betauraPassword);
      setBetauraPassword('');
      setMsg(
        `BetAura Account Connected (${connected.username || connected.phone_number})!`
      );
    } catch (err) {
      setMsg('');
      setErrMsg(err.response?.data?.detail || err.message);
    }
  }

  const enabledPermsCount = CAPABILITY_ITEMS.filter((item) =>
    hasPermission(item.key)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Account Settings
        </h2>
      </div>

      {msg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#00b074] px-4 py-3 text-xs font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {errMsg && (
        <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-xs font-bold flex items-center justify-between">
          <span>{errMsg}</span>
          <button type="button" onClick={() => setErrMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Row: Account Profile Overview Card + Referral Code & Link Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Account Overview */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00b074] text-white font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0">
                {(admin?.name || 'A')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {admin?.name || 'ThisIsSuperAdmin'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#d9f3ea] text-[#00b074] text-[10px] font-extrabold uppercase">
                    {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  @{admin?.username || 'ThisIsSuperAdmin'} • {admin?.roleTitle || 'Super Administrator'}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
              {enabledPermsCount} / {CAPABILITY_ITEMS.length} Permissions Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                <User className="w-3.5 h-3.5 text-[#00b074]" />
                <span>Admin Username</span>
              </div>
              <p className="text-xs font-extrabold text-gray-900 mt-1 truncate">
                {admin?.username || 'ThisIsSuperAdmin'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                <Phone className="w-3.5 h-3.5 text-[#2d9cdb]" />
                <span>Phone Number</span>
              </div>
              <p className="text-xs font-extrabold text-gray-900 mt-1 truncate">
                {connectedAcc?.phone_number || admin?.phone || '+233540000001'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Linked BetAura</span>
              </div>
              <p className="text-xs font-extrabold text-gray-900 mt-1 truncate">
                {connectedAcc
                  ? connectedAcc.username || connectedAcc.phone_number
                  : 'Not Linked Yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Referral Attribution & Shareable Link Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Your Referral Code &amp; Link
              </h3>
              <p className="text-xs text-gray-400">
                Users who sign up with this code are attributed to your account
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-[#f3fbf7] border border-[#00b074]/25 px-3.5 py-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  Referral Code
                </span>
                <span className="text-sm font-extrabold text-[#00b074] tracking-wide">
                  {referralCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00b074] hover:bg-[#0a873c] text-white px-3 py-1.5 text-xs font-bold transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  Invite Link
                </span>
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {referralLink}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 text-xs font-bold shrink-0 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Connect BetAura Account + Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 1. Connect BetAura Account Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Connect BetAura Account
                </h3>
                <p className="text-xs text-gray-400">
                  Link your personal BetAura sportsbook account for slips &amp; referral tracking
                </p>
              </div>
            </div>

            {connectedAcc && (
              <div className="rounded-xl bg-[#eaf7ef] border border-[#00b074]/30 p-3.5 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <p className="font-extrabold text-[#0a873c]">
                    ✓ Connected: {connectedAcc.username || connectedAcc.phone_number}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Phone: {connectedAcc.phone_number} • Code:{' '}
                    <strong>{connectedAcc.referral_code}</strong> • Bonus:{' '}
                    <strong>{formatCurrency(connectedAcc.bonus_balance || 0)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => disconnectBetauraAccount()}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 text-[11px] font-bold transition shrink-0"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Unlink</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleConnectBetaura} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                BetAura Phone Number or Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +233506574617 or username"
                value={betauraPhone}
                onChange={(e) => setBetauraPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#00b074]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                BetAura Account Password
              </label>
              <div className="relative">
                <input
                  type={showBetauraPass ? 'text' : 'password'}
                  required
                  placeholder="Enter your BetAura password"
                  value={betauraPassword}
                  onChange={(e) => setBetauraPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:border-[#00b074]"
                />
                <button
                  type="button"
                  onClick={() => setShowBetauraPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showBetauraPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white py-2.5 text-xs font-extrabold transition"
            >
              {connectedAcc
                ? 'Switch Connected BetAura Account'
                : 'Connect BetAura Account'}
            </button>
          </form>
        </div>

        {/* 2. Change Admin Password Card */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2d9cdb] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Change Password
                </h3>
                <p className="text-xs text-gray-400">
                  Update your admin console login password
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              {showPass ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Current Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#2d9cdb]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#2d9cdb]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#2d9cdb]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#2d9cdb] hover:bg-[#2382ba] text-white py-2.5 text-xs font-extrabold transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Row: Active Role Permissions Matrix + Platform Connection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Permissions & Access Matrix */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Active Role Permissions &amp; Access Level
              </h3>
              <p className="text-xs text-gray-400">
                Capabilities enabled for your current session ({admin?.name})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAPABILITY_ITEMS.map((item) => {
              const allowed = hasPermission(item.key);
              return (
                <div
                  key={item.key}
                  className={`rounded-xl p-3.5 border flex items-start gap-3 ${
                    allowed
                      ? 'bg-[#f8fdfb] border-[#00b074]/25'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      allowed
                        ? 'bg-[#d9f3ea] text-[#00b074]'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {allowed ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform & API Connection Status */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Platform Connection
                  </h3>
                  <p className="text-xs text-gray-400">
                    Live BetAura backend status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={checkBackendStatus}
                disabled={checkingHealth}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
                title="Refresh API Status"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5">
                <span className="text-gray-500 font-medium">API Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    health
                      ? 'bg-[#d9f3ea] text-[#00b074]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {health ? `${health.status} (v${health.version})` : 'Connected'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5">
                <span className="text-gray-500 font-medium">Sportsbook Web</span>
                <a
                  href="https://betaura.onrender.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#00b074] hover:underline"
                >
                  betaura.onrender.com ↗
                </a>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5">
                <span className="text-gray-500 font-medium">Referral Commission</span>
                <span className="font-extrabold text-gray-900">
                  70% First Deposit (Sub-Admin)
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            All changes made in Account Settings sync immediately with the BetAura backend database.
          </p>
        </div>
      </div>
    </div>
  );
}
