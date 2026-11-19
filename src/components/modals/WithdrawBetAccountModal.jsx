import { useState } from 'react';
import { X, ArrowDownRight, DollarSign, ShieldAlert, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/formatters';

export default function WithdrawBetAccountModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}) {
  const connAcc = target?.connectedBetauraAccount || target?.connected_betaura_account;
  const targetPhone = connAcc?.phone_number || target?.phone_number || target?.phone || '';
  const currentBalance = Number(connAcc?.balance ?? target?.balance ?? 0);

  const [amount, setAmount] = useState('100');
  const [provider, setProvider] = useState('MTN_MOMO');
  const [destAccount, setDestAccount] = useState(targetPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !target) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (val > currentBalance) {
      setError(`Insufficient balance. Current available balance is ${formatCurrency(currentBalance)}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        sub_id: target.id,
        identifier: targetPhone,
        amount: val,
        provider,
        destination_account: destAccount.trim() || targetPhone,
      };
      const res = await adminApi.adminWithdraw(payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to process withdrawal.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Withdraw From Bet Account
              </h3>
              <p className="text-[11px] text-gray-500">
                Simulated ledger payout • Balance deducted instantly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Available Balance Card */}
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">
              Available For Withdrawal
            </p>
            <p className="text-lg font-black text-gray-900 mt-0.5">
              {formatCurrency(currentBalance)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAmount(String(currentBalance))}
            className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-[11px] font-extrabold transition"
          >
            Withdraw All
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 text-red-600 px-3 py-2 text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">
              Withdrawal Amount (GH₵)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2 text-xs font-extrabold text-gray-900 focus:border-[#00b074] focus:outline-none"
              />
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Payout Channel
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-800"
              >
                <option value="MTN_MOMO">MTN MoMo</option>
                <option value="TELECEL_CASH">Telecel Cash</option>
                <option value="AT_MONEY">AT Money</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Destination Phone
              </label>
              <input
                type="text"
                required
                value={destAccount}
                onChange={(e) => setDestAccount(e.target.value)}
                placeholder="054XXXXXXX"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/50 p-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-800 font-semibold leading-tight">
              Deducts from internal account balance. No funds leave the live Moolre payment float.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || currentBalance <= 0}
            className="w-full rounded-2xl bg-gray-900 hover:bg-black text-white py-3 text-xs font-extrabold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Ledger Payout...</span>
              </>
            ) : (
              <span>Confirm &amp; Withdraw Funds</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
