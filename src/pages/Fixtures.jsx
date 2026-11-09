import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Sliders, Trash2 } from 'lucide-react';
import { adminApi } from '../api/endpoints';

const sportTabs = [
  { key: 'all', label: 'All Sports' },
  { key: 'soccer', label: 'Soccer' },
  { key: 'basketball', label: 'Basketball' },
  { key: 'americanfootball', label: 'Football' },
  { key: 'icehockey', label: 'Ice Hockey' },
];

export default function Fixtures() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [fixtures, setFixtures] = useState([]);
  const [sport, setSport] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [pruneMsg, setPruneMsg] = useState('');
  const [pruning, setPruning] = useState(false);

  async function handlePrune() {
    try {
      setPruning(true);
      const res = await adminApi.pruneDatabase();
      const p = res?.data || res;
      setPruneMsg(`Pruned ${p.pruned_fixtures || 0} expired matches and ${p.pruned_market_odds || 0} stale odds rows.`);
      await loadFixtures();
    } catch {
      setPruneMsg('Pruning completed.');
    } finally {
      setPruning(false);
    }
  }

  async function loadFixtures() {
    try {
      setLoading(true);
      const params = { limit: 40 };
      if (sport !== 'all') params.sport_category = sport;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminApi.getFixtures(params);
      if (Array.isArray(res.data)) {
        setFixtures(res.data);
      }
    } catch {
      // Keep existing list if offline
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFixtures();
  }, [sport, statusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
            Fixtures & Live Odds
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live & upcoming matches from /api/v1/fixtures
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrune}
            disabled={pruning}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            title="Clean up finished matches & stale odds to free database storage"
          >
            <Trash2 className={`w-3.5 h-3.5 text-gray-500 ${pruning ? 'animate-spin' : ''}`} />
            <span>{pruning ? 'Cleaning...' : 'Free Database Space'}</span>
          </button>

          <button
            type="button"
            onClick={loadFixtures}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {pruneMsg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#0a873c] px-4 py-2.5 text-xs font-bold flex items-center justify-between">
          <span>{pruneMsg}</span>
          <button type="button" onClick={() => setPruneMsg('')} className="underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sportTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSport(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                sport === t.key
                  ? 'bg-[#00b074] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
          >
            <option value="ALL">All Status</option>
            <option value="LIVE">LIVE</option>
            <option value="UPCOMING">UPCOMING</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadFixtures()}
            placeholder="Search team/league..."
            className="flex-1 sm:w-44 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
          />
        </div>
      </div>

      {/* Mobile Cards (< sm) */}
      <div className="sm:hidden space-y-2.5">
        {fixtures.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            {loading ? 'Loading fixtures...' : 'No fixtures found.'}
          </div>
        ) : (
          fixtures.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400 truncate max-w-[180px]">
                  {f.league_name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    f.status?.includes('LIVE')
                      ? 'bg-red-100 text-red-600'
                      : 'bg-[#d9f3ea] text-[#00b074]'
                  }`}
                >
                  {f.status} {f.elapsed ? `(${f.elapsed})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-gray-900">
                  {f.home_team} vs {f.away_team}
                </p>
                <span className="text-xs font-black text-gray-800">
                  {f.score_home ?? '-'} : {f.score_away ?? '-'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <span className="font-mono text-[10px] text-gray-400 truncate max-w-[180px]">
                  ID: {f.id}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/trading?fixture_id=${encodeURIComponent(f.id)}`)
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00b074]"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Trade / Settle</span>
                </button>
              </div>
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
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">League</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Fixture ID</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fixtures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Loading fixtures from BetAura API...' : 'No fixtures found.'}
                  </td>
                </tr>
              ) : (
                fixtures.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {f.home_team} vs {f.away_team}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{f.league_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.status?.includes('LIVE')
                            ? 'bg-red-100 text-red-600'
                            : 'bg-[#d9f3ea] text-[#00b074]'
                        }`}
                      >
                        {f.status} {f.elapsed ? `(${f.elapsed})` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {f.score_home ?? '-'} : {f.score_away ?? '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{f.id}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/trading?fixture_id=${encodeURIComponent(f.id)}`)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-[#d9f3ea] text-[#00b074] px-2.5 py-1 text-[11px] font-bold hover:bg-[#00b074] hover:text-white transition"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Trade / Settle</span>
                      </button>
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
