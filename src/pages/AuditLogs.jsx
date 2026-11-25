import { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Phone,
  DollarSign,
  FileText,
} from 'lucide-react';
import { adminApi } from '../api/endpoints';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState({});

  const fetchLogs = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const res = await adminApi.getAuditLogs();
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      if (!quiet) {
        setError(
          err.response?.data?.detail ||
            'Sign in with an Admin/Compliance role token to view live audit logs.'
        );
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
    const interval = setInterval(() => fetchLogs(true), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const getActionBadgeStyle = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('FEE') || act.includes('PAY') || act.includes('APPROVE_WITHDRAWAL')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
    }
    if (act.includes('WITHDRAWAL_REQUESTED') || act.includes('WD_')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10';
    }
    if (act.includes('KYC') || act.includes('VERIF') || act.includes('APPROVE_KYC')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';
    }
    if (act.includes('SUSPEND') || act.includes('OVERRIDE') || act.includes('ALERT')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
    }
    if (act.includes('DEPOSIT') || act.includes('FUND')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200 ring-gray-500/10';
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((l) => {
      const act = (l.action || '').toLowerCase();
      const det = (l.details || '').toLowerCase();
      const time = (l.created_at || '').toLowerCase();
      return act.includes(q) || det.includes(q) || time.includes(q);
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              Compliance &amp; Admin Audit Logs
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {filteredLogs.length} Records
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Tamper-evident regulatory and trading audit trail from /api/v1/admin/audit-logs
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLogs(false)}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer transition active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00b074]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by action, player name, phone, reference, or amount..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00b074]/30 focus:border-[#00b074] shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOBILE CARDS VIEW (Visible on mobile screens < sm)             */}
      {/* ============================================================== */}
      <div className="sm:hidden space-y-3">
        {loading && logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-gray-100 shadow-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00b074] mb-2" />
            Loading audit logs from backend...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-gray-100 shadow-xs">
            No audit log entries found.
          </div>
        ) : (
          filteredLogs.map((l, idx) => {
            const cardId = l.id || `log-${idx}`;
            const isExpanded = Boolean(expandedIds[cardId]);
            const detailsText = l.details || '';
            const lines = detailsText.split('\n').filter((x) => x.trim());

            return (
              <div
                key={cardId}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3"
              >
                {/* Header: Action Badge & Timestamp */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-block px-2.5 py-1 text-[11px] font-black uppercase rounded-lg border ring-1 ${getActionBadgeStyle(
                      l.action
                    )}`}
                  >
                    {l.action}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium shrink-0 pt-0.5">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span>{formatTimestamp(l.created_at)}</span>
                  </div>
                </div>

                {/* Formatted Details Preview */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-xs text-gray-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-gray-700 whitespace-pre-wrap leading-relaxed break-words font-sans">
                    {isExpanded || lines.length <= 4
                      ? detailsText
                      : lines.slice(0, 4).join('\n') + '...'}
                  </div>

                  {lines.length > 4 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(cardId)}
                      className="text-[11px] font-bold text-[#00b074] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show Less</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Show Full Details ({lines.length} lines)</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Copy / Actions Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[11px]">
                  <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">
                    ID: {l.id ? String(l.id).slice(0, 8) + '...' : `#${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(cardId, `${l.action}\n${detailsText}\n${l.created_at}`)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    {copiedId === cardId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* DESKTOP TABLE VIEW (Visible on tablet/desktop screens sm+)      */}
      {/* ============================================================== */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-black border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 w-48">Action</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5 w-44 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00b074] mb-2" />
                    Loading audit log records from database...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                    No audit log entries to display.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l, idx) => {
                  const rowId = l.id || `row-${idx}`;
                  const detailsText = l.details || '';
                  return (
                    <tr key={rowId} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-black uppercase rounded-lg border ring-1 ${getActionBadgeStyle(
                            l.action
                          )}`}
                        >
                          {l.action}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-800 align-top">
                        <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs max-w-2xl break-words">
                          {detailsText}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-400 align-top whitespace-nowrap font-medium text-[11px]">
                        {formatTimestamp(l.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
