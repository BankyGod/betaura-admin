import { Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReferralBanner({ count = 87 }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#eaf7ef] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#d6f0e0] flex items-center justify-center text-[#0e9f47]">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">People Referred</p>
          <p className="text-2xl font-extrabold text-gray-900 leading-tight">{count}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/referrals')}
        className="flex items-center gap-1 rounded-full bg-[#0e9f47] hover:bg-[#0b873c] text-white px-4 py-2 text-xs font-semibold shadow-sm transition"
      >
        <span>View Referrals</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

