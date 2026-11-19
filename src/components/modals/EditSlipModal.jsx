import { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Save,
  Sparkles,
  Trophy,
  Calculator,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/formatters';

const SLIP_STATUS_OPTIONS = ['WON', 'LOST', 'PENDING', 'VOIDED', 'CANCELLED'];
const LEG_STATUS_OPTIONS = ['WON', 'LOST', 'VOIDED', 'PENDING'];

export default function EditSlipModal({
  isOpen,
  onClose,
  ticket,
  onSaved,
}) {
  const [overallStatus, setOverallStatus] = useState('WON');
  const [stake, setStake] = useState(10);
  const [totalOdds, setTotalOdds] = useState(2.0);
  const [settledPayout, setSettledPayout] = useState(0);
  const [potentialPayout, setPotentialPayout] = useState(0);
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (ticket) {
      setOverallStatus(ticket.status || 'WON');
      setStake(Number(ticket.stake || 10));
      setTotalOdds(Number(ticket.total_odds || 2.0));
      setPotentialPayout(Number(ticket.potential_payout || ticket.payout || 0));
      setSettledPayout(Number(ticket.settled_payout || ticket.payout || 0));

      const rawSelections = ticket.selections || [];
      setLegs(
        rawSelections.map((s, idx) => {
          let sHome = s.score_home;
          let sAway = s.score_away;
          if ((sHome === undefined || sHome === null) && s.match_result) {
            const parts = String(s.match_result).split('-');
            if (parts.length === 2) {
              sHome = parseInt(parts[0].trim(), 10) || 0;
              sAway = parseInt(parts[1].trim(), 10) || 0;
            }
          }
          return {
            id: s.id || `leg-${idx}`,
            fixture_id: s.fixture_id,
            home_team: s.home_team || 'Home Team',
            away_team: s.away_team || 'Away Team',
            market_name: s.market_name || '1X2 Full Time',
            outcome_name: s.outcome_name || 'Home',
            status: s.status || 'WON',
            odds_at_stake: Number(s.odds_at_stake || 1.8),
            score_home: sHome !== undefined && sHome !== null ? Number(sHome) : 2,
            score_away: sAway !== undefined && sAway !== null ? Number(sAway) : 1,
          };
        })
      );
      setError('');
      setSuccessMsg('');
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  function updateLegField(index, field, value) {
    setLegs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function recalculateOddsAndPayout() {
    let combinedOdds = 1.0;
    legs.forEach((l) => {
      const o = Number(l.odds_at_stake) || 1.0;
      combinedOdds *= o;
    });
    const roundOdds = Math.round(combinedOdds * 100) / 100;
    setTotalOdds(roundOdds);
    const pot = Math.round(Number(stake) * roundOdds * 100) / 100;
    setPotentialPayout(pot);
    if (overallStatus === 'WON') {
      setSettledPayout(pot);
    }
  }

  function handleMakeAllLegsWon() {
    setOverallStatus('WON');
    setLegs((prev) =>
      prev.map((l) => {
        // Provide authentic winning score if 0-0
        let sh = Number(l.score_home || 0);
        let sa = Number(l.score_away || 0);
        if (sh === sa && sh === 0) {
          sh = 2;
          sa = 1;
        }
        return {
          ...l,
          status: 'WON',
          score_home: sh,
          score_away: sa,
        };
      })
    );
    const pot = Math.round(Number(stake) * Number(totalOdds) * 100) / 100;
    setSettledPayout(pot);
    setPotentialPayout(pot);
  }

  async function handleSaveSlip(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        status: overallStatus,
        stake: Number(stake),
        total_odds: Number(totalOdds),
        potential_payout: Number(potentialPayout),
        settled_payout: overallStatus === 'WON' ? Number(settledPayout || potentialPayout) : 0,
        legs: legs.map((l) => ({
          id: l.id,
          fixture_id: l.fixture_id,
          outcome_name: l.outcome_name,
          status: l.status,
          odds_at_stake: Number(l.odds_at_stake),
          score_home: Number(l.score_home),
          score_away: Number(l.score_away),
        })),
      };

      const ticketIdentifier = ticket.ticket_number || ticket.id;
      const res = await adminApi.editTicket(ticketIdentifier, payload);

      setSuccessMsg(
        `Slip #${ticketIdentifier} updated successfully! Match scores & outcomes saved.`
      );

      if (onSaved) {
        onSaved(res?.data?.ticket || {
          ...ticket,
          status: overallStatus,
          stake: Number(stake),
          total_odds: Number(totalOdds),
          payout: overallStatus === 'WON' ? Number(settledPayout) : 0,
          settled_payout: overallStatus === 'WON' ? Number(settledPayout) : 0,
          selections: legs.map((l) => ({
            ...l,
            match_result: `${l.score_home} - ${l.score_away}`,
          })),
        });
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update slip.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold">
                  Edit Completed Slip #{ticket.ticket_number || ticket.id}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  {ticket.player || ticket.ticket_owner || 'Player Slip'}
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Modify match scores, outcome picks, leg results &amp; payout
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSaveSlip} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#00b074] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick 1-Click Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#eaf7ef] border border-[#00b074]/20">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#00b074]" />
              <span className="text-xs font-bold text-gray-800">
                Quick 1-Click Settlement:
              </span>
            </div>
            <button
              type="button"
              onClick={handleMakeAllLegsWon}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Set All Legs to WON &amp; Recalculate</span>
            </button>
          </div>

          {/* Master Slip Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Slip Status
              </label>
              <select
                value={overallStatus}
                onChange={(e) => setOverallStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-extrabold bg-white text-gray-900"
              >
                {SLIP_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Stake (GH₵)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.10"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center justify-between">
                <span>Total Odds</span>
                <button
                  type="button"
                  onClick={recalculateOddsAndPayout}
                  title="Multiply leg odds"
                  className="text-[10px] text-[#00b074] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                >
                  <Calculator className="w-3 h-3" /> Auto
                </button>
              </label>
              <input
                type="number"
                step="0.01"
                min="1.00"
                value={totalOdds}
                onChange={(e) => setTotalOdds(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Settled Payout (GH₵)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settledPayout}
                onChange={(e) => setSettledPayout(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-extrabold text-[#00b074] bg-white"
              />
            </div>
          </div>

          {/* Individual Selections & Match Scores Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                Selections, Outcomes &amp; Final Scores ({legs.length})
              </h4>
              <span className="text-[11px] text-gray-400">
                Edit scores directly below to change match result
              </span>
            </div>

            <div className="space-y-3">
              {legs.map((leg, idx) => (
                <div
                  key={leg.id || idx}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3 hover:border-emerald-300 transition"
                >
                  {/* Fixture Match Title */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <p className="text-xs font-extrabold text-gray-900">
                      Leg #{idx + 1}: {leg.home_team} vs {leg.away_team}
                    </p>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700">
                      {leg.market_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Outcome Pick Name */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        Outcome Pick / Selection
                      </label>
                      <input
                        type="text"
                        value={leg.outcome_name}
                        onChange={(e) => updateLegField(idx, 'outcome_name', e.target.value)}
                        placeholder="e.g. Home, Draw, Over 2.5"
                        className="w-full rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>

                    {/* Odds */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        Odds
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={leg.odds_at_stake}
                        onChange={(e) => updateLegField(idx, 'odds_at_stake', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>

                    {/* Match Score (Home - Away) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        Match Score (Home - Away)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={leg.score_home}
                          onChange={(e) => updateLegField(idx, 'score_home', e.target.value)}
                          placeholder="Home"
                          title="Home Team Score"
                          className="w-12 text-center rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-bold"
                        />
                        <span className="text-xs font-bold text-gray-400">-</span>
                        <input
                          type="number"
                          min="0"
                          value={leg.score_away}
                          onChange={(e) => updateLegField(idx, 'score_away', e.target.value)}
                          placeholder="Away"
                          title="Away Team Score"
                          className="w-12 text-center rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-bold"
                        />
                        <span className="text-[10px] font-bold text-[#00b074] bg-[#eaf7ef] px-1.5 py-1 rounded-lg">
                          {leg.score_home} - {leg.score_away}
                        </span>
                      </div>
                    </div>

                    {/* Leg Status */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        Leg Outcome
                      </label>
                      <select
                        value={leg.status}
                        onChange={(e) => updateLegField(idx, 'status', e.target.value)}
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-extrabold ${
                          leg.status === 'WON'
                            ? 'bg-[#d9f3ea] text-[#00b074] border-[#00b074]/30'
                            : leg.status === 'LOST'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {LEG_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white text-xs font-extrabold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Slip & Update Scores'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
