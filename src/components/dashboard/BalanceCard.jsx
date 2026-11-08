import { useState } from 'react';
import { Eye, EyeOff, TrendingUp, ChevronRight, Crown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function BalanceCard({
  totalBalance = 0,
  todayGain = 0,
  label = 'Total Balance',
  subLabel = 'Today',
  onWithdraw,
}) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12a44c] to-[#0a873c] p-5 text-white shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-white/90 font-medium">
            <span>{label}</span>
            <button
              type="button"
              onClick={() => setHidden(!hidden)}
              className="text-white/80 hover:text-white transition"
              aria-label="Toggle balance visibility"
            >
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {hidden ? 'GH₵ ••••••' : formatCurrency(totalBalance)}
          </div>
        </div>

        <button
          type="button"
          onClick={onWithdraw}
          className="flex items-center gap-1 rounded-full bg-white/90 hover:bg-white text-[#0c8b3f] px-3.5 py-1.5 text-xs font-semibold shadow-sm transition"
        >
          <span>Withdraw</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-1.5 text-xs text-white/90">
        <TrendingUp className="w-4 h-4 text-emerald-200" />
        <span className="font-semibold">+{formatCurrency(todayGain)}</span>
        <span className="text-white/80">{subLabel}</span>
      </div>

      <Crown className="w-24 h-24 text-white/10 fill-white/10 absolute -bottom-3 right-3 pointer-events-none" />
    </div>
  );
}
