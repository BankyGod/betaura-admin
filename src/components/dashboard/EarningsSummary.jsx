import { useState } from 'react';
import { TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const tabs = ['Today', 'This Week', 'This Month'];

export default function EarningsSummary({
  today = 820,
  week = 3210,
  month = 12750,
}) {
  const [activeTab, setActiveTab] = useState('Today');

  const items = [
    { label: 'Today', amount: today, icon: TrendingUp },
    { label: 'This Week', amount: week, icon: BarChart2 },
    { label: 'This Month', amount: month, icon: Calendar },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 rounded-full bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full py-1.5 text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-[#0e9f47] text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 py-2 text-center">
        {items.map(({ label, amount, icon: Icon }) => (
          <div key={label} className="px-2 flex flex-col items-center">
            <p className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</p>
            <span className="text-[11px] text-gray-500 mt-0.5">Earnings</span>
            <Icon className="w-4 h-4 text-[#0e9f47] mt-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

