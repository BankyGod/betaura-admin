import { useState } from 'react';
import BalanceCard from '../components/dashboard/BalanceCard';
import RecentPayments from '../components/dashboard/RecentPayments';
import { useDashboardData } from '../hooks/useDashboardData';
import { adminApi } from '../api/endpoints';

export default function WalletPage() {
  const { data } = useDashboardData();
  const [txId, setTxId] = useState('');
  const [msg, setMsg] = useState('');

  async function handleApproveWithdrawal(e) {
    e.preventDefault();
    if (!txId.trim()) return;
    try {
      const res = await adminApi.approveWithdrawal(txId.trim());
      setMsg(`Approved: ${JSON.stringify(res.data)}`);
    } catch (err) {
      setMsg(`Error: ${err.response?.data?.detail || err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Wallet, Deposits & Withdrawals</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage platform balance, recent player payments, and high-value withdrawal approvals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <BalanceCard
            totalBalance={data.totalBalance}
            todayGain={data.todayGain}
          />

          <form
            onSubmit={handleApproveWithdrawal}
            className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 space-y-3"
          >
            <h3 className="text-base font-bold text-gray-900">
              Approve High-Value Withdrawal (&gt; GH₵ 2,000)
            </h3>
            <input
              type="text"
              placeholder="Transaction UUID"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#00b074] text-white px-4 py-2 text-xs font-bold"
            >
              Release Withdrawal
            </button>
            {msg && <p className="text-xs font-semibold text-gray-600 pt-1">{msg}</p>}
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50">
          <RecentPayments payments={data.recentPayments} />
        </div>
      </div>
    </div>
  );
}

