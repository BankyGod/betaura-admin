import { User, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const defaultPayments = [
  { id: 1, name: 'Kwame Mensah', time: 'Today, 9:24 PM', amount: 150 },
  { id: 2, name: 'Abena Darko', time: 'Today, 7:12 PM', amount: 200 },
  { id: 3, name: 'Prince Boateng', time: 'Today, 5:30 PM', amount: 300 },
  { id: 4, name: 'Ama Serwaa', time: 'Today, 2:18 PM', amount: 120 },
  { id: 5, name: 'David Okrah', time: 'Today, 11:45 AM', amount: 250 },
];

export default function RecentPayments({ payments = defaultPayments, onSeeAll }) {
  return (
    <section className="pt-1">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900">Recent Payments</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-xs font-semibold text-[#0e9f47] hover:underline"
        >
          <span>See All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

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
    </section>
  );
}

