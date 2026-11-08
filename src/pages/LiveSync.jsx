import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminApi } from '../api/endpoints';

export default function LiveSync() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function runSync(fn, label) {
    try {
      setLoading(true);
      setStatus(`Running ${label}...`);
      const res = await fn();
      setStatus(`${label} completed: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Live Feed & ESPN Sync</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Trigger real-time in-play and upcoming fixture synchronization on https://betaura-api.onrender.com
        </p>
      </div>

      {status && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#00b074] p-4 text-xs font-bold">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3">
          <h3 className="text-base font-bold text-gray-900">Sync Live In-Play</h3>
          <p className="text-xs text-gray-500">
            Tick live match scores, clocks, and dynamic odds across active matches.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => runSync(adminApi.syncLiveFixtures, 'Live In-Play Sync')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00b074] text-white px-4 py-2 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Now</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3">
          <h3 className="text-base font-bold text-gray-900">Sync Upcoming Matches</h3>
          <p className="text-xs text-gray-500">
            Pull upcoming soccer & multi-sport schedules and normalize league logos.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => runSync(adminApi.syncUpcomingFixtures, 'Upcoming Sync')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2d9cdb] text-white px-4 py-2 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Upcoming</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3">
          <h3 className="text-base font-bold text-gray-900">Full Multi-Sport Ingestion</h3>
          <p className="text-xs text-gray-500">
            Ingest global ESPN schedules for the next 5 days and flush Redis fixture caches.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => runSync(adminApi.syncAllFixtures, 'Full Multi-Sport Sync')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff5b5b] text-white px-4 py-2 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ingest All Sports</span>
          </button>
        </div>
      </div>
    </div>
  );
}

