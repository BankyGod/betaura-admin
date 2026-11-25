import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  X,
  UserCheck,
  Eye,
  AlertTriangle,
  Copy,
  Check,
  ZoomIn,
  RotateCw,
  FileText,
  Lock,
} from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const PRESET_DENIAL_REASONS = [
  'Blurry or unreadable Ghana Card photo',
  'Name on Ghana Card does not match registered account name',
  'Expired, counterfeit, or invalid Ghana Card number',
  'Incomplete document: Corners or details cut off',
  'Suspected forged, doctored, or fraudulent identity document',
];

export default function KYCVerification() {
  const { admin, hasPermission } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, DENIED
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal states
  const [activeImageModal, setActiveImageModal] = useState(null); // image url string or null
  const [imageRotation, setImageRotation] = useState(0);
  const [activeDenyTarget, setActiveDenyTarget] = useState(null); // submission object or null
  const [denialReason, setDenialReason] = useState(PRESET_DENIAL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const canReview =
    hasPermission('upgrade_kyc') ||
    hasPermission('manage_users') ||
    admin?.isSuperAdmin ||
    admin?.role === 'ROLE_SUPER_ADMIN' ||
    admin?.role === 'ROLE_SUB_ADMIN';

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getKycSubmissions();
      const list = Array.isArray(res.data?.submissions) ? res.data.submissions : [];
      setSubmissions(list);
    } catch (err) {
      console.error('Failed to load KYC submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (sub) => {
    if (!canReview) {
      alert('You do not have permission to verify KYC documents.');
      return;
    }
    if (!window.confirm(`Approve Ghana Card for ${sub.username || sub.full_name}? This will elevate the user to Tier 2 KYC.`)) {
      return;
    }
    setActionLoading(true);
    setActionFeedback(null);
    try {
      await adminApi.approveKyc(sub.user_id);
      setActionFeedback({
        type: 'success',
        message: `Ghana Card approved for ${sub.username || sub.full_name}. Upgraded to Tier 2.`,
      });
      await loadSubmissions();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to approve KYC document.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDenyModal = (sub) => {
    setActiveDenyTarget(sub);
    setDenialReason(PRESET_DENIAL_REASONS[0]);
    setCustomReason('');
    setActionFeedback(null);
  };

  const handleConfirmDeny = async () => {
    if (!activeDenyTarget) return;
    const finalReason = denialReason === 'CUSTOM' ? customReason.trim() : denialReason;
    if (!finalReason) {
      alert('Please specify a valid denial reason.');
      return;
    }

    const currentStrikes = Number(activeDenyTarget.denial_count || 0);
    const nextStrike = currentStrikes + 1;
    if (nextStrike >= 3) {
      const confirmed = window.confirm(
        `🚨 WARNING: STRIKE 3 OUT OF 3!\n\nDenying this verification will AUTOMATICALLY SUSPEND ${activeDenyTarget.username}'s account for using fake/fraudulent documents.\n\nProceed with account suspension?`
      );
      if (!confirmed) return;
    }

    setActionLoading(true);
    try {
      const res = await adminApi.denyKyc(activeDenyTarget.user_id, { reason: finalReason });
      const data = res.data;
      if (data?.is_suspended) {
        setActionFeedback({
          type: 'error',
          message: `🚨 Strike 3 applied: Account for ${activeDenyTarget.username} has been AUTOMATICALLY SUSPENDED for fake document usage.`,
        });
      } else {
        setActionFeedback({
          type: 'warning',
          message: `Verification rejected (Strike ${data?.denial_count || nextStrike}/3). Player notified to re-upload.`,
        });
      }
      setActiveDenyTarget(null);
      await loadSubmissions();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to submit denial.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & search
  const filteredSubmissions = submissions.filter((s) => {
    const status = String(s.status || '').toUpperCase();
    const strikes = Number(s.denial_count || 0);

    if (filter === 'PENDING' && status !== 'PENDING') return false;
    if (filter === 'APPROVED' && status !== 'APPROVED') return false;
    if (filter === 'DENIED' && status !== 'DENIED' && status !== 'SUSPENDED_3_STRIKES' && strikes === 0) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = String(s.username || '').toLowerCase().includes(q);
      const matchPhone = String(s.phone_number || '').toLowerCase().includes(q);
      const matchName = String(s.full_name || '').toLowerCase().includes(q);
      const matchCard = String(s.national_id_number || '').toLowerCase().includes(q);
      return matchUser || matchPhone || matchName || matchCard;
    }
    return true;
  });

  const totalCount = submissions.length;
  const pendingCount = submissions.filter((s) => String(s.status).toUpperCase() === 'PENDING').length;
  const approvedCount = submissions.filter((s) => String(s.status).toUpperCase() === 'APPROVED').length;
  const suspendedCount = submissions.filter(
    (s) => Number(s.denial_count || 0) >= 3 || String(s.status).toUpperCase().includes('SUSPENDED')
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            KYC &amp; Ghana Card Verification Desk
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review uploaded Ghana Cards, verify national ID numbers, approve Tier 2 status, or enforce 3-strike document fraud rules.
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-xs disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          Refresh Desk
        </button>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : actionFeedback.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {actionFeedback.type === 'error' && <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
            {actionFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-400 hover:text-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Approved (Tier 2)</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-red-100 bg-red-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Suspended (3 Strikes)</p>
          <p className="text-2xl font-black text-red-700 mt-1">{suspendedCount}</p>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Players', count: totalCount },
            { id: 'PENDING', label: 'Pending', count: pendingCount },
            { id: 'APPROVED', label: 'Approved', count: approvedCount },
            { id: 'DENIED', label: 'Denied / Suspended', count: suspendedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or Ghana Card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Loading KYC submissions &amp; document records...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs space-y-2">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-gray-800">No KYC Submissions Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No player records match your search filter.'
              : 'There are currently no identity verification submissions under this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const strikes = Number(sub.denial_count || 0);
            const isSuspended =
              strikes >= 3 || String(sub.status || '').toUpperCase().includes('SUSPENDED');
            const isApproved = String(sub.status || '').toUpperCase() === 'APPROVED';
            const isPending = String(sub.status || '').toUpperCase() === 'PENDING';
            const hasImage = Boolean(sub.card_image);

            return (
              <div
                key={sub.user_id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-xs ${
                  isSuspended
                    ? 'border-red-200 bg-red-50/10'
                    : isPending
                    ? 'border-amber-200/80 hover:border-amber-300'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Player Info & Card Number */}
                  <div className="flex items-start gap-3.5">
                    {/* Ghana Card Image Thumbnail */}
                    <div className="relative shrink-0">
                      {hasImage ? (
                        <div
                          onClick={() => {
                            setActiveImageModal(sub.card_image);
                            setImageRotation(0);
                          }}
                          className="w-20 h-14 sm:w-28 sm:h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer group relative shadow-xs"
                        >
                          <img
                            src={sub.card_image}
                            alt="Ghana Card Document"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-14 sm:w-28 sm:h-20 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                          <FileText className="w-4 h-4 mb-1 text-gray-300" />
                          <span className="text-[9px] font-bold text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900">
                          {sub.username || sub.full_name || 'Player'}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          {sub.phone_number || 'No phone'}
                        </span>

                        {/* Status Tag */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved (Tier 2)
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black border border-red-200">
                            <Lock className="w-3 h-3 text-red-600" />
                            SUSPENDED (3 STRIKES)
                          </span>
                        )}
                        {!isApproved && !isPending && !isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                            {sub.status || 'UNVERIFIED'}
                          </span>
                        )}
                      </div>

                      {/* Ghana Card Number Badge */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 text-emerald-400 rounded-lg font-mono text-xs font-black shadow-xs">
                          <span>{sub.national_id_number || 'NO-ID-RECORDED'}</span>
                          <button
                            onClick={() => handleCopy(sub.national_id_number, sub.user_id)}
                            title="Copy Card Number"
                            className="text-gray-400 hover:text-white transition ml-1"
                          >
                            {copiedId === sub.user_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {sub.full_name && sub.full_name !== sub.username && (
                          <span className="text-[11px] text-gray-600 font-semibold">
                            Full Legal Name: <strong className="text-gray-800">{sub.full_name}</strong>
                          </span>
                        )}
                      </div>

                      {/* Strike Counter & Reason */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <div
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                            strikes === 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : strikes === 1
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : strikes === 2
                              ? 'bg-orange-50 text-orange-700 border border-orange-200 font-black'
                              : 'bg-red-100 text-red-800 font-black border border-red-300'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>
                            {strikes === 0
                              ? '0 / 3 Strikes (Clean)'
                              : strikes === 1
                              ? 'Strike 1 of 3 (Warning)'
                              : strikes === 2
                              ? 'Strike 2 of 3 (Final Attempt)'
                              : 'Strike 3 of 3 (Account Suspended for Fraud)'}
                          </span>
                        </div>

                        {sub.denial_reason && (
                          <span className="text-[11px] text-red-600 font-medium">
                            Last rejection reason: &ldquo;{sub.denial_reason}&rdquo;
                          </span>
                        )}

                        <span className="text-[10px] text-gray-400">
                          Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {hasImage && (
                      <button
                        onClick={() => {
                          setActiveImageModal(sub.card_image);
                          setImageRotation(0);
                        }}
                        className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Image</span>
                      </button>
                    )}

                    {!isSuspended && !isApproved && canReview && (
                      <>
                        <button
                          onClick={() => handleApprove(sub)}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleOpenDenyModal(sub)}
                          disabled={actionLoading}
                          className="px-3.5 py-2 text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 border border-red-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Deny ({strikes + 1}/3)</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-emerald-600 block">
                          Verified Tier 2
                        </span>
                        <span className="text-[10px] text-gray-400">No further action needed</span>
                      </div>
                    )}

                    {isSuspended && (
                      <div className="text-right">
                        <span className="text-[11px] font-black text-red-600 block">
                          Account Frozen
                        </span>
                        <span className="text-[10px] text-gray-400">Exceeded 3 strikes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Zoom Image Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-extrabold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Ghana Card High-Resolution Inspection
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImageModal(null)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-950">
              <img
                src={activeImageModal}
                alt="Enlarged Ghana Card Document"
                style={{ transform: `rotate(${imageRotation}deg)` }}
                className="max-h-[75vh] max-w-full object-contain rounded-lg transition duration-200"
              />
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Inspect details: full name, date of birth, expiry date, and national ID format.</span>
              <button
                onClick={() => setActiveImageModal(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Denial Reason & Strike Modal */}
      {activeDenyTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  Deny Ghana Card Verification
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Player: <strong>{activeDenyTarget.username || activeDenyTarget.full_name}</strong> (
                  {activeDenyTarget.national_id_number})
                </p>
              </div>
              <button
                onClick={() => setActiveDenyTarget(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Strike Warning Alert */}
            {(() => {
              const currentStrikes = Number(activeDenyTarget.denial_count || 0);
              const nextStrike = currentStrikes + 1;
              if (nextStrike >= 3) {
                return (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                    <p className="font-black flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-red-600 shrink-0" />
                      CRITICAL: 3RD STRIKE (AUTOMATIC ACCOUNT SUSPENSION)
                    </p>
                    <p className="text-[11px] text-red-700 leading-relaxed">
                      This user has previously failed 2 verifications. Confirming this denial will record{' '}
                      <strong>Strike 3</strong> and <strong>immediately freeze/suspend the account</strong> with a
                      formal notice concerning fake or fraudulent documents.
                    </p>
                  </div>
                );
              } else {
                return (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-0.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Strike {nextStrike} of 3
                    </p>
                    <p className="text-[11px] text-amber-800">
                      The user will be notified of this rejection and permitted to re-upload. They will have{' '}
                      <strong>{3 - nextStrike}</strong> attempt(s) remaining.
                    </p>
                  </div>
                );
              }
            })()}

            {/* Preset Reasons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Select Rejection Reason</label>
              <div className="space-y-1.5">
                {PRESET_DENIAL_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      denialReason === r
                        ? 'border-red-400 bg-red-50/40 text-red-900 font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="denial_reason"
                      value={r}
                      checked={denialReason === r}
                      onChange={() => setDenialReason(r)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    denialReason === 'CUSTOM'
                      ? 'border-red-400 bg-red-50/40 text-red-900 font-semibold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="denial_reason"
                    value="CUSTOM"
                    checked={denialReason === 'CUSTOM'}
                    onChange={() => setDenialReason('CUSTOM')}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <span>Other / Custom explanation</span>
                </label>
              </div>

              {denialReason === 'CUSTOM' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explain why this ID document is being rejected..."
                  className="w-full mt-2 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                />
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveDenyTarget(null)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeny}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>
                  {Number(activeDenyTarget.denial_count || 0) + 1 >= 3
                    ? 'Confirm Strike 3 (Suspend Account)'
                    : 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
