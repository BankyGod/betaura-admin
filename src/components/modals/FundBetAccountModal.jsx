import { useState } from 'react';
import { X, DollarSign, Wallet, ShieldCheck, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/formatters';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

export default function FundBetAccountModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}) {
  const [amount, setAmount] = useState('100');
  const [note, setNote] = useState('Super Admin Bet Account Funding');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !target) return null;

  const connAcc = target.connectedBetauraAccount || target.connected_betaura_account;
  const isSuper = Boolean(target.isSuperAdmin);
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
      const res = await adminApi.fundConnectedAccount(payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to fund account.'
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
            <div className="w-10 h-10 rounded-2xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {isSuper ? 'Fund Super Admin Bet Account' : isSub ? 'Fund Sub-Admin Bet Account' : 'Fund Punter Wallet'}
              </h3>
              <p className="text-[11px] text-gray-500">
                Credits the player&apos;s real BetAura betting wallet (PostgreSQL)
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

        {/* Target Profile Card */}
        <div className="rounded-2xl bg-[#eaf7ef] border border-[#00b074]/30 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-gray-900">
              {targetName} {targetUsername ? `(@${targetUsername})` : ''}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#00b074] text-white text-[10px] font-black uppercase">
              {isSuper ? 'Super Admin' : isSub ? 'Sub-Admin' : 'Punter'}
            </span>
          </div>
          {targetPhone && (
            <p className="text-xs text-gray-600 font-mono">
              {targetPhone}
            </p>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-[#00b074]/20 text-xs">
            <span className="text-gray-500 font-medium">Current Bet Balance:</span>
            <span className="font-extrabold text-[#00b074]">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 text-red-600 px-3 py-2 text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Funding Amount (GH₵)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2.5 text-sm font-extrabold text-gray-900 focus:border-[#00b074] focus:outline-none"
              />
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                    amount === String(p)
                      ? 'bg-[#00b074] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Funding Reference / Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly operational staking allocation"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-[#00b074] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 p-2.5">
            <ShieldCheck className="w-4 h-4 text-[#00b074] shrink-0" />
            <p className="text-[10px] text-gray-500 leading-tight">
              Only Super Administrator can fund. The credited amount is immediately live on the main BetAura betting platform.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#00b074] hover:bg-[#0a873c] text-white py-3 text-xs font-extrabold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crediting Wallet...</span>
              </>
            ) : (
              <span>Confirm &amp; Fund Bet Account</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
