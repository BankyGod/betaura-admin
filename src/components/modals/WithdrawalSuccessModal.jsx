import { CheckCircle2, X, Copy, Check, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function WithdrawalSuccessModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const refCode = data.reference || data.ref || 'ADM-WD-SUCCESS';
  const amountVal = Math.abs(Number(data.amount || 0));
  const newBal = Number(data.new_balance ?? data.balance_after ?? 0);
  const destAccount = data.destination_account || data.destination || 'Mobile Money Wallet';
  const providerName = (data.provider || 'MTN_MOMO').replace('_', ' ');

  function handleCopyRef() {
    try {
      navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Emerald Success Icon */}
        <div className="flex justify-center pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#d9f3ea] text-[#00b074] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-gray-900">
            Withdrawal Successful!
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Simulated ledger payout processed. Money deducted from your BetAura balance.
          </p>
        </div>

        {/* Large Amount Display */}
        <div className="rounded-2xl bg-gradient-to-b from-[#eaf7ef] to-[#d9f3ea]/50 border border-[#00b074]/30 p-4">
          <p className="text-[11px] font-bold text-[#0a873c] uppercase tracking-wider">
            Amount Withdrawn
          </p>
          <p className="text-3xl font-black text-gray-900 mt-0.5 tracking-tight">
            {formatCurrency(amountVal)}
          </p>
          <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-[#00b074] text-white text-[10px] font-black uppercase tracking-wider">
            ✓ Status: Completed
          </span>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
            <span className="text-gray-500">Remaining Balance:</span>
            <span className="font-extrabold text-gray-900">
              {formatCurrency(newBal)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
            <span className="text-gray-500">Payout Channel:</span>
            <span className="font-bold text-gray-800">
              {providerName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
            <span className="text-gray-500">Destination:</span>
            <span className="font-mono font-bold text-gray-900">
              {destAccount}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-gray-500">Ref Code:</span>
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1 font-mono font-bold text-[#00b074] hover:underline"
              title="Click to copy"
            >
              <span>{refCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#00b074]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Security / Float Protection Note */}
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/60 p-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="text-[10px] text-amber-800 font-semibold leading-tight">
            Security audit: Zero funds deducted from Paystack gateway reserves. Internal balance updated instantly.
          </p>
        </div>

        {/* Close / Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-[#00b074] hover:bg-[#0a873c] text-white py-3 text-xs font-extrabold shadow-md transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}
