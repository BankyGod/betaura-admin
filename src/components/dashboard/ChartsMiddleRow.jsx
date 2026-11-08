import { useState, useMemo } from 'react';
import { MoreVertical, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { formatCurrency } from '../../utils/formatters';

function DonutChart({ percentage, color, bgTrack, label, showValue }) {
  const safePct = Math.max(0, Math.min(100, Number(percentage || 0)));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-22 h-22 sm:w-28 sm:h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="transparent"
            stroke={bgTrack}
            strokeWidth="16"
          />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white shadow-xs flex items-center justify-center">
              <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                {safePct}%
              </span>
            </div>
          </div>
        )}
      </div>
      <span className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-gray-700 text-center">
        {label}
      </span>
    </div>
  );
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ChartsMiddleRow({ dashboardData, onRefresh }) {
  const { admin } = useAuth();
  const fallbackHook = useDashboardData();
  const data = dashboardData || fallbackHook.data;
  const refreshFn = onRefresh || fallbackHook.refresh;

  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );

  const [showChart, setShowChart] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);

  const apiPie = data.analytics?.pie_chart;
  const apiOrder = data.analytics?.chart_order;

  const invitedCount = data.referredPeople?.length || data.referralsCount || 0;
  const activeReferred = (data.referredPeople || []).filter(
    (p) => p.deposit_active
  ).length;
  const computedConvPct =
    invitedCount > 0 ? Math.round((activeReferred / invitedCount) * 100) : 0;

  const totalOrders = Number(data.kpi?.totalOrders || 0);
  const totalDelivered = Number(data.kpi?.totalDelivered || 0);
  const computedWinPct =
    totalOrders > 0 ? Math.round((totalDelivered / totalOrders) * 100) : 0;

  const orderPct =
    apiPie?.order_pct ?? (isSuperAdmin ? computedWinPct : computedConvPct);
  const growthPct = apiPie?.growth_pct ?? 0;
  const revenuePct =
    apiPie?.revenue_pct ??
    (isSuperAdmin
      ? data.totalBalance > 0
        ? Math.min(
            100,
            Math.round(
              (Number(data.earnings?.month || 0) /
                Math.max(1, Number(data.totalBalance))) *
                100
            )
          )
        : 0
      : invitedCount > 0
      ? 50
      : 0);

  const pieLabels = apiPie?.labels || (
    isSuperAdmin
      ? ['Won Bets Rate', 'Customer Growth', 'Monthly Revenue Share']
      : ['Invite Conversion', 'Referral Growth', '50% Bonus Rate']
  );

  // Build real 7-day series from API analytics or real bets/referrals
  const weeklySeries = useMemo(() => {
    if (Array.isArray(apiOrder?.weekly_series) && apiOrder.weekly_series.length === 7) {
      return apiOrder.weekly_series.map((item, i) => ({
        day: item.day || DAY_NAMES[i],
        orders: Number(item.orders || 0),
        amount: Number(item.amount || 0),
      }));
    }

    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const amounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    if (isSuperAdmin && Array.isArray(data.bets)) {
      data.bets.forEach((b) => {
        if (b.created_at) {
          const d = DAY_NAMES[new Date(b.created_at).getDay()];
          if (d) {
            counts[d] += 1;
            amounts[d] += Number(b.stake || 0);
          }
        }
      });
    } else if (!isSuperAdmin && Array.isArray(data.referredPeople)) {
      data.referredPeople.forEach((p) => {
        const dtStr = p.created_at || p.joined;
        if (dtStr) {
          const dt = new Date(dtStr);
          if (!Number.isNaN(dt.getTime())) {
            const d = DAY_NAMES[dt.getDay()];
            counts[d] += 1;
            amounts[d] += Number(p.commission_earned || 0);
          }
        }
      });
    }

    return DAY_NAMES.map((d) => ({
      day: d,
      orders: counts[d],
      amount: Math.round(amounts[d] * 100) / 100,
    }));
  }, [apiOrder, isSuperAdmin, data.bets, data.referredPeople]);

  // Compute SVG coordinates from real weeklySeries
  const chartGeometry = useMemo(() => {
    const maxOrders = Math.max(...weeklySeries.map((s) => s.orders), 1);
    const xs = [25, 100, 175, 250, 325, 400, 475];
    const points = weeklySeries.map((s, idx) => {
      const ratio = s.orders / maxOrders;
      const y = Math.round(125 - ratio * 85); // y=125 is 0, y=40 is max
      return {
        x: xs[idx],
        y,
        day: s.day,
        orders: s.orders,
        amount: s.amount,
      };
    });

    const linePath = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`)
      .join(' ');
    const areaPath = `${linePath} L 475,135 L 25,135 Z`;

    let peakIdx = 0;
    points.forEach((pt, idx) => {
      if (pt.orders > points[peakIdx].orders) peakIdx = idx;
    });

    return { points, linePath, areaPath, peakIdx };
  }, [weeklySeries]);

  const activeIdx =
    selectedDayIdx !== null ? selectedDayIdx : chartGeometry.peakIdx;
  const activePoint = chartGeometry.points[activeIdx] || chartGeometry.points[0];

  function handleSaveReport() {
    const rows = isSuperAdmin
      ? [
          ['Metric', 'Value'],
          ['Total Revenue / Balance (GHS)', Number(data.totalBalance || 0).toFixed(2)],
          ['Today Earnings (GHS)', Number(data.earnings?.today || 0).toFixed(2)],
          ['This Week Earnings (GHS)', Number(data.earnings?.week || 0).toFixed(2)],
          ['This Month Earnings (GHS)', Number(data.earnings?.month || 0).toFixed(2)],
          ['People Referred', Number(data.referralsCount || 0)],
          ['Total Bets', Number(data.kpi?.totalOrders || 0)],
          ['Total Settled (Won)', Number(data.kpi?.totalDelivered || 0)],
          ['Total Lost / Canceled', Number(data.kpi?.totalCanceled || 0)],
          [],
          ['Day', 'Orders', 'Stake Volume (GHS)'],
          ...weeklySeries.map((s) => [s.day, s.orders, s.amount.toFixed(2)]),
        ]
      : [
          ['Sub-Admin Referral Metric', 'Value'],
          ['Sub-Admin Name', admin?.name || 'Sub-Admin'],
          ['Referral Code', data.referralCode || ''],
          ['Total Referral Earnings (GHS)', Number(data.totalBalance || 0).toFixed(2)],
          ['Today Referral Earnings (GHS)', Number(data.earnings?.today || 0).toFixed(2)],
          ['This Week Referral Earnings (GHS)', Number(data.earnings?.week || 0).toFixed(2)],
          ['This Month Referral Earnings (GHS)', Number(data.earnings?.month || 0).toFixed(2)],
          ['People Referred', invitedCount],
          [],
          ['Day', 'Referred Signups', 'Commission (GHS)'],
          ...weeklySeries.map((s) => [s.day, s.orders, s.amount.toFixed(2)]),
        ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      isSuperAdmin ? 'betaura-admin-report.csv' : 'subadmin-referral-earnings.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left Card: Pie Chart (3 Real Donuts) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-100 flex flex-col justify-between relative">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            {isSuperAdmin ? 'Pie Chart (Real DB Metrics)' : 'Referral Conversion & Earnings Mix'}
          </h3>
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-600 font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showChart}
                onChange={(e) => setShowChart(e.target.checked)}
                className="accent-[#ff5b5b] w-3.5 h-3.5 rounded"
              />
              <span>Chart</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showValue}
                onChange={(e) => setShowValue(e.target.checked)}
                className="accent-[#ff5b5b] w-3.5 h-3.5 rounded"
              />
              <span>Show Value</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 z-20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      refreshFn?.();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Analytics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleSaveReport();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showChart ? (
          <div className="grid grid-cols-3 gap-2 py-1 sm:py-2">
            <DonutChart
              percentage={orderPct}
              color="#ff5b5b"
              bgTrack="#ffe5e5"
              label={pieLabels[0]}
              showValue={showValue}
            />
            <DonutChart
              percentage={growthPct}
              color="#00b074"
              bgTrack="#d9f3ea"
              label={pieLabels[1]}
              showValue={showValue}
            />
            <DonutChart
              percentage={revenuePct}
              color="#2d9cdb"
              bgTrack="#dceef9"
              label={pieLabels[2]}
              showValue={showValue}
            />
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-gray-400 font-semibold">
            Chart hidden. Check &ldquo;Chart&rdquo; above to display donut metrics.
          </div>
        )}
      </div>

      {/* Right Card: Dynamic Chart Order / Referral Commission Trend */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {apiOrder?.title ||
                (isSuperAdmin ? 'Chart Order' : 'Referral Activity & Commission Trend')}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
              {apiOrder?.subtitle ||
                (isSuperAdmin
                  ? 'Click any day below to inspect real bet orders & stake volume'
                  : 'Click any day below to inspect referred signups & commission')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d9cdb] px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-[#2d9cdb] hover:bg-[#2d9cdb]/5 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Report</span>
          </button>
        </div>

        <div className="relative pt-6">
          {/* Dynamic Tooltip Callout */}
          <div className="inline-flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100 mb-2">
            <span className="text-xs font-extrabold text-[#2d9cdb]">
              {activePoint.day}: {activePoint.orders}{' '}
              {isSuperAdmin ? (activePoint.orders === 1 ? 'Bet' : 'Bets') : 'Referred'}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold">
              • Volume: {formatCurrency(activePoint.amount)}
            </span>
          </div>

          <svg viewBox="0 0 500 145" className="w-full h-32 sm:h-36 overflow-visible">
            <defs>
              <linearGradient id="orderAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2d9cdb" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#2d9cdb" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal baseline */}
            <line x1="20" y1="125" x2="480" y2="125" stroke="#f3f4f6" strokeWidth="1.5" />

            <path d={chartGeometry.areaPath} fill="url(#orderAreaGrad)" />

            <path
              d={chartGeometry.linePath}
              fill="none"
              stroke="#2d9cdb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chartGeometry.points.map((pt, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <g
                  key={pt.day}
                  onClick={() => setSelectedDayIdx(idx)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 7 : 4.5}
                    fill={isSelected ? '#00b074' : '#2d9cdb'}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-600 font-bold select-none"
                  >
                    {pt.orders}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-7 text-center text-[10px] sm:text-[11px] font-medium pt-1">
            {chartGeometry.points.map((pt, idx) => (
              <button
                key={pt.day}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`py-1 rounded-lg transition ${
                  idx === activeIdx
                    ? 'bg-[#dceef9] text-[#2d9cdb] font-extrabold'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pt.day}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
