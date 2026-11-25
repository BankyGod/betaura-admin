import { useState, useEffect, useCallback } from 'react';
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
  X,
  UserCheck,
  Percent,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  Banknote,
  AlertCircle,
  UserMinus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import apiClient from '../api/client';
import FundBetAccountModal from '../components/modals/FundBetAccountModal';
import AdjustCommissionModal from '../components/modals/AdjustCommissionModal';
import { Link } from 'react-router-dom';

function formatDateTime(iso) {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SubAdminEarnings() {
  const { subAdmins, refreshSubAdmins, admin } = useAuth();
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin ||
      admin?.role === 'ROLE_SUPER_ADMIN' ||
      admin?.id === 'super-admin-1' ||
      (admin?.username || '').toLowerCase() === 'thisissuperadmin'
  );

  const [activeTab, setActiveTab] = useState('SESSIONS'); // 'SESSIONS' | 'HISTORY'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('UNPAID_DESC');
  const [syncing, setSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [fundTarget, setFundTarget] = useState(null);
  const [inspectPuntersSub, setInspectPuntersSub] = useState(null);
  const [commissionTarget, setCommissionTarget] = useState(null);

  // Manual Payout Modal State
  const [payoutTarget, setPayoutTarget] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutConfirmed, setPayoutConfirmed] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');

  // Demote Sub-Admin to Punter State
  const [demoteTarget, setDemoteTarget] = useState(null);
  const [demoteSubmitting, setDemoteSubmitting] = useState(false);
  const [demoteError, setDemoteError] = useState('');

  const handleDemoteSubAdmin = async () => {
    if (!demoteTarget) return;
    setDemoteSubmitting(true);
    setDemoteError('');
    try {
      const res = await apiClient.post(`/api/v1/admin/sub-admins/${encodeURIComponent(demoteTarget.id)}/demote`);
      const msg = res.data?.message || `Successfully removed ${demoteTarget.name} from Sub-Admins and demoted to a regular punter.`;
      setBannerMessage(msg);
      setDemoteTarget(null);
      await refreshSubAdmins?.();
      setTimeout(() => setBannerMessage(''), 8000);
    } catch (err) {
      setDemoteError(err.response?.data?.detail || err.message || 'Failed to demote sub-admin.');
    } finally {
      setDemoteSubmitting(false);
    }
  };

  // Payout History State
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySubFilter, setHistorySubFilter] = useState('ALL');

  const fetchPayoutHistory = useCallback(async (subId = null) => {
    setHistoryLoading(true);
    try {
      const params = subId && subId !== 'ALL' ? { sub_admin_id: subId, limit: 200 } : { limit: 200 };
      const res = await apiClient.get('/api/v1/admin/sub-admins/payouts', { params });
      setPayoutHistory(Array.isArray(res.data?.payouts) ? res.data.payouts : []);
    } catch (err) {
      console.error('Failed to load payout history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    setSyncing(true);
    Promise.all([refreshSubAdmins?.(), fetchPayoutHistory()]).finally(() => setSyncing(false));
  }, [fetchPayoutHistory]);

  async function handleRefresh() {
    setSyncing(true);
    try {
      await Promise.all([
        refreshSubAdmins?.(),
        fetchPayoutHistory(historySubFilter !== 'ALL' ? historySubFilter : null),
      ]);
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

  function openPayoutModal(sub) {
    const unpaid = Number(sub.session_earnings ?? sub.unpaid_earnings ?? 0);
    setPayoutTarget(sub);
    setPayoutAmount(unpaid.toFixed(2));
    setPayoutRef('');
    setPayoutNotes('');
    setPayoutConfirmed(false);
    setPayoutError('');
  }

  async function handleConfirmPayout(e) {
    e.preventDefault();
    if (!payoutTarget) return;
    if (!payoutConfirmed) {
      setPayoutError('Please check the confirmation box before marking this Sub-Admin as paid.');
      return;
    }
    const parsedAmt = Number(payoutAmount);
    if (Number.isNaN(parsedAmt) || parsedAmt < 0) {
      setPayoutError('Please enter a valid payout amount.');
      return;
    }

    setPayoutSubmitting(true);
    setPayoutError('');
    try {
      const targetId = payoutTarget.id || payoutTarget.user_id || payoutTarget.username;
      const res = await apiClient.post(`/api/v1/admin/sub-admins/${encodeURIComponent(targetId)}/payout`, {
        amount: parsedAmt,
        payment_reference: payoutRef.trim() || null,
        notes: payoutNotes.trim() || null,
        paid_by: admin?.username || admin?.name || 'Super Admin',
      });
      setBannerMessage(
        res.data?.message ||
          `Marked @${payoutTarget.username} as PAID (${formatCurrency(parsedAmt)}) and started a new earning session.`
      );
      setPayoutTarget(null);
      await Promise.all([
        refreshSubAdmins?.(),
        fetchPayoutHistory(historySubFilter !== 'ALL' ? historySubFilter : null),
      ]);
      setTimeout(() => setBannerMessage(''), 7000);
    } catch (err) {
      setPayoutError(err?.response?.data?.detail || err?.message || 'Failed to record manual payout.');
    } finally {
      setPayoutSubmitting(false);
    }
  }

  // Aggregates across all Sub-Admins
  const totalUnpaidSession = subAdmins.reduce(
    (acc, s) => acc + Number(s.session_earnings ?? s.unpaid_earnings ?? 0),
    0
  );
  const totalDailyEarnings = subAdmins.reduce((acc, s) => acc + Number(s.daily_earnings ?? 0), 0);
  const totalWeeklyEarnings = subAdmins.reduce((acc, s) => acc + Number(s.weekly_earnings ?? 0), 0);
  const totalPaidOutAllTime = subAdmins.reduce((acc, s) => acc + Number(s.total_paid_out ?? 0), 0);
  const totalRecruitedPunters = subAdmins.reduce(
    (acc, s) => acc + Number(s.total_referrals || s.connectedBetauraAccount?.total_invited || 0),
    0
  );

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
        (statusFilter === 'SUSPENDED' && sub.status === 'SUSPENDED') ||
        (statusFilter === 'UNPAID' && Number(sub.session_earnings ?? sub.unpaid_earnings ?? 0) > 0);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const unpaidA = Number(a.session_earnings ?? a.unpaid_earnings ?? 0);
      const unpaidB = Number(b.session_earnings ?? b.unpaid_earnings ?? 0);
      const dailyA = Number(a.daily_earnings ?? 0);
      const dailyB = Number(b.daily_earnings ?? 0);
      const weeklyA = Number(a.weekly_earnings ?? 0);
      const weeklyB = Number(b.weekly_earnings ?? 0);
      const earnA = Number(a.referral_earnings || a.connectedBetauraAccount?.referral_earnings || 0);
      const earnB = Number(b.referral_earnings || b.connectedBetauraAccount?.referral_earnings || 0);
      const refA = Number(a.total_referrals || a.connectedBetauraAccount?.total_invited || 0);
      const refB = Number(b.total_referrals || b.connectedBetauraAccount?.total_invited || 0);

      if (sortBy === 'UNPAID_DESC') return unpaidB - unpaidA;
      if (sortBy === 'DAILY_DESC') return dailyB - dailyA;
      if (sortBy === 'WEEKLY_DESC') return weeklyB - weeklyA;
      if (sortBy === 'EARNINGS_DESC') return earnB - earnA;
      if (sortBy === 'PUNTERS_DESC') return refB - refA;
      if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 mb-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span>Super Admin Payouts &amp; Earning Sessions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Sub-Admin Earnings &amp; Manual Payouts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Track each Sub-Admin&apos;s Daily, Weekly, and Current Unpaid Session commissions. Mark a Sub-Admin as paid once you settle them manually to close the session and start a fresh earning cycle.
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
            <span>{syncing ? 'Syncing...' : 'Refresh Live'}</span>
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

      {/* Success Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage('')}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Unpaid Current Sessions */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-amber-200/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Unpaid Current Sessions
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalUnpaidSession)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Total owed to Sub-Admins right now</span>
          </div>
        </div>

        {/* Card 2: Today (Daily) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Today&apos;s Earnings (Daily)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalDailyEarnings)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Earned since 00:00 today</span>
          </div>
        </div>

        {/* Card 3: This Week (Weekly) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              This Week (Weekly)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2d9cdb] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalWeeklyEarnings)}
          </div>
          <div className="text-[11px] text-[#2d9cdb] font-semibold mt-1.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{totalRecruitedPunters} total referred punters</span>
          </div>
        </div>

        {/* Card 4: Total Paid Out All-Time */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Paid Out (All-Time)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(totalPaidOutAllTime)}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{payoutHistory.length} manual payouts recorded</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('SESSIONS')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'SESSIONS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Active Earning Sessions ({subAdmins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('HISTORY');
            fetchPayoutHistory(historySubFilter !== 'ALL' ? historySubFilter : null);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payout History ({payoutHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: Active Earning Sessions */}
      {activeTab === 'SESSIONS' && (
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

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none"
              >
                <option value="UNPAID_DESC">Sort: Highest Unpaid Session</option>
                <option value="DAILY_DESC">Sort: Highest Today (Daily)</option>
                <option value="WEEKLY_DESC">Sort: Highest This Week (Weekly)</option>
                <option value="EARNINGS_DESC">Sort: Highest All-Time</option>
                <option value="PUNTERS_DESC">Sort: Most Punters Recruited</option>
                <option value="NAME_ASC">Sort: Alphabetical (A-Z)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none"
              >
                <option value="ALL">All Sub-Admins ({subAdmins.length})</option>
                <option value="UNPAID">Has Unpaid Balance</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Sub-Admin Sessions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Sub-Admin</th>
                  <th className="py-3 px-4 text-center">Rate / Code</th>
                  <th className="py-3 px-4 text-center">Punters</th>
                  <th className="py-3 px-4 text-right">Today (Daily)</th>
                  <th className="py-3 px-4 text-right">This Week</th>
                  <th className="py-3 px-4 text-right">Current Unpaid Session</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-bold text-sm text-gray-600">No Sub-Admins Found</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {searchQuery
                          ? 'Try searching with a different username or phone number.'
                          : 'No Sub-Admins match this filter.'}
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
                    const dailyEarn = Number(sub.daily_earnings ?? 0);
                    const weeklyEarn = Number(sub.weekly_earnings ?? 0);
                    const unpaidSession = Number(sub.session_earnings ?? sub.unpaid_earnings ?? 0);
                    const paidOut = Number(sub.total_paid_out ?? 0);
                    const puntersCount = Number(sub.total_referrals || conn?.total_invited || 0);
                    const isSuspended = sub.status === 'SUSPENDED';

                    return (
                      <tr key={sub.id || sub.user_id} className="hover:bg-gray-50/70 transition-colors">
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
                                {isSuspended && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase">
                                    Suspended
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">
                                {sub.phone_number || conn?.phone_number || sub.roleTitle || 'Sub-Admin'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rate / Referral Code */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-[11px] inline-flex items-center gap-0.5">
                              <Percent className="w-2.5 h-2.5 text-purple-600 stroke-[2.5]" />
                              <span>{sub.commission_rate ?? sub.commission_percentage ?? 70}%</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(refCode)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-gray-500 hover:text-emerald-600 cursor-pointer"
                              title="Copy referral code"
                            >
                              <span>{refCode}</span>
                              {copiedCode === refCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
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
                            <span>{puntersCount}</span>
                          </button>
                        </td>

                        {/* Today (Daily) */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-gray-900 text-xs">
                            {formatCurrency(dailyEarn)}
                          </span>
                        </td>

                        {/* This Week (Weekly) */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-blue-700 text-xs">
                            {formatCurrency(weeklyEarn)}
                          </span>
                        </td>

                        {/* Current Unpaid Session */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span
                              className={`font-mono font-black text-sm ${
                                unpaidSession > 0 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {formatCurrency(unpaidSession)}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {sub.last_paid_at
                                ? `Since ${formatDateTime(sub.session_started_at)}`
                                : 'First session'}
                            </span>
                          </div>
                        </td>

                        {/* Total Paid Out */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-emerald-700 text-xs">
                              {formatCurrency(paidOut)}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {sub.payout_count
                                ? `${sub.payout_count} payout${sub.payout_count > 1 ? 's' : ''}`
                                : 'No payouts yet'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => openPayoutModal(sub)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                title="Mark this Sub-Admin as paid and start a new earning session"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Paid</span>
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => setCommissionTarget(sub)}
                                className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                title="Adjust commission rate"
                              >
                                %
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => setFundTarget(sub)}
                                className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                title="Fund connected betting account"
                              >
                                Fund
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDemoteTarget(sub);
                                  setDemoteError('');
                                }}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Remove Sub-Admin and demote to regular punter"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Demote</span>
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
      )}

      {/* TAB 2: Payout History Ledger */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-gray-900">Manual Payout Audit Ledger</h2>
              <p className="text-xs text-gray-400">
                Every time Super Admin marks a Sub-Admin as paid, the closed session is permanently logged here.
              </p>
            </div>
            <select
              value={historySubFilter}
              onChange={(e) => {
                const val = e.target.value;
                setHistorySubFilter(val);
                fetchPayoutHistory(val !== 'ALL' ? val : null);
              }}
              className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none"
            >
              <option value="ALL">All Sub-Admins</option>
              {subAdmins.map((s) => (
                <option key={s.id || s.username} value={s.id || s.username}>
                  {s.name || s.username} (@{s.username})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Paid Date</th>
                  <th className="py-3 px-4">Sub-Admin</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Session Period</th>
                  <th className="py-3 px-4">Reference / Notes</th>
                  <th className="py-3 px-4 text-right">Paid By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                      Loading payout ledger...
                    </td>
                  </tr>
                ) : payoutHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-bold text-sm text-gray-600">No Manual Payouts Recorded Yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        When you click &quot;Mark Paid&quot; on a Sub-Admin, the settled session will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  payoutHistory.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600">
                        {formatDateTime(p.created_at || p.session_end)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900">{p.sub_admin_name}</div>
                        <div className="text-[11px] text-gray-400">@{p.sub_admin_username}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-black text-xs border border-emerald-200">
                          {formatCurrency(p.amount_paid)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-gray-600">
                        <div>{p.session_start ? formatDateTime(p.session_start) : 'Start'}</div>
                        <div className="text-gray-400">→ {formatDateTime(p.session_end)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.payment_reference && (
                          <div className="font-mono font-bold text-gray-800 text-[11px]">
                            Ref: {p.payment_reference}
                          </div>
                        )}
                        {p.notes && <div className="text-[11px] text-gray-500">{p.notes}</div>}
                        {!p.payment_reference && !p.notes && (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-700">
                        {p.paid_by || 'Super Admin'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark as Paid & Start New Session Modal */}
      {payoutTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => !payoutSubmitting && setPayoutTarget(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Mark Sub-Admin as Paid
                  </h3>
                  <p className="text-xs text-gray-400">
                    {payoutTarget.name || payoutTarget.username} (@{payoutTarget.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={payoutSubmitting}
                onClick={() => setPayoutTarget(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Breakdown Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Today</div>
                <div className="text-xs font-mono font-extrabold text-gray-900 mt-0.5">
                  {formatCurrency(payoutTarget.daily_earnings ?? 0)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase">This Week</div>
                <div className="text-xs font-mono font-extrabold text-blue-700 mt-0.5">
                  {formatCurrency(payoutTarget.weekly_earnings ?? 0)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Unpaid Session</div>
                <div className="text-xs font-mono font-black text-amber-700 mt-0.5">
                  {formatCurrency(payoutTarget.session_earnings ?? payoutTarget.unpaid_earnings ?? 0)}
                </div>
              </div>
            </div>

            {payoutTarget.phone_number && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800 flex items-center justify-between">
                <span className="font-semibold">Sub-Admin Phone / MoMo:</span>
                <span className="font-mono font-black">{payoutTarget.phone_number}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPayout} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Amount Paid (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-mono font-extrabold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Reference <span className="text-gray-400 font-normal">(Optional — MoMo Tx ID / Bank Ref)</span>
                </label>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. MOMO-8849201"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Settled weekly payout via MTN MoMo"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payoutConfirmed}
                  onChange={(e) => setPayoutConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] text-emerald-900 font-semibold leading-snug">
                  I confirm I have manually paid this Sub-Admin. Close the current earning session (reset unpaid balance to GHS 0.00) and start a new earning session from now.
                </span>
              </label>

              {payoutError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={payoutSubmitting}
                  onClick={() => setPayoutTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting || !payoutConfirmed}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{payoutSubmitting ? 'Recording Payout...' : 'Confirm Paid & Start New Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    Referral Code:{' '}
                    <span className="font-mono font-bold text-gray-700">
                      {inspectPuntersSub.referral_code || inspectPuntersSub.connectedBetauraAccount?.referral_code}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectPuntersSub(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
          onSuccess={() => {
            refreshSubAdmins?.();
          }}
        />
      )}

      {/* Demote Sub-Admin to Regular Punter Modal */}
      {demoteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => !demoteSubmitting && setDemoteTarget(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <UserMinus className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-tight">Demote to Regular Punter</h3>
                  <p className="text-[11px] text-gray-400">Remove from Sub-Admin role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !demoteSubmitting && setDemoteTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-gray-600">
              <p className="leading-relaxed">
                Are you sure you want to remove <strong className="text-gray-900">{demoteTarget.name}</strong> (<span className="font-mono text-purple-700 font-bold">@{demoteTarget.username}</span>) from Sub-Admins?
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-rose-900 space-y-1.5 text-[11px] leading-relaxed">
                <p className="font-black flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  What happens when demoted:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-rose-700">
                  <li>Account role will be downgraded to <strong>ROLE_PUNTER</strong> (regular/normal punter).</li>
                  <li>All back-office access to the Admin Dashboard will be immediately revoked.</li>
                  <li>Player wallet balance and personal betting records remain completely safe.</li>
                </ul>
              </div>

              {demoteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{demoteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={demoteSubmitting}
                onClick={() => setDemoteTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={demoteSubmitting}
                onClick={handleDemoteSubAdmin}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {demoteSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Demoting...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Yes, Demote to Regular Punter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
