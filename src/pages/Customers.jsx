import { useState } from 'react';
import { adminApi } from '../api/endpoints';

const sampleCustomers = [
  { id: '1', name: 'Kwame Mensah', phone: '+233 54 123 4567', tier: 2, status: 'KYC_APPROVED', referred: 14 },
  { id: '2', name: 'Abena Darko', phone: '+233 24 987 6543', tier: 2, status: 'KYC_APPROVED', referred: 23 },
  { id: '3', name: 'Prince Boateng', phone: '+233 50 321 7890', tier: 1, status: 'VERIFIED', referred: 19 },
  { id: '4', name: 'Ama Serwaa', phone: '+233 55 654 3210', tier: 2, status: 'KYC_APPROVED', referred: 16 },
  { id: '5', name: 'David Okrah', phone: '+233 20 777 8899', tier: 1, status: 'VERIFIED', referred: 15 },
];

export default function Customers() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Customers & Players</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Registered BetAura players, KYC verification tiers, and referral activity
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-50 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Player Name</th>
              <th className="px-5 py-3.5">Phone Number</th>
              <th className="px-5 py-3.5">KYC Tier</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Referrals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sampleCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3.5 font-bold text-gray-900">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.phone}</td>
                <td className="px-5 py-3.5 font-semibold">Tier {c.tier}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-[#d9f3ea] text-[#00b074] text-[10px] font-bold">
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-gray-800">{c.referred}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CustomerDetail() {
  const [userId, setUserId] = useState('');
  const [msg, setMsg] = useState('');

  async function handleApproveKyc(e) {
    e.preventDefault();
    if (!userId.trim()) return;
    try {
      const res = await adminApi.approveKyc(userId.trim());
      setMsg(`KYC Approved: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setMsg(`Error: ${err.response?.data?.detail || err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">KYC & Player Verification Desk</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Approve Tier-2 National ID (Ghana Card / Passport) verification for player withdrawals
        </p>
      </div>

      <form
        onSubmit={handleApproveKyc}
        className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 max-w-lg space-y-4"
      >
        <h3 className="text-base font-bold text-gray-900">Manual Tier-2 KYC Approval</h3>
        <input
          type="text"
          placeholder="Enter Player User UUID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#00b074] text-white px-5 py-2.5 text-xs font-bold"
        >
          Approve Tier-2 KYC
        </button>
        {msg && <p className="text-xs font-semibold text-gray-600">{msg}</p>}
      </form>
    </div>
  );
}

