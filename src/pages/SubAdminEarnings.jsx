import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Search,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Wallet,
  Gift,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import FundBetAccountModal from '../components/modals/FundBetAccountModal';
import AdjustCommissionModal from '../components/modals/AdjustCommissionModal';
import { Link } from 'react-router-dom';

export default function SubAdminEarnings() {
  const { subAdmins, refreshSubAdmins, admin } = useAuth();
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin ||
      admin?.role === 'ROLE_SUPER_ADMIN' ||
      admin?.id === 'super-admin-1' ||
      (admin?.username || '').toLowerCase() === 'thisissuperadmin'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('EARNINGS_DESC');
  const [syncing, setSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [fundTarget, setFundTarget] = useState(null);
  const [inspectPuntersSub, setInspectPuntersSub] = useState(null);
  const [commissionTarget, setCommissionTarget] = useState(null);

  useEffect(() => {
    setSyncing(true);
    refreshSubAdmins?.().finally(() => setSyncing(false));
  }, []);

  async function handleRefresh() {
    setSyncing(true);
    try {
      await refreshSubAdmins?.();
    } finally {
      setSyncing(false);
    }
  }

  function handleCopy(code) {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Calculate Aggregates across all Sub-Admins
  const totalSubAdmins = subAdmins.length;
  const totalReferralEarnings = subAdmins.reduce((acc, s) => {
    const val = Number(
      s.referral_earnings ||
        s.connectedBetauraAccount?.referral_earnings ||
        0
    );
    return acc + val;
  }, 0);

  const totalBonusBalances = subAdmins.reduce((acc, s) => {
    const val = Number(
      s.connectedBetauraAccount?.bonus_balance ||
        s.bonus_balance ||
        0
    );
    return acc + val;
  }, 0);

  const totalRecruitedPunters = subAdmins.reduce((acc, s) => {
    const val = Number(
      s.total_referrals ||
        s.connectedBetauraAccount?.total_invited ||
        0
    );
    return acc + val;
  }, 0);

  // Filter & Sort Sub-Admins
  const filteredSubs = subAdmins
    .filter((sub) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        sub.name?.toLowerCase().includes(q) ||
        sub.username?.toLowerCase().includes(q) ||
        sub.phone_number?.includes(q) ||
        sub.phone?.includes(q) ||
        sub.referral_code?.toLowerCase().includes(q) ||
        sub.connectedBetauraAccount?.referral_code?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && sub.status !== 'SUSPENDED') ||
        (statusFilter === 'SUSPENDED' && sub.status === 'SUSPENDED');

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const earnA = Number(
        a.referral_earnings || a.connectedBetauraAccount?.referral_earnings || 0
      );
      const earnB = Number(
        b.referral_earnings || b.connectedBetauraAccount?.referral_earnings || 0
      );
      const balA = Number(
        a.connectedBetauraAccount?.bonus_balance || 0
      );
      const balB = Number(
        b.connectedBetauraAccount?.bonus_balance || 0
      );
      const refA = Number(
        a.total_referrals || a.connectedBetauraAccount?.total_invited || 0
      );
      const refB = Number(
        b.total_referrals || b.connectedBetauraAccount?.total_invited || 0
      );

      if (sortBy === 'EARNINGS_DESC') return earnB - earnA;
      if (sortBy === 'BALANCE_DESC') return balB - balA;
      if (sortBy === 'PUNTERS_DESC') return refB - refA;
      if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  // Top Earner
  const topEarner = [...subAdmins].sort(
    (a, b) =>
      Number(b.referral_earnings || b.connectedBetauraAccount?.referral_earnings || 0) -
      Number(a.referral_earnings || a.connectedBetauraAccount?.referral_earnings || 0)
  )[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Super Admin Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Sub-Admin Referral Moneymaking Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Live real-time ledger of all Sub-Admins&apos; downstream referral commissions, punter acquisition rates, active bonus balances, and affiliate moneymaking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Refresh Live Balances'}</span>
          </button>

          <Link
            to="/sub-admins"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Manage Roles</span>
          </Link>
        </div>
      </div>

      {/* Top Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Commissions */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Sub-Admin Earnings
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalReferralEarnings)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            <span>Combined affiliate moneymaking</span>
          </div>
        </div>

        {/* Card 2: Active Bonus / Referral Balances */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Referral Wallets
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2d9cdb] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalBonusBalances)}
          </div>
          <div className="text-[11px] text-gray-400 font-semibold mt-1.5 flex items-center gap-1">
            <span>Currently held in bonus balances</span>
          </div>
        </div>

        {/* Card 3: Total Recruited Punters */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Downstream Punters Recruited
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {totalRecruitedPunters}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1.5 flex items-center gap-1">
            <span>Players onboarded via Sub-Admin codes</span>
          </div>
        </div>

        {/* Card 4: Top Performing Sub-Admin */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Top Earner
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-black text-gray-900 truncate">
            {topEarner ? `@${topEarner.username || topEarner.name}` : 'None'}
          </div>
          <div className="text-xs font-bold text-emerald-600 font-mono mt-1">
            {topEarner
              ? formatCurrency(
                  topEarner.referral_earnings ||
                    topEarner.connectedBetauraAccount?.referral_earnings ||
                    0
                )
              : 'GH₵ 0.00'}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sub-admin name, username, phone, or referral code..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#22D3EE]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none"
            >
              <option value="EARNINGS_DESC">Sort: Highest Earnings</option>
              <option value="BALANCE_DESC">Sort: Highest Referral Balance</option>
              <option value="PUNTERS_DESC">Sort: Most Punters Recruited</option>
              <option value="NAME_ASC">Sort: Alphabetical (A-Z)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none"
            >
              <option value="ALL">All Status ({subAdmins.length})</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Sub-Admin Moneymaking Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Sub-Admin</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4 text-center">Commission Rate</th>
                <th className="py-3 px-4 text-center">Punters Invited</th>
                <th className="py-3 px-4 text-right">Referral Earnings</th>
                <th className="py-3 px-4 text-right">Active Bonus Wallet</th>
                <th className="py-3 px-4 text-right">Betting Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-600">No Sub-Admins Found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {searchQuery
                        ? 'Try searching with a different username or phone number.'
                        : 'No Sub-Admins have been appointed yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const conn = sub.connectedBetauraAccount;
                  const refCode =
                    sub.referral_code ||
                    conn?.referral_code ||
                    `AURA-${(sub.username || 'ADM').slice(0, 6).toUpperCase()}`;
                  const lifetimeEarnings = Number(
                    sub.referral_earnings || conn?.referral_earnings || 0
                  );
                  const bonusBal = Number(
                    conn?.bonus_balance || sub.bonus_balance || 0
                  );
                  const betBalance = Number(conn?.balance || 0);
                  const puntersCount = Number(
                    sub.total_referrals || conn?.total_invited || 0
                  );
                  const isSuspended = sub.status === 'SUSPENDED';

                  return (
                    <tr
                      key={sub.id || sub.user_id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Sub-Admin Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
                            {sub.initial || (sub.name || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                              <span>{sub.name || sub.username}</span>
                              {sub.username && (
                                <span className="text-[11px] font-medium text-gray-400">
                                  @{sub.username}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {sub.roleTitle || 'Match & Slip Creator'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono font-extrabold text-gray-800 text-xs">
                            {refCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(refCode)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Copy referral code"
                          >
                            {copiedCode === refCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Commission Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-xs flex items-center gap-1 shadow-xs">
                            <Percent className="w-3 h-3 text-purple-600 stroke-[2.5]" />
                            <span>{sub.commission_rate ?? sub.commission_percentage ?? 70}%</span>
                          </span>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setCommissionTarget(sub)}
                              className="text-gray-400 hover:text-purple-600 p-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Super Admin: Increase or reduce commission percentage"
                            >
                              <Percent className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Punters Invited */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setInspectPuntersSub(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          title="Click to view invited players"
                        >
                          <Users className="w-3 h-3 text-purple-600" />
                          <span>{puntersCount} players</span>
                        </button>
                      </td>

                      {/* Lifetime Referral Earnings */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-emerald-600 text-sm">
                          {formatCurrency(lifetimeEarnings)}
                        </span>
                      </td>

                      {/* Active Bonus Wallet */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-gray-900 text-xs">
                          {formatCurrency(bonusBal)}
                        </span>
                      </td>

                      {/* Betting Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-gray-800 text-xs">
                          {formatCurrency(betBalance)}
                        </div>
                        {conn?.phone_number && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            {conn.phone_number}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isSuspended
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {sub.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setCommissionTarget(sub)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Increase or reduce sub-admin commission percentage"
                            >
                              <Percent className="w-3 h-3 text-purple-600" />
                              <span>Adjust %</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectPuntersSub(sub)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                            title="Inspect downstream punters"
                          >
                            Punters
                          </button>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setFundTarget(sub)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                              title="Fund this Sub-Admin's connected betting account"
                            >
                              Fund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fund Betting Account Modal */}
      {fundTarget && (
        <FundBetAccountModal
          sub={fundTarget}
          onClose={() => setFundTarget(null)}
          onSuccess={() => {
            setFundTarget(null);
            refreshSubAdmins?.();
          }}
        />
      )}

      {/* Downstream Punters Inspection Modal */}
      {inspectPuntersSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setInspectPuntersSub(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Downstream Punters — @{inspectPuntersSub.username || inspectPuntersSub.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Referral Code: <span className="font-mono font-bold text-gray-700">{inspectPuntersSub.referral_code || inspectPuntersSub.connectedBetauraAccount?.referral_code}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectPuntersSub(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recruited Punters List */}
            {(() => {
              const punters =
                inspectPuntersSub.referred_people ||
                inspectPuntersSub.connectedBetauraAccount?.referred_people ||
                [];

              if (punters.length === 0) {
                return (
                  <div className="py-10 text-center text-gray-400">
                    <UserCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-600">No Players Invited Yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      When players register using code &quot;{inspectPuntersSub.referral_code || 'AURA'}&quot;, they will appear here.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {punters.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                          {(p.username || p.name || 'P')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {p.username ? `@${p.username}` : p.name || 'Punter'}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Joined {p.joined || 'Recently'} {p.phone ? `• ${p.phone}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-600 text-xs">
                          {p.deposit_active ? 'Active Depositor' : 'Registered'}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Bal: {formatCurrency(p.balance || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-500">
              <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                Sub-Admin Commission: {inspectPuntersSub?.commission_rate ?? inspectPuntersSub?.commission_percentage ?? 70}% on all deposits
              </span>
              <button
                type="button"
                onClick={() => setInspectPuntersSub(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Commission Rate Modal */}
      {commissionTarget && (
        <AdjustCommissionModal
          isOpen={Boolean(commissionTarget)}
          target={commissionTarget}
          onClose={() => setCommissionTarget(null)}
          onSuccess={(updated) => {
            refreshSubAdmins?.();
          }}
        />
      )}
    </div>
  );
}
