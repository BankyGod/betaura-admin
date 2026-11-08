import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminApi } from '../api/endpoints';

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadFixtures() {
    try {
      setLoading(true);
      const res = await adminApi.getFixtures({ limit: 30 });
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
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Fixtures & Live Odds</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live & upcoming matches fetched from https://betaura-api.onrender.com
          </p>
        </div>
        <button
          type="button"
          onClick={loadFixtures}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-4 py-2 text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">League</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Fixture ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fixtures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Loading fixtures from BetAura API...' : 'No fixtures loaded yet.'}
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

