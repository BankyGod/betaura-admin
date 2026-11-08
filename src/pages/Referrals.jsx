import ReferralBanner from '../components/dashboard/ReferralBanner';
import RecentPayments from '../components/dashboard/RecentPayments';

export default function Referrals() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Referrals Program (50% First Deposit)</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Track people referred (87) and recent referral bonus payouts
        </p>
      </div>

      <ReferralBanner count={87} />

      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50">
        <RecentPayments />
      </div>
    </div>
  );
}
