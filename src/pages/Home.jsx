import { Calendar, ChevronDown } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import KpiCardsRow from '../components/dashboard/KpiCardsRow';
import ChartsMiddleRow from '../components/dashboard/ChartsMiddleRow';
import ChartsBottomRow from '../components/dashboard/ChartsBottomRow';
import CustomerReviewsRow from '../components/dashboard/CustomerReviewsRow';
import BalanceCard from '../components/dashboard/BalanceCard';
import EarningsSummary from '../components/dashboard/EarningsSummary';
import ReferralBanner from '../components/dashboard/ReferralBanner';
import RecentPayments from '../components/dashboard/RecentPayments';

export default function Home() {
  const outletContext = useOutletContext() || {};
  const { viewMode = 'desktop' } = outletContext;
  const { admin } = useAuth();
  const { data } = useDashboardData();
  const navigate = useNavigate();

  // Standalone Profit Kings Mobile View (Reference 1)
  if (viewMode === 'mobile') {
    return (
      <div className="space-y-4">
        <BalanceCard
          totalBalance={data.totalBalance}
          todayGain={data.todayGain}
          onWithdraw={() => navigate('/wallet')}
        />
        <EarningsSummary
          today={data.earnings.today}
          week={data.earnings.week}
          month={data.earnings.month}
        />
        <ReferralBanner count={data.referralsCount} />
        <RecentPayments
          payments={data.recentPayments}
          onSeeAll={() => navigate('/wallet')}
        />
      </div>
    );
  }

  // Full Sedap Modern Admin Dashboard View (Reference 2) + Profit Kings Wallet & Referrals Panel
  return (
    <div className="space-y-6">
      {/* Page Title & Filter Periode Header (Sedap style) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Dashboard</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hi, {admin?.name || 'Admin'}. Welcome back to BetAura Admin!
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-gray-50 hover:bg-gray-50 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-[#dceef9] text-[#2d9cdb] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-800">Filter Periode</p>
            <p className="text-[11px] text-gray-400">Today - This Month (2026)</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
        </button>
      </div>

      {/* 4 KPI Summary Cards (Sedap style) */}
      <KpiCardsRow stats={data.kpi} />

      {/* Profit Kings Balance + Earnings + Recent Payments Row integrated into Desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-4 bg-white rounded-2xl p-5 shadow-xs border border-gray-50">
          <BalanceCard
            totalBalance={data.totalBalance}
            todayGain={data.todayGain}
            onWithdraw={() => navigate('/wallet')}
          />
          <EarningsSummary
            today={data.earnings.today}
            week={data.earnings.week}
            month={data.earnings.month}
          />
          <ReferralBanner count={data.referralsCount} />
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-gray-50">
          <RecentPayments
            payments={data.recentPayments}
            onSeeAll={() => navigate('/wallet')}
          />
        </div>
      </div>

      {/* Middle Row: Pie Chart (3 Donuts) + Chart Order (Blue Area Curve) */}
      <ChartsMiddleRow />

      {/* Bottom Row: Total Revenue (Dual Line) + Customer Map (Weekly Bar) */}
      <ChartsBottomRow />

      {/* Customer Review & Recent Wins Row */}
      <CustomerReviewsRow />
    </div>
  );
}
