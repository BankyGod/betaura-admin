import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle2, Search } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const statusFilters = ['ALL', 'LOST', 'PENDING', 'ONGOING', 'WON', 'CASHED_OUT'];

export default function Orders() {
  const navigate = useNavigate();
  const { admin, hasPermission, setConnectModalOpen } = useAuth();
  const canOverride = hasPermission('override_tickets');
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );
  const connectedAcc = admin?.connectedBetauraAccount;

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [manualTicketId, setManualTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true);
      // Clear legacy hardcoded demo state
      localStorage.removeItem('betaura_admin_orders_state');

      const customSaved = JSON.parse(
        localStorage.getItem('betaura_admin_custom_tickets') || '[]'
      );

      let backendBets = [];
      if (!isSuperAdmin) {
        // Sub-Admin: only load slips from their connected BetAura account
        if (connectedAcc) {
          const myRes = await adminApi.getMyBets();
          if (Array.isArray(myRes.data)) {
            backendBets = myRes.data.map((b) => ({
              id: b.ticket_number,
              bet_uuid: b.id,
              verification_code: b.verification_code,
              player: connectedAcc.username || connectedAcc.phone_number || b.ticket_owner || 'My BetAura Account',
              legs: b.selections?.length || 1,
              stake: Number(b.stake || 0),
              total_odds: Number(b.total_odds || 2.0),
              payout: Number(b.settled_payout || b.potential_payout || 0),
              status: b.status,
              time: b.created_at
                ? new Date(b.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Recent',
              selections: b.selections || [],
            }));
          }
        }
      } else {
        const [myRes, adminRes] = await Promise.allSettled([
          connectedAcc ? adminApi.getMyBets() : Promise.resolve(null),
          adminApi.getAdminBets(200),
        ]);
        const myBetsMapped =
          myRes.status === 'fulfilled' && Array.isArray(myRes.value?.data)
            ? myRes.value.data.map((b) => ({
                id: b.ticket_number,
                bet_uuid: b.id,
                verification_code: b.verification_code,
                player:
                  connectedAcc?.username ||
                  connectedAcc?.phone_number ||
                  b.ticket_owner ||
                  'Super Admin BetAura',
                legs: b.selections?.length || 1,
                stake: Number(b.stake || 0),
                total_odds: Number(b.total_odds || 2.0),
                payout: Number(b.settled_payout || b.potential_payout || 0),
                status: b.status,
                time: b.created_at
                  ? new Date(b.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Recent',
                selections: b.selections || [],
              }))
            : [];
        const allAdminBets =
          adminRes.status === 'fulfilled' && Array.isArray(adminRes.value?.data)
            ? adminRes.value.data
            : [];
        backendBets = [...myBetsMapped, ...allAdminBets];
      }

      const map = new Map();
      [...customSaved, ...backendBets].forEach((item) => {
        if (item?.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });
      setOrders(Array.from(map.values()));
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, connectedAcc]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  async function handleUpdateTicketToWon(e, ticket) {
    e?.stopPropagation?.();
    if (!canOverride) {
      setMsg('Your current role does not have permission to override ticket statuses.');
      return;
    }
    if (!connectedAcc) {
      setConnectModalOpen(true);
      return;
    }

    try {
      setMsg(`Updating ticket ${ticket.id} from ${ticket.status} to WON...`);

      setOrders((prev) =>
        prev.map((o) => (o.id === ticket.id ? { ...o, status: 'WON' } : o))
      );

      try {
        await adminApi.markTicketWon(ticket.id, {
          status: 'WON',
          settled_payout: ticket.payout,
        });
      } catch {
        await adminApi.syncTicket({
          ticket_number: ticket.id,
          stake: ticket.stake || 50,
          total_odds:
            ticket.total_odds ||
            Number(((ticket.payout || 100) / Math.max(1, ticket.stake || 50)).toFixed(2)),
          potential_payout: ticket.payout || 100,
          settled_payout: ticket.payout || 100,
          status: 'WON',
          selections:
            ticket.selections?.length > 0
              ? ticket.selections.map((s) => ({
                  ...s,
                  status: 'WON',
                  match_status: 'FINISHED',
                }))
              : [],
        });
      }

      setMsg(
        `Ticket ${ticket.id} (${ticket.player || 'Player'}) updated from ${ticket.status} → WON (${formatCurrency(
          ticket.payout
        )}) on backend!`
      );
      await fetchBets();
    } catch (err) {
      setMsg(
        `Ticket ${ticket.id} updated to WON (${
          err.response?.data?.detail || 'Synced'
        })`
      );
    }
  }

  async function handleManualOverrideSubmit(e) {
    e.preventDefault();
    const code = manualTicketId.trim();
    if (!code) return;
    try {
      setLoading(true);
      await adminApi.markTicketWon(code, { status: 'WON' });
      setManualTicketId('');
      setMsg(`Ticket ${code.toUpperCase()} updated to WON on the backend!`);
      await fetchBets();
    } catch {
      // Try verifying ticket first to get its details, then sync as WON
      try {
        const vRes = await adminApi.verifyTicket(code);
        if (vRes?.data) {
          const t = vRes.data;
          await handleUpdateTicketToWon(null, {
            id: t.ticket_number,
            player: t.ticket_owner,
            stake: Number(t.stake),
            total_odds: Number(t.total_odds),
            payout: Number(t.potential_payout),
            status: t.status,
            selections: t.selections,
          });
          setManualTicketId('');
          return;
        }
      } catch {
        // ignore
      }
      navigate(`/order-detail?code=${encodeURIComponent(code)}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders =
    statusFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
            Bet Tickets & Result Override
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live backend bet tickets ({orders.length} total) — update any LOST / PENDING ticket directly to WON
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBets}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/order-detail')}
            className="rounded-xl bg-[#00b074] text-white px-3.5 py-2 text-xs font-bold shrink-0"
          >
            Verify Code
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#0a873c] px-4 py-3 text-xs font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button
            type="button"
            onClick={() => setMsg('')}
            className="underline ml-2"
          >
            Close
          </button>
        </div>
      )}

      {/* Quick Override by Ticket ID / Verification Code */}
      {canOverride && (
        <form
          onSubmit={handleManualOverrideSubmit}
          className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex flex-wrap items-center gap-2.5"
        >
          <div className="flex-1 min-w-[200px] flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Enter any Ticket ID (BA-...) or Verification Code (GHY...) to mark WON..."
              className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-4 py-2 text-xs font-extrabold transition shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Update Ticket → WON</span>
          </button>
        </form>
      )}

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              statusFilter === st
                ? 'bg-[#00b074] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Mobile App Card List (< sm) */}
      <div className="sm:hidden space-y-2.5">
        {loading && filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            Loading bet tickets from backend...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            No bet tickets found for {statusFilter}.
          </div>
        ) : (
          filteredOrders.map((o) => (
            <div
              key={o.id}
              onClick={() => navigate(`/order-detail?code=${encodeURIComponent(o.id)}`)}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-2.5 active:scale-[0.99] transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-900">{o.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'WON'
                          ? 'bg-[#d9f3ea] text-[#00b074]'
                          : o.status === 'LOST'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-50 text-[#2d9cdb]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">
                    {o.player} • {o.legs} Legs
                  </p>
                  <p className="text-[11px] text-gray-400">{o.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Stake: {formatCurrency(o.stake)}</p>
                  <p className="text-sm font-extrabold text-[#00b074]">
                    {formatCurrency(o.payout)}
                  </p>
                </div>
              </div>

              {o.status !== 'WON' && canOverride && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleUpdateTicketToWon(e, o)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] text-white px-3 py-1.5 text-[11px] font-extrabold shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Update Lost Ticket → WON</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (sm+) */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-xs border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Player</th>
                <th className="px-5 py-3.5">Selections</th>
                <th className="px-5 py-3.5">Stake</th>
                <th className="px-5 py-3.5">Payout</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Loading bet tickets from the BetAura backend...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    No bet tickets found for {statusFilter}.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/order-detail?code=${encodeURIComponent(o.id)}`)}
                    className="hover:bg-gray-50/60 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-bold text-gray-900">{o.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{o.player}</td>
                    <td className="px-5 py-3.5 text-gray-500">{o.legs} Legs</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {formatCurrency(o.stake)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#00b074]">
                      {formatCurrency(o.payout)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{o.time}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.status === 'WON'
                            ? 'bg-[#d9f3ea] text-[#00b074]'
                            : o.status === 'LOST'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-50 text-[#2d9cdb]'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {o.status !== 'WON' && canOverride ? (
                        <button
                          type="button"
                          onClick={(e) => handleUpdateTicketToWon(e, o)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#00b074] hover:bg-[#0a873c] text-white px-3 py-1.5 text-[11px] font-bold transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Update to WON</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-[#00b074]">
                          ✓ Settled WON
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
