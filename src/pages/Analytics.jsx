import { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import ChartsMiddleRow from '../components/dashboard/ChartsMiddleRow';
import ChartsBottomRow from '../components/dashboard/ChartsBottomRow';
import EarningsSummary from '../components/dashboard/EarningsSummary';
import KpiCardsRow from '../components/dashboard/KpiCardsRow';
import ReferredPeopleList from '../components/dashboard/ReferredPeopleList';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Analytics() {
  const { admin } = useAuth();
  const { data, loading, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );

  const earnings = data.analytics?.earnings || data.earnings;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {isSuperAdmin
              ? 'Analytics & Performance'
              : 'My Referral Earnings & Performance Analytics'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isSuperAdmin
              ? 'Live database revenue, bet order trends, and customer growth from /api/v1/admin/analytics'
              : 'Personal referral earnings breakdown, invite conversion rates, and referred players growth from /api/v1/admin/analytics'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {data.analytics && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d9f3ea] text-[#00b074] text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live DB Analytics Synced</span>
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      <KpiCardsRow stats={data.kpi} />

      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50">
        <EarningsSummary
          today={earnings.today}
          week={earnings.week}
          month={earnings.month}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
        />
      </div>

      <ChartsMiddleRow dashboardData={data} onRefresh={refresh} />
      <ChartsBottomRow
        dashboardData={data}
        onRefresh={refresh}
        selectedPeriod={selectedPeriod}
      />

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
    </div>
  );
}
