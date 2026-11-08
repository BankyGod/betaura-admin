import { useEffect, useState } from 'react';
import { Copy, Check, Gift } from 'lucide-react';
import ReferralBanner from '../components/dashboard/ReferralBanner';
import RecentPayments from '../components/dashboard/RecentPayments';
import ReferredPeopleList from '../components/dashboard/ReferredPeopleList';
import { adminApi } from '../api/endpoints';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function Referrals() {
  const { admin } = useAuth();
  const { data } = useDashboardData();
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await adminApi.getReferralStats();
        if (isMounted && res?.data) {
          setStats(res.data);
        }
      } catch {
        // Fallback to dashboard hook data
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const code = stats?.referral_code || data.referralCode || 'AURA-PROFIT';
  const totalInvited = stats?.total_invited ?? data.referralsCount ?? 0;
  const bonusEarned = stats?.bonus_earned ?? data.referralBonusEarned ?? 0;
  const bonusBalance = stats?.bonus_balance ?? data.bonusBalance ?? 0;
  const referredPeople =
    stats?.referred_people?.length > 0
      ? stats.referred_people
      : data.referredPeople || [];

  function handleCopy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Referrals Program
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Live referral metrics from /api/v1/referral/stats (50% on invitee&apos;s first deposit)
        </p>
      </div>

      <ReferralBanner count={totalInvited} />

      {/* Live Referral Code & Bonus Wallet Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Official Referral Code</p>
            <p className="text-base font-extrabold text-gray-900 mt-0.5">{code}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-xl bg-[#d9f3ea] text-[#00b074] px-3 py-1.5 text-xs font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Total Referral Bonus</p>
            <p className="text-base font-extrabold text-gray-900">
              {formatCurrency(bonusEarned)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2d9cdb] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Active Bonus Wallet</p>
            <p className="text-base font-extrabold text-gray-900">
              {formatCurrency(bonusBalance)}
            </p>
          </div>
        </div>
      </div>

      <ReferredPeopleList
        referralCode={code}
        totalInvited={totalInvited}
        referredPeople={referredPeople}
        totalCommission={bonusEarned}
        bonusBalance={bonusBalance}
        isSubAdmin={!isSuperAdmin}
      />

      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100">
        <RecentPayments payments={data.recentPayments} />
      </div>
    </div>
  );
}
