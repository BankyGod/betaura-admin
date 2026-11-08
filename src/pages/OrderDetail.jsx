import { useState } from 'react';
import { Search, CheckCircle2, Clock } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { formatCurrency } from '../utils/formatters';

export default function OrderDetail() {
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify(e) {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.verifyTicket(code.trim());
      setTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ticket not found on BetAura API.');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Ticket Detail & Verifier</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Inspect any BetAura bet slip by Ticket ID or Official Verification Code (GHY...)
        </p>
      </div>

      <form
        onSubmit={handleVerify}
        className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-wrap gap-3"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter Ticket Number (e.g. BA-...) or Verification Code (GHY...)"
          className="flex-1 min-w-[240px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#00b074] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-5 py-2.5 text-sm font-bold transition disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Searching...' : 'Inspect Ticket'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {ticket && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-4">
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
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                ticket.status === 'WON'
                  ? 'bg-[#d9f3ea] text-[#00b074]'
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
                    <span className="font-semibold text-[#00b074]">{sel.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

