import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import KpiCardsRow from '../components/dashboard/KpiCardsRow';
import ChartsMiddleRow from '../components/dashboard/ChartsMiddleRow';
import ChartsBottomRow from '../components/dashboard/ChartsBottomRow';
import BalanceCard from '../components/dashboard/BalanceCard';
import EarningsSummary from '../components/dashboard/EarningsSummary';
import ReferralBanner from '../components/dashboard/ReferralBanner';
import RecentPayments from '../components/dashboard/RecentPayments';
import ReferredPeopleList from '../components/dashboard/ReferredPeopleList';

const periodOptions = [
  { key: 'Today', label: 'Today (Live)' },
  { key: 'This Week', label: 'Last 7 Days' },
  { key: 'This Month', label: 'This Month (30 Days)' },
];

export default function Home() {
  const { admin } = useAuth();
  const { data, refresh } = useDashboardData();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );

  const currentPeriodLabel =
    periodOptions.find((p) => p.key === selectedPeriod)?.label || 'Today - This Month';

  const periodGain =
    selectedPeriod === 'This Week'
      ? data.earnings.week
      : selectedPeriod === 'This Month'
      ? data.earnings.month
      : data.earnings.today;

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* MOBILE-FIRST APP VIEW (< lg): Native Profit Kings App Layout + 2x2 KPI Grid */}
      <div className="lg:hidden space-y-4">
        <BalanceCard
          totalBalance={data.totalBalance}
          todayGain={periodGain}
          label={isSuperAdmin ? 'Total Balance' : 'Referral Earnings'}
          subLabel={isSuperAdmin ? selectedPeriod : `${selectedPeriod} (From Referrals)`}
          onWithdraw={() => navigate(isSuperAdmin ? '/wallet' : '/referrals')}
        />
        <EarningsSummary
          today={data.earnings.today}
          week={data.earnings.week}
          month={data.earnings.month}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
        />
        {/* 2x2 Compact Mobile KPI Grid */}
        <KpiCardsRow stats={data.kpi} />
        <ReferralBanner count={data.referralsCount} />
        {!isSuperAdmin && (
          <ReferredPeopleList
            referralCode={data.referralCode}
            totalInvited={data.referralsCount}
            referredPeople={data.referredPeople}
            totalCommission={data.totalBalance}
            bonusBalance={data.bonusBalance}
            isSubAdmin={true}
          />
        )}
        <RecentPayments
          payments={data.recentPayments}
          onSeeAll={() => navigate(isSuperAdmin ? '/wallet' : '/referrals')}
        />
        {!isSuperAdmin && (
          <>
            <ChartsMiddleRow dashboardData={data} onRefresh={refresh} />
            <ChartsBottomRow
              dashboardData={data}
              onRefresh={refresh}
              selectedPeriod={selectedPeriod}
            />
          </>
        )}
      </div>

      {/* DESKTOP SEDAP VIEW (lg+): Full Sedap Modern Admin Dashboard */}
      <div className="hidden lg:block space-y-6">
        {/* Page Title & Filter Periode Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {isSuperAdmin ? 'Dashboard' : 'Sub-Admin Referral Dashboard'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isSuperAdmin
                ? `Hi, ${admin?.name || 'Super Admin'}. Welcome back to BetAura Admin!`
                : `Hi, ${admin?.name}. You are viewing your personal Referral Earnings & assigned tools.`}
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodDropdownOpen((prev) => !prev)}
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-gray-50 hover:bg-gray-50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-[#dceef9] text-[#2d9cdb] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800">Filter Periode</p>
                <p className="text-[11px] text-gray-400">{currentPeriodLabel}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
            </button>

            {periodDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-lg border border-gray-100 py-1.5 z-30">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(opt.key);
                      setPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition ${
                      selectedPeriod === opt.key
                        ? 'bg-[#d9f3ea] text-[#00b074]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <KpiCardsRow stats={data.kpi} />

        {/* Profit Kings Balance + Earnings + Recent Payments Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-4 bg-white rounded-2xl p-5 shadow-xs border border-gray-50">
            <BalanceCard
              totalBalance={data.totalBalance}
              todayGain={periodGain}
              label={isSuperAdmin ? 'Total Balance' : 'Referral Earnings'}
              subLabel={isSuperAdmin ? selectedPeriod : `${selectedPeriod} (From Referrals)`}
              onWithdraw={() => navigate(isSuperAdmin ? '/wallet' : '/referrals')}
            />
            <EarningsSummary
              today={data.earnings.today}
              week={data.earnings.week}
              month={data.earnings.month}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
            />
            <ReferralBanner count={data.referralsCount} />
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-gray-50">
            <RecentPayments
              payments={data.recentPayments}
              onSeeAll={() => navigate(isSuperAdmin ? '/wallet' : '/referrals')}
            />
          </div>
        </div>

        {/* Sub-Admin: People You Have Referred section directly on Main Dashboard */}
        {!isSuperAdmin && (
          <ReferredPeopleList
            referralCode={data.referralCode}
            totalInvited={data.referralsCount}
            referredPeople={data.referredPeople}
            totalCommission={data.totalBalance}
            bonusBalance={data.bonusBalance}
            isSubAdmin={true}
          />
        )}

        {/* Analytics Charts: Platform Revenue for Super Admin, Referral & Earnings Analytics for Sub-Admin */}
        <ChartsMiddleRow dashboardData={data} onRefresh={refresh} />
        <ChartsBottomRow
          dashboardData={data}
          onRefresh={refresh}
          selectedPeriod={selectedPeriod}
        />
      </div>
    </div>
  );
}
