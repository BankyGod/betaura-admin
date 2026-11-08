import { ChevronLeft, ChevronRight, Star, Trophy } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: 'Kwame Mensah',
    time: '2 hours ago',
    text: 'Instant Mobile Money payout on my 6-leg Champions League accumulator ticket! Odds boost was credited automatically.',
    rating: 4.5,
    badge: '+GH₵ 1,450.00',
    sport: 'UEFA Champions League',
  },
  {
    id: 2,
    name: 'Abena Darko',
    time: '5 hours ago',
    text: 'Referred 4 friends using my AURA referral code and received the 50% first-deposit bonus immediately in my bonus wallet.',
    rating: 5.0,
    badge: '+GH₵ 200.00',
    sport: 'Premier League',
  },
  {
    id: 3,
    name: 'Prince Boateng',
    time: '1 day ago',
    text: 'Partial cash-out worked smoothly during the 2nd half live in-play match. Verified my slip with the official GHY code.',
    rating: 4.5,
    badge: '+GH₵ 300.00',
    sport: 'LaLiga Live',
  },
];

export default function CustomerReviewsRow() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Customer Review & Recent Wins</h3>
          <p className="text-xs text-gray-400">
            Verified player feedback, recent payouts, and platform activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#00b074] hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#00b074] hover:bg-gray-50 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 shadow-xs border border-gray-50 flex items-center justify-between gap-4"
          >
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d9f3ea] text-[#00b074] font-bold text-sm flex items-center justify-center shrink-0">
                  {item.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                  <p className="text-[11px] text-gray-400">{item.time}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                {item.text}
              </p>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#f7c604]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(item.rating)
                          ? 'fill-[#f7c604] text-[#f7c604]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-700">{item.rating}</span>
              </div>
            </div>

            {/* Circular badge on the right (matching Sedap plate circle) */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00b074] to-[#0a873c] text-white flex flex-col items-center justify-center text-center p-2 shadow-md shrink-0">
              <Trophy className="w-5 h-5 mb-1 text-emerald-200" />
              <span className="text-[11px] font-extrabold leading-tight">{item.badge}</span>
              <span className="text-[9px] text-white/80 mt-0.5 truncate max-w-full px-1">
                {item.sport}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

