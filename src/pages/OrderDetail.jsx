import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, Clock, Ticket, Sparkles } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function OrderDetail() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const { admin, hasPermission, setConnectModalOpen } = useAuth();
  const canOverride = hasPermission('override_tickets');
  const connectedAcc = admin?.connectedBetauraAccount;

  const [code, setCode] = useState(initialCode);
  const [bookingCode, setBookingCode] = useState('');
  const [ticket, setTicket] = useState(null);
  const [bookedSlip, setBookedSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overrideMsg, setOverrideMsg] = useState('');

  async function verifyCodeNow(targetCode) {
    if (!targetCode.trim()) return;
    try {
      setLoading(true);
      setError('');
      setBookedSlip(null);
      const res = await adminApi.verifyTicket(targetCode.trim());
      setTicket(res.data);
    } catch (err) {
      // Check local orders state if not yet synced to remote
      try {
        const localOrders = JSON.parse(
          localStorage.getItem('betaura_admin_orders_state') || '[]'
        );
        const foundLocal = localOrders.find(
          (o) => o.id?.toLowerCase() === targetCode.trim().toLowerCase()
        );
        if (foundLocal) {
          setTicket({
            ticket_number: foundLocal.id,
            ticket_owner: foundLocal.player,
            stake: foundLocal.stake,
            total_odds: foundLocal.total_odds || 5.0,
            potential_payout: foundLocal.payout,
            settled_payout: foundLocal.status === 'WON' ? foundLocal.payout : 0,
            status: foundLocal.status,
            verification_code: `GHY${foundLocal.id.replace(/[^A-Z0-9]/gi, '')}892A`,
            selections: foundLocal.selections || [],
          });
          return;
        }
      } catch {
        // ignore
      }
      setError(err.response?.data?.detail || 'Ticket not found on BetAura API.');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode) {
      verifyCodeNow(initialCode);
    }
  }, [initialCode]);

  async function handleVerify(e) {
    e.preventDefault();
    await verifyCodeNow(code);
  }

  async function handleLoadBooking(e) {
    e.preventDefault();
    if (!bookingCode.trim()) return;
    try {
      setLoading(true);
      setError('');
      setTicket(null);
      const res = await adminApi.loadBookingCode(bookingCode.trim());
      setBookedSlip(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking code expired or invalid.');
      setBookedSlip(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleFlipTicketToWon() {
    if (!ticket || !canOverride) return;
    if (!connectedAcc) {
      setConnectModalOpen(true);
      return;
    }
    try {
      setLoading(true);
      setOverrideMsg('Updating lost/pending ticket to WON...');
      const payoutVal =
        Number(ticket.potential_payout) ||
        Number(ticket.stake || 100) * Number(ticket.total_odds || 2);

      let wonRes = null;
      try {
        wonRes = await adminApi.markTicketWon(ticket.ticket_number, {
          status: 'WON',
        });
      } catch {
        await adminApi.syncTicket({
          ticket_number: ticket.ticket_number,
          stake: Number(ticket.stake || 100),
          total_odds: Number(ticket.total_odds || 2),
          potential_payout: payoutVal,
          settled_payout: payoutVal,
          status: 'WON',
          selections: (ticket.selections || []).map((s) => ({
            ...s,
            status: 'WON',
            match_status: 'FT',
          })),
        });
      }

      const corrections = wonRes?.data?.corrected_selections || [];
      const updatedSelections = (ticket.selections || []).map((s) => {
        const fix = corrections.find(
          (c) =>
            c.fixture_id === s.fixture_id &&
            (c.from || '').toLowerCase() === (s.outcome_name || '').toLowerCase()
        );
        return {
          ...s,
          ...(fix ? { outcome_name: fix.to, odds_at_stake: fix.new_odds } : {}),
          status: 'WON',
        };
      });
      const finalPayout = Number(wonRes?.data?.settled_payout) || payoutVal;
      setTicket({
        ...ticket,
        status: 'WON',
        settled_payout: finalPayout,
        ...(wonRes?.data?.total_odds
          ? { total_odds: wonRes.data.total_odds, potential_payout: finalPayout }
          : {}),
        selections: updatedSelections,
      });

      // Also update in local orders list
      try {
        const localOrders = JSON.parse(
          localStorage.getItem('betaura_admin_orders_state') || '[]'
        );
        const updatedList = localOrders.map((o) =>
          o.id === ticket.ticket_number ? { ...o, status: 'WON' } : o
        );
        localStorage.setItem(
          'betaura_admin_orders_state',
          JSON.stringify(updatedList)
        );
      } catch {
        // ignore
      }

      setOverrideMsg(
        `Ticket #${ticket.ticket_number} has been updated to WON with settled payout ${formatCurrency(
          payoutVal
        )}!`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Ticket Verifier, Booking Loader & WON Override
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Inspect any BetAura ticket or booking code and update lost tickets to WON
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Verify Ticket Form */}
        <form
          onSubmit={handleVerify}
          className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3"
        >
          <h3 className="text-sm font-bold text-gray-900">
            Verify Placed Ticket (/api/v1/bets/verify)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ticket ID (BA-...) or Code (GHY...)"
              className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#00b074] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-4 py-2 text-xs font-bold transition disabled:opacity-50 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </div>
        </form>

        {/* Load Booking Code Form */}
        <form
          onSubmit={handleLoadBooking}
          className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3"
        >
          <h3 className="text-sm font-bold text-gray-900">
            Load Booking Code (/api/v1/bets/book/&#123;code&#125;)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="6-Char Booking Code (e.g. BA7F8D)"
              className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-[#2d9cdb] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d9cdb] text-white px-4 py-2 text-xs font-bold transition disabled:opacity-50 shrink-0"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Load Code</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {overrideMsg && (
        <div className="rounded-xl bg-[#d9f3ea] border border-[#00b074]/20 p-4 text-xs font-bold text-[#0a873c]">
          {overrideMsg}
        </div>
      )}

      {ticket && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs text-gray-400">Ticket #{ticket.ticket_number}</p>
              <h3 className="text-lg font-extrabold text-gray-900">
                Owner: {ticket.ticket_owner || 'Player'}
              </h3>
              {ticket.verification_code && (
                <p className="text-xs text-[#00b074] font-semibold mt-0.5">
                  Official Code: {ticket.verification_code}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                  ticket.status === 'WON'
                    ? 'bg-[#d9f3ea] text-[#00b074]'
                    : ticket.status === 'LOST'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {ticket.status === 'WON' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {ticket.status}
              </span>

              {ticket.status !== 'WON' && canOverride && (
                <button
                  type="button"
                  onClick={handleFlipTicketToWon}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-4 py-2 text-xs font-extrabold shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Update Lost Ticket to WON</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Stake</p>
              <p className="font-bold text-gray-900">{formatCurrency(ticket.stake)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Odds</p>
              <p className="font-bold text-gray-900">{Number(ticket.total_odds).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Potential Payout</p>
              <p className="font-bold text-[#00b074]">
                {formatCurrency(ticket.potential_payout)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Settled Payout</p>
              <p className="font-bold text-gray-900">
                {formatCurrency(ticket.settled_payout)}
              </p>
            </div>
          </div>

          {ticket.selections?.length > 0 && (
            <div className="divide-y divide-gray-100 pt-2">
              {ticket.selections.map((sel, i) => (
                <div key={sel.id || i} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">
                      {sel.home_team || 'Home'} vs {sel.away_team || 'Away'}
                    </p>
                    <p className="text-gray-500">
                      {sel.market_name}: <strong className="text-gray-800">{sel.outcome_name}</strong> @{' '}
                      {sel.odds_at_stake}
                    </p>
                  </div>
                  <div className="text-right">
                    {sel.match_result && (
                      <p className="font-bold text-gray-800">{sel.match_result}</p>
                    )}
                    <span
                      className={`font-bold ${
                        sel.status === 'WON' ? 'text-[#00b074]' : 'text-red-500'
                      }`}
                    >
                      {sel.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {bookedSlip && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Booking Code: {bookedSlip.code}
              </h3>
              <p className="text-xs text-gray-400">
                Combined Odds: {bookedSlip.total_odds}
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {bookedSlip.legs?.map((leg, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900">Fixture: {leg.fixture_id}</p>
                  <p className="text-gray-500">
                    {leg.market_name} — {leg.outcome_name}
                  </p>
                </div>
                <span className="font-extrabold text-[#00b074]">{leg.current_odds}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
