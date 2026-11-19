import { useState, useEffect } from 'react';
import { X, Percent, ShieldCheck, Loader2, CheckCircle2, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api/endpoints';

const PRESET_PERCENTAGES = [50, 60, 70, 75, 80, 85, 90];

export default function AdjustCommissionModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}) {
  const [rate, setRate] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (target) {
      const current = Number(target.commission_rate ?? target.commission_percentage ?? 70);
      setRate(current > 0 ? current : 70);
      setError('');
      setSuccessMsg('');
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const targetName = target.name || target.username || 'Sub-Admin';
  const targetUsername = target.username ? `@${target.username}` : '';
  const currentRate = Number(target.commission_rate ?? target.commission_percentage ?? 70);

  async function handleSubmit(e) {
    e.preventDefault();
    const val = Number(rate);
    if (!val || val <= 0 || val > 100) {
      setError('Please enter a valid percentage between 1% and 100%.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await adminApi.updateSubAdminCommission(target.id, {
        commission_rate: val,
      });
      setSuccessMsg(`Commission percentage updated to ${val}%!`);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(res?.data || { ...target, commission_rate: val, commission_percentage: val });
        }
        onClose();
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Failed to update commission rate.'
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
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
              <Percent className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Adjust Commission Rate
              </h3>
              <p className="text-xs text-gray-500">
                {targetName} {targetUsername}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
              Current Commission
            </div>
            <div className="font-extrabold text-gray-900 text-sm">
              {currentRate}% of all deposits
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white font-black text-xs">
            {currentRate}%
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>New Commission Rate (%)</span>
              <span className="text-purple-600 font-black text-sm">{rate}%</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="70"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-base font-extrabold text-gray-900 focus:outline-none focus:border-purple-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-extrabold text-sm">
                %
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full mt-2 accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Quick preset buttons */}
          <div>
            <div className="text-[11px] font-bold text-gray-500 mb-1.5">
              Quick Presets:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PERCENTAGES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRate(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    Number(rate) === preset
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Explanation note */}
          <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 border border-gray-100 space-y-1">
            <p className="font-bold text-gray-800 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              Deposit Commission Rules:
            </p>
            <p>
              This Sub-Admin will automatically receive <b>{rate}%</b> of <b>EVERY deposit</b> made by players who sign up with their referral link or code.
            </p>
          </div>

          {error && (
            <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save {rate}% Rate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
