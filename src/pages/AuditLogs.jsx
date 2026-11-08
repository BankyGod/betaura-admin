import { useEffect, useState } from 'react';
import { adminApi } from '../api/endpoints';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getAuditLogs();
        if (Array.isArray(res.data)) setLogs(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Sign in with an Admin/Compliance role token to view live audit logs.');
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Compliance & Admin Audit Logs</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Tamper-evident regulatory and trading audit trail from /api/v1/admin/audit-logs
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-700 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xs border border-gray-50 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Details</th>
              <th className="px-5 py-3.5">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                  No audit log entries to display.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-3.5 font-bold text-[#00b074]">{l.action}</td>
                  <td className="px-5 py-3.5 text-gray-700">{l.details}</td>
                  <td className="px-5 py-3.5 text-gray-400">{l.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

