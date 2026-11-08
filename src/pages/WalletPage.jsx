import { useState } from 'react';
import BalanceCard from '../components/dashboard/BalanceCard';
import RecentPayments from '../components/dashboard/RecentPayments';
import { useDashboardData } from '../hooks/useDashboardData';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function WalletPage() {
  const { admin, setConnectModalOpen } = useAuth();
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );
  const connectedAcc = admin?.connectedBetauraAccount;
  const { data, refresh } = useDashboardData();
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '200',
    provider: 'MTN_MOMO',
    destination_account: connectedAcc?.phone_number || '+233540000001',
  });
  const [topupAmount, setTopupAmount] = useState('500');
  const [txId, setTxId] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!connectedAcc) {
      setConnectModalOpen(true);
      return;
    }
    try {
      setBusy(true);
      setMsg('Submitting withdrawal to BetAura API...');
      const res = await adminApi.requestWithdrawal({
        amount: Number(withdrawForm.amount),
        provider: withdrawForm.provider,
        destination_account: withdrawForm.destination_account,
      });
      setMsg(
        `Withdrawal ${res.data.status}: Ref ${res.data.reference} (${formatCurrency(
          Math.abs(res.data.amount)
        )})`
      );
      await refresh();
    } catch (err) {
      setMsg(
        `Error: ${
          err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleTopup(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setMsg('Crediting wallet via /api/v1/wallet/deposit/demo-topup...');
      const res = await adminApi.demoTopup({
        amount: Number(topupAmount),
        provider: 'MTN_MOMO',
      });
      setMsg(`Wallet credited! New Balance: ${formatCurrency(res.data.balance)}`);
      await refresh();
    } catch (err) {
      setMsg(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveWithdrawal(e) {
    e.preventDefault();
    if (!txId.trim()) return;
    try {
      setBusy(true);
      const res = await adminApi.approveWithdrawal(txId.trim());
      setMsg(`Approved: ${res.data.status} (Ref: ${res.data.reference})`);
      await refresh();
    } catch (err) {
      setMsg(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Wallet, Deposits & Withdrawals
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Live ACID wallet ledger wired to /api/v1/wallet/* & /api/v1/admin/finance/*
        </p>
      </div>

      {msg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#00b074] px-4 py-3 text-xs font-bold">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <BalanceCard
            totalBalance={data.totalBalance}
            todayGain={data.todayGain}
            label={isSuperAdmin ? 'Total Balance' : 'Total Referral Earnings'}
            subLabel={isSuperAdmin ? 'Today' : 'Referral Bonus Today'}
          />

          {/* Request Withdrawal (/api/v1/wallet/withdraw) */}
          <form
            onSubmit={handleWithdraw}
            className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3"
          >
            <h3 className="text-sm font-bold text-gray-900">
              Withdraw Funds (/api/v1/wallet/withdraw)
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                step="0.01"
                placeholder="Amount (GH₵)"
                value={withdrawForm.amount}
                onChange={(e) =>
                  setWithdrawForm({ ...withdrawForm, amount: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
              <select
                value={withdrawForm.provider}
                onChange={(e) =>
                  setWithdrawForm({ ...withdrawForm, provider: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              >
                <option value="MTN_MOMO">MTN MoMo</option>
                <option value="TELECEL_CASH">Telecel Cash</option>
                <option value="AT_MONEY">AT Money</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Destination Mobile Number"
              value={withdrawForm.destination_account}
              onChange={(e) =>
                setWithdrawForm({
                  ...withdrawForm,
                  destination_account: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#00b074] text-white py-2.5 text-xs font-bold hover:bg-[#0a873c] transition disabled:opacity-50"
            >
              Initiate Withdrawal
            </button>
          </form>

          {/* Mobile Money Telco Auto-Settlement Gateway (Coming Soon) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Direct Telco Mobile Money Gateway (MTN / Telecel / AT)
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Automated USSD push & instant telco merchant settlement integration is coming soon.
            </p>
          </div>

          {/* High-Value Withdrawal Release (/api/v1/admin/finance/withdrawals/{id}/approve) */}
          <form
            onSubmit={handleApproveWithdrawal}
            className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3"
          >
            <h3 className="text-sm font-bold text-gray-900">
              Approve High-Value Withdrawal (&gt; GH₵ 2,000)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Transaction UUID"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[#00b074] text-white px-4 py-2 text-xs font-bold shrink-0"
              >
                Approve
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100">
          <RecentPayments
            payments={data.recentPayments}
            title={isSuperAdmin ? 'Recent Payments' : 'Recent Referral Commissions'}
          />
        </div>
      </div>
    </div>
  );
}
