import { useState } from 'react';
import { X, MinusCircle, Wallet, AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/formatters';

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

export default function DeductBetAccountModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}) {
  const [amount, setAmount] = useState('50');
  const [note, setNote] = useState('Sub-Admin Balance Deduction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !target) return null;

  const connAcc = target.connectedBetauraAccount || target.connected_betaura_account;
  const isSub = Boolean(target.isSubAdmin || target.subAdminCode || target.role === 'ROLE_SUB_ADMIN');
  const targetName = target.name || target.username || (isSub ? 'Sub-Admin' : 'Punter');
  const targetPhone = connAcc?.phone_number || target.phone_number || target.phone || '';
  const targetUsername = connAcc?.username || target.username || '';
  const currentBalance = Number(connAcc?.balance ?? target.balance ?? 0);

  async function handleSubmit(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (val > currentBalance) {
      setError(`Cannot deduct GH₵ ${val.toFixed(2)}. Player only has GH₵ ${currentBalance.toFixed(2)} in their wallet.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        sub_id: target.id,
        user_id: target.id,
        identifier: targetPhone || targetUsername || target.id,
        amount: val,
        note: note.trim() || undefined,
      };
      const res = await adminApi.deductCustomer(target.id, payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to deduct funds from account.'
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
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <MinusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Deduct Money from Punter Wallet
              </h3>
              <p className="text-[11px] text-gray-500">
                Deducts balance directly from the player&apos;s BetAura betting account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Profile Card */}
        <div className="rounded-2xl bg-rose-50/60 border border-rose-200 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-gray-900">
              {targetName} {targetUsername ? `(@${targetUsername})` : ''}
            </span>
            <span className="text-[11px] font-bold text-gray-500 font-mono">
              {targetPhone || target.id}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-100">
            <span className="text-gray-500 font-medium">Available Balance:</span>
            <span className="font-mono font-extrabold text-rose-700 text-sm">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-gray-700">Amount to Deduct (GH₵)</label>
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance.toFixed(2)))}
                  className="text-[11px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                >
                  Deduct All ({formatCurrency(currentBalance)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-gray-400 text-sm">
                GH₵
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 pl-12 pr-4 rounded-xl border border-gray-200 font-mono font-extrabold text-gray-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-sm"
                required
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_AMOUNTS.filter((amt) => amt <= currentBalance).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition cursor-pointer"
                >
                  GH₵ {amt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Reason / Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Administrative Adjustment / Manual Correction"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || currentBalance <= 0}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deducting...</span>
                </>
              ) : (
                <>
                  <MinusCircle className="w-4 h-4" />
                  <span>Deduct GH₵ {parseFloat(amount || '0').toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
