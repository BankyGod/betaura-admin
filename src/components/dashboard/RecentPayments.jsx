import { User, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function RecentPayments({
  payments = [],
  title = 'Recent Payments',
  onSeeAll,
}) {
  return (
    <section className="pt-1">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-xs font-semibold text-[#0e9f47] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 font-medium border border-dashed border-gray-100 rounded-xl">
          No real payment or commission transactions recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {payments.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#dff5e7] flex items-center justify-center text-[#0e9f47]">
                  <User className="w-5 h-5 fill-[#0e9f47]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>

              <span className="text-sm font-bold text-[#0e9f47]">
                +{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
