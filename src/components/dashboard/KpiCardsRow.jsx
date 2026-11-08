import { ClipboardList, CheckCircle2, XCircle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function KpiCardsRow({ stats }) {
  const cards = [
    {
      id: 'orders',
      value: stats?.totalOrders ?? 75,
      label: 'Total Bets / Orders',
      trend: '+4% (30 days)',
      up: true,
      icon: ClipboardList,
    },
    {
      id: 'delivered',
      value: stats?.totalDelivered ?? 357,
      label: 'Total Settled / Won',
      trend: '+4% (30 days)',
      up: true,
      icon: CheckCircle2,
    },
    {
      id: 'canceled',
      value: stats?.totalCanceled ?? 65,
      label: 'Total Canceled',
      trend: '-25% (30 days)',
      up: false,
      icon: XCircle,
    },
    {
      id: 'revenue',
      value: stats?.totalRevenueFormatted ?? formatCurrency(5420),
      label: 'Total Revenue',
      trend: '+12% (30 days)',
      up: true,
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map(({ id, value, label, trend, up, icon: Icon }) => (
        <div
          key={id}
          className="bg-white rounded-2xl p-6 shadow-xs flex items-center gap-4 border border-gray-50"
        >
          <div className="w-16 h-16 rounded-full bg-[#d9f3ea] flex items-center justify-center text-[#00b074] shrink-0">
            <Icon className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
              {value}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  up ? 'bg-[#d9f3ea] text-[#00b074]' : 'bg-[#ffe3e3] text-[#ff5b5b]'
                }`}
              >
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </span>
              <span>{trend}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

