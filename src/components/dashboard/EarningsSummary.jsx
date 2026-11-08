import { useState } from 'react';
import { TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const tabs = ['Today', 'This Week', 'This Month'];

export default function EarningsSummary({
  today = 0,
  week = 0,
  month = 0,
  selectedPeriod,
  onSelectPeriod,
}) {
  const [internalTab, setInternalTab] = useState('Today');
  const activeTab = selectedPeriod || internalTab;

  function handleTabChange(tab) {
    setInternalTab(tab);
    onSelectPeriod?.(tab);
  }

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
            onClick={() => handleTabChange(tab)}
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
        {items.map(({ label, amount, icon: Icon }) => {
          const isSelected = activeTab === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => handleTabChange(label)}
              className={`px-1.5 py-1.5 rounded-xl flex flex-col items-center transition ${
                isSelected ? 'bg-[#eaf7ef]/70' : 'hover:bg-gray-50'
              }`}
            >
              <p
                className={`text-xs sm:text-sm font-extrabold ${
                  isSelected ? 'text-[#0e9f47]' : 'text-gray-900'
                }`}
              >
                {formatCurrency(amount)}
              </p>
              <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
                Earnings
              </span>
              <Icon className="w-4 h-4 text-[#0e9f47] mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
