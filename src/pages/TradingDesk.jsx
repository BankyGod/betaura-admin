import { useState } from 'react';
import { adminApi } from '../api/endpoints';

export default function TradingDesk() {
  const [suspendForm, setSuspendForm] = useState({
    fixture_id: '',
    market_name: '1X2',
    reason: 'Trader adjustment',
  });
  const [oddsForm, setOddsForm] = useState({
    fixture_id: '',
    market_name: '1X2',
    outcome_name: 'Home',
    new_odds: '2.10',
    reason: 'Risk balance',
  });
  const [settleForm, setSettleForm] = useState({
    fixture_id: '',
    final_home_score: 0,
    final_away_score: 0,
    is_abandoned: false,
  });
  const [statusMsg, setStatusMsg] = useState('');

  async function handleSuspend(action) {
    try {
      setStatusMsg('Processing...');
      const fn =
        action === 'suspend' ? adminApi.suspendMarket : adminApi.unsuspendMarket;
      const res = await fn(suspendForm);
      setStatusMsg(`Success: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setStatusMsg(`Error: ${err.response?.data?.detail || err.message}`);
    }
  }

  async function handleOverrideOdds(e) {
    e.preventDefault();
    try {
      setStatusMsg('Overriding odds...');
      const res = await adminApi.overrideOdds({
        ...oddsForm,
        new_odds: parseFloat(oddsForm.new_odds),
      });
      setStatusMsg(`Odds updated: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setStatusMsg(`Error: ${err.response?.data?.detail || err.message}`);
    }
  }

  async function handleSettle(e) {
    e.preventDefault();
    try {
      setStatusMsg('Settling match...');
      const res = await adminApi.settleMatch({
        ...settleForm,
        final_home_score: Number(settleForm.final_home_score),
        final_away_score: Number(settleForm.final_away_score),
      });
      setStatusMsg(`Settled: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setStatusMsg(`Error: ${err.response?.data?.detail || err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Trading Console & Settlement</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Suspend markets, override live odds, and trigger match settlement on BetAura API
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#00b074] px-4 py-3 text-xs font-bold">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Suspension */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3">
          <h3 className="text-base font-bold text-gray-900">Market Suspension</h3>
          <input
            type="text"
            placeholder="Fixture ID"
            value={suspendForm.fixture_id}
            onChange={(e) => setSuspendForm({ ...suspendForm, fixture_id: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <input
            type="text"
            placeholder="Market Name (e.g. 1X2)"
            value={suspendForm.market_name}
            onChange={(e) => setSuspendForm({ ...suspendForm, market_name: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleSuspend('suspend')}
              className="flex-1 rounded-xl bg-[#ff5b5b] text-white py-2 text-xs font-bold"
            >
              Suspend
            </button>
            <button
              type="button"
              onClick={() => handleSuspend('unsuspend')}
              className="flex-1 rounded-xl bg-[#00b074] text-white py-2 text-xs font-bold"
            >
              Unsuspend
            </button>
          </div>
        </div>

        {/* Override Odds */}
        <form
          onSubmit={handleOverrideOdds}
          className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3"
        >
          <h3 className="text-base font-bold text-gray-900">Emergency Odds Override</h3>
          <input
            type="text"
            placeholder="Fixture ID"
            value={oddsForm.fixture_id}
            onChange={(e) => setOddsForm({ ...oddsForm, fixture_id: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Market (1X2)"
              value={oddsForm.market_name}
              onChange={(e) => setOddsForm({ ...oddsForm, market_name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Outcome (Home)"
              value={oddsForm.outcome_name}
              onChange={(e) => setOddsForm({ ...oddsForm, outcome_name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>
          <input
            type="number"
            step="0.01"
            placeholder="New Odds"
            value={oddsForm.new_odds}
            onChange={(e) => setOddsForm({ ...oddsForm, new_odds: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2d9cdb] text-white py-2 text-xs font-bold"
          >
            Broadcast New Odds
          </button>
        </form>

        {/* Settle Match */}
        <form
          onSubmit={handleSettle}
          className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3"
        >
          <h3 className="text-base font-bold text-gray-900">Settle Match</h3>
          <input
            type="text"
            placeholder="Fixture ID"
            value={settleForm.fixture_id}
            onChange={(e) => setSettleForm({ ...settleForm, fixture_id: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Home Score"
              value={settleForm.final_home_score}
              onChange={(e) =>
                setSettleForm({ ...settleForm, final_home_score: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
            <input
              type="number"
              placeholder="Away Score"
              value={settleForm.final_away_score}
              onChange={(e) =>
                setSettleForm({ ...settleForm, final_away_score: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#00b074] text-white py-2 text-xs font-bold"
          >
            Grade & Settle Tickets
          </button>
        </form>
      </div>
    </div>
  );
}

