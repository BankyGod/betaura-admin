import { useState } from 'react';
import {
  Eye,
  EyeOff,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Crown,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function BalanceCard({
  totalBalance = 0,
  todayGain = 0,
  liveFunds = 0,
  liveFundsToday = 0,
  label = 'Total Balance',
  subLabel = 'Today',
  onWithdraw,
  isSuperAdmin = false,
}) {
  const [hidden, setHidden] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // 0 = Total Balance, 1 = Live Funds

  // Non-super-admin (Sub-Admin): display single referral card
  if (!isSuperAdmin) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12a44c] to-[#0a873c] p-5 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/90 font-medium">
              <span>{label}</span>
              <button
                type="button"
                onClick={() => setHidden(!hidden)}
                className="text-white/80 hover:text-white transition cursor-pointer"
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
            className="flex items-center gap-1 rounded-full bg-white/90 hover:bg-white text-[#0c8b3f] px-3.5 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer"
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

  // SUPER ADMIN CAROUSEL:
  // Slide 0: Total Balance (All Funds: Funded + Real)
  // Slide 1: Live Funds (ONLY Real Money Deposited into Paystack Wallet)
  const isLiveSlide = activeSlide === 1;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-md transition-all duration-300 ${
        isLiveSlide
          ? 'bg-gradient-to-br from-[#0c6b45] via-[#055737] to-[#023c25]'
          : 'bg-gradient-to-br from-[#12a44c] via-[#0d9241] to-[#0a873c]'
      }`}
    >
      {/* Top Carousel Navigation Tabs & Balance Visibility Toggle */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Carousel Slide Toggle Buttons */}
        <div className="inline-flex items-center bg-black/25 backdrop-blur-xs p-1 rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeSlide === 0
                ? 'bg-white text-[#0a873c] shadow-xs font-extrabold'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Total Balance
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide(1)}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeSlide === 1
                ? 'bg-emerald-400 text-gray-900 shadow-xs font-extrabold'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Funds</span>
          </button>
        </div>

        {/* Visibility Toggle & Carousel Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHidden(!hidden)}
            className="p-1 rounded-lg bg-black/15 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Toggle balance visibility"
            title={hidden ? 'Show balance' : 'Hide balance'}
          >
            {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 0 ? 1 : 0))}
            className="p-1 rounded-lg bg-black/15 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 0 ? 1 : 0))}
            className="p-1 rounded-lg bg-black/15 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex items-start justify-between min-h-[70px]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            {isLiveSlide ? (
              <span className="flex items-center gap-1.5 text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Live Funds (Paystack Wallet Only)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-white/90">
                <Wallet className="w-4 h-4 text-white/80" />
                Total Platform Balance (All Funds)
              </span>
            )}
          </div>

          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {hidden
              ? 'GH₵ ••••••'
              : formatCurrency(isLiveSlide ? liveFunds : totalBalance)}
          </div>
        </div>

        <div>
          {isLiveSlide ? (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                Real Inflow
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onWithdraw}
              className="flex items-center gap-1 rounded-full bg-white/90 hover:bg-white text-[#0c8b3f] px-3.5 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <span>Withdraw</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer Info & Carousel Indicator Dots */}
      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/90">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-200" />
          <span className="font-semibold">
            +{formatCurrency(isLiveSlide ? liveFundsToday : todayGain)}
          </span>
          <span className="text-white/80">
            {isLiveSlide ? 'Paystack Today' : subLabel}
          </span>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            className={`transition-all rounded-full cursor-pointer ${
              activeSlide === 0
                ? 'w-5 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label="Go to Total Balance"
          />
          <button
            type="button"
            onClick={() => setActiveSlide(1)}
            className={`transition-all rounded-full cursor-pointer ${
              activeSlide === 1
                ? 'w-5 h-1.5 bg-emerald-300'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label="Go to Live Funds"
          />
        </div>
      </div>

      {/* Watermarks */}
      {isLiveSlide ? (
        <ShieldCheck className="w-28 h-28 text-white/10 fill-white/10 absolute -bottom-4 right-2 pointer-events-none" />
      ) : (
        <Crown className="w-28 h-28 text-white/10 fill-white/10 absolute -bottom-4 right-2 pointer-events-none" />
      )}
    </div>
  );
}
