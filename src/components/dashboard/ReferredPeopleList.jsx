import { useState } from 'react';
import { Users, Copy, Check, Share2, Gift, UserCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function ReferredPeopleList({
  referralCode = 'AURA-SUB',
  totalInvited = 0,
  referredPeople = [],
  totalCommission = 0,
  bonusBalance = 0,
  isSubAdmin = false,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareLink = `https://betaura.onrender.com/?ref=${encodeURIComponent(
    referralCode
  )}`;

  function handleCopyCode() {
    navigator.clipboard?.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-100 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              {isSubAdmin
                ? `People You Have Referred (${referredPeople.length || totalInvited})`
                : `Referred Players & Referral Commissions (${referredPeople.length || totalInvited})`}
            </h3>
            <p className="text-[11px] text-gray-400">
              50% commission on invitee&apos;s first deposit — credited directly to your referral earnings
            </p>
          </div>
        </div>

        {/* Shareable Referral Code & Link Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-1.5">
            <span className="text-[11px] text-gray-500 font-medium">Code:</span>
            <strong className="text-xs font-extrabold text-[#00b074]">
              {referralCode}
            </strong>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs font-bold text-gray-700 hover:text-[#00b074] inline-flex items-center gap-1"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-[#00b074]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-3 py-1.5 text-xs font-extrabold transition shadow-xs"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>{copiedLink ? 'Referral Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold">
            People Referred
          </p>
          <p className="text-base sm:text-lg font-extrabold text-gray-900 mt-0.5">
            {referredPeople.length || totalInvited}
          </p>
        </div>
        <div className="rounded-xl bg-[#eaf7ef] p-3 border border-[#00b074]/20">
          <p className="text-[10px] sm:text-[11px] text-[#0a873c] font-semibold">
            Referral Earnings
          </p>
          <p className="text-base sm:text-lg font-extrabold text-[#00b074] mt-0.5">
            {formatCurrency(totalCommission)}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100">
          <p className="text-[10px] sm:text-[11px] text-[#2d9cdb] font-semibold">
            Bonus Balance
          </p>
          <p className="text-base sm:text-lg font-extrabold text-[#2d9cdb] mt-0.5">
            {formatCurrency(bonusBalance)}
          </p>
        </div>
      </div>

      {/* People Referred Table / Mobile List */}
      {referredPeople.length === 0 ? (
        <div className="rounded-2xl bg-gray-50/80 border border-dashed border-gray-200 p-6 text-center space-y-1.5">
          <UserCheck className="w-7 h-7 text-[#00b074] mx-auto" />
          <p className="text-xs font-extrabold text-gray-800">
            No referred players recorded under code {referralCode} yet
          </p>
          <p className="text-[11px] text-gray-500 max-w-md mx-auto">
            Share your invite code <strong>{referralCode}</strong> or link above. Every player who registers with your code will appear here along with your 50% first-deposit referral earnings!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Referred Player</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Date Joined</th>
                <th className="px-4 py-3">Deposit Status</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Your Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referredPeople.map((person, idx) => (
                <tr key={person.id || idx} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-extrabold text-gray-900">
                    {person.name || person.username || 'Player'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {person.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {person.joined || 'Recent'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        person.deposit_active
                          ? 'bg-[#d9f3ea] text-[#00b074]'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {person.deposit_active ? 'DEPOSITED' : person.status || 'REGISTERED'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-[#00b074]">
                    <span className="inline-flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      +{formatCurrency(person.commission_earned || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

