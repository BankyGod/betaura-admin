import { ClipboardList, CheckCircle2, XCircle, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function KpiCardsRow({ stats }) {
  const totalOrders = Number(stats?.totalOrders ?? 0);
  const totalDelivered = Number(stats?.totalDelivered ?? 0);
  const totalCanceled = Number(stats?.totalCanceled ?? 0);
  const winRate =
    totalOrders > 0 ? `${Math.round((totalDelivered / totalOrders) * 100)}% won` : 'Live DB';
  const lossRate =
    totalOrders > 0 ? `${Math.round((totalCanceled / totalOrders) * 100)}% lost` : 'Live DB';

  const cards = [
    {
      id: 'orders',
      value: totalOrders,
      label: 'Total Bets',
      trend: 'Live DB Count',
      up: true,
      icon: ClipboardList,
    },
    {
      id: 'delivered',
      value: totalDelivered,
      label: 'Total Settled',
      trend: winRate,
      up: true,
      icon: CheckCircle2,
    },
    {
      id: 'canceled',
      value: totalCanceled,
      label: 'Total Canceled / Lost',
      trend: lossRate,
      up: false,
      icon: XCircle,
    },
    {
      id: 'revenue',
      value: stats?.totalRevenueFormatted ?? formatCurrency(0),
      label: 'Total Revenue',
      trend: 'Live DB Ledger',
      up: true,
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
      {cards.map(({ id, value, label, trend, up, icon: Icon }) => (
        <div
          key={id}
          className="bg-white rounded-2xl p-3.5 sm:p-6 shadow-xs flex items-center gap-3 sm:gap-4 border border-gray-100/80 active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 sm:w-15 sm:h-15 rounded-full bg-[#d9f3ea] flex items-center justify-center text-[#00b074] shrink-0">
            <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-2xl font-extrabold text-gray-900 truncate leading-tight">
              {value}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate mt-0.5">
              {label}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-gray-400">
              <span
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0 ${
                  up ? 'bg-[#d9f3ea] text-[#00b074]' : 'bg-[#ffe3e3] text-[#ff5b5b]'
                }`}
              >
                {up ? (
                  <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
              </span>
              <span className="truncate">{trend}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
