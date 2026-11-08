import { useState, useMemo, useEffect } from 'react';
import { MoreVertical, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Des',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ChartsBottomRow({
  dashboardData,
  onRefresh,
  selectedPeriod,
}) {
  const { admin } = useAuth();
  const fallbackHook = useDashboardData();
  const data = dashboardData || fallbackHook.data;
  const refreshFn = onRefresh || fallbackHook.refresh;

  const [mapPeriod, setMapPeriod] = useState('Weekly');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (selectedPeriod === 'Today') setMapPeriod('Today');
    else if (selectedPeriod === 'This Week') setMapPeriod('Weekly');
    else if (selectedPeriod === 'This Month') setMapPeriod('Monthly');
  }, [selectedPeriod]);

  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );

  const apiRev = data.analytics?.revenue_series;
  const apiMap = data.analytics?.customer_map;

  const months = apiRev?.months || DEFAULT_MONTHS;

  // Build real 12-month series from backend analytics or real transactions/bets/referrals
  const { primarySeries, secondarySeries, maxVal } = useMemo(() => {
    let prim = Array(12).fill(0);
    let sec = Array(12).fill(0);

    if (
      Array.isArray(apiRev?.monthly_primary) &&
      apiRev.monthly_primary.length === 12
    ) {
      prim = apiRev.monthly_primary.map((v) => Number(v || 0));
      sec = Array.isArray(apiRev.monthly_secondary)
        ? apiRev.monthly_secondary.map((v) => Number(v || 0))
        : prim.map((v) => v * 0.5);
    } else if (
      Array.isArray(apiRev?.monthly_commissions) &&
      apiRev.monthly_commissions.length === 12
    ) {
      prim = apiRev.monthly_commissions.map((v) => Number(v || 0));
      sec = prim.map((v) => v * 0.5);
    } else if (isSuperAdmin) {
      (data.transactions || []).forEach((tx) => {
        if (tx.created_at && Number(tx.amount) > 0) {
          const m = new Date(tx.created_at).getMonth();
          if (m >= 0 && m < 12) prim[m] += Number(tx.amount || 0);
        }
      });
      (data.bets || []).forEach((b) => {
        if (b.created_at) {
          const m = new Date(b.created_at).getMonth();
          if (m >= 0 && m < 12) sec[m] += Number(b.stake || 0);
        }
      });
    } else {
      (data.referredPeople || []).forEach((p) => {
        const dtStr = p.created_at || p.joined;
        if (dtStr) {
          const dt = new Date(dtStr);
          if (!Number.isNaN(dt.getTime())) {
            const m = dt.getMonth();
            prim[m] += Number(p.commission_earned || 0);
            sec[m] += Number(p.commission_earned || 0) * 0.5;
          }
        }
      });
    }

    const peak = Math.max(...prim, ...sec, Number(data.totalBalance || 0), 1);
    return { primarySeries: prim, secondarySeries: sec, maxVal: peak };
  }, [apiRev, isSuperAdmin, data.transactions, data.bets, data.referredPeople, data.totalBalance]);

  // Compute SVG paths for the 12 months
  const revenueGeometry = useMemo(() => {
    const xs = Array.from({ length: 12 }, (_, i) => Math.round(20 + i * 50.5));
    const primPts = primarySeries.map((val, i) => ({
      x: xs[i],
      y: Math.round(145 - (val / maxVal) * 110),
      val,
    }));
    const secPts = secondarySeries.map((val, i) => ({
      x: xs[i],
      y: Math.round(145 - (val / maxVal) * 110),
      val,
    }));

    const primPath = primPts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`)
      .join(' ');
    const secPath = secPts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`)
      .join(' ');

    return { primPts, secPts, primPath, secPath };
  }, [primarySeries, secondarySeries, maxVal]);

  // Build real bars for Customer Map / People Referred Map (0 when 0, never fake numbers)
  const activeBars = useMemo(() => {
    const rawBars = apiMap?.[mapPeriod] || apiMap?.Weekly;
    if (Array.isArray(rawBars) && rawBars.length === 7) {
      const counts = rawBars.map((b) => Number(b.count || 0));
      const maxC = Math.max(...counts, 0);
      return rawBars.map((b, i) => {
        const cnt = Number(b.count || 0);
        return {
          day: b.day || DAY_NAMES[i],
          count: cnt,
          val: maxC > 0 ? Math.round((cnt / maxC) * 90) : 0,
          color: i % 2 === 0 ? '#ff5b5b' : '#f7c604',
        };
      });
    }

    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const now = Date.now();
    const cutoff =
      mapPeriod === 'Today'
        ? now - 86400 * 1000
        : mapPeriod === 'Weekly'
        ? now - 7 * 86400 * 1000
        : now - 30 * 86400 * 1000;

    if (isSuperAdmin) {
      (data.bets || []).forEach((b) => {
        if (b.created_at) {
          const ts = new Date(b.created_at).getTime();
          if (ts >= cutoff) {
            const d = DAY_NAMES[new Date(b.created_at).getDay()];
            if (d) counts[d] += 1;
          }
        }
      });
    } else {
      (data.referredPeople || []).forEach((p) => {
        const dtStr = p.created_at || p.joined;
        if (dtStr) {
          const dt = new Date(dtStr);
          if (!Number.isNaN(dt.getTime()) && dt.getTime() >= cutoff) {
            counts[DAY_NAMES[dt.getDay()]] += 1;
          }
        }
      });
    }

    const maxC = Math.max(...Object.values(counts), 0);
    return DAY_NAMES.map((d, i) => ({
      day: d,
      count: counts[d],
      val: maxC > 0 ? Math.round((counts[d] / maxC) * 90) : 0,
      color: i % 2 === 0 ? '#ff5b5b' : '#f7c604',
    }));
  }, [apiMap, mapPeriod, isSuperAdmin, data.bets, data.referredPeople]);

  const activeMonthPrim = revenueGeometry.primPts[selectedMonthIdx] || {
    x: 275,
    y: 145,
    val: 0,
  };
  const activeMonthSec = revenueGeometry.secPts[selectedMonthIdx] || {
    x: 275,
    y: 145,
    val: 0,
  };

  const yLabels = [
    formatCurrency(maxVal),
    formatCurrency(maxVal * 0.75),
    formatCurrency(maxVal * 0.5),
    formatCurrency(maxVal * 0.25),
  ];

  const maxBarCount = Math.max(...activeBars.map((b) => b.count), 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Real 12-Month Revenue / Referral Earnings Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {apiRev?.title ||
                (isSuperAdmin ? 'Total Revenue' : 'Referral Earnings Analytics')}
            </h3>
            <p className="text-xs text-gray-400">
              {apiRev?.subtitle ||
                (isSuperAdmin
                  ? 'Click any month below to inspect real deposits & bet stakes'
                  : 'Monthly referral commissions earned from your invitees')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2d9cdb]" />
              {apiRev?.legend_primary ||
                (isSuperAdmin ? 'Deposits (GH₵)' : 'Referral Bonus')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5b5b]" />
              {apiRev?.legend_secondary ||
                (isSuperAdmin ? 'Bet Stakes (GH₵)' : 'Active Commission')}
            </span>
          </div>
        </div>

        {/* Selected Month Real Callouts */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-extrabold text-gray-700">
            Selected Month ({months[selectedMonthIdx]}):
          </span>
          <span className="bg-[#dceef9] text-[#2d9cdb] px-2.5 py-1 rounded-lg text-[11px] font-bold">
            {apiRev?.legend_primary || (isSuperAdmin ? 'Deposits' : 'Referral Bonus')}:{' '}
            {formatCurrency(activeMonthPrim.val)}
          </span>
          <span className="bg-[#ffe3e3] text-[#ff5b5b] px-2.5 py-1 rounded-lg text-[11px] font-bold">
            {apiRev?.legend_secondary || (isSuperAdmin ? 'Bet Stakes' : 'Active Commission')}:{' '}
            {formatCurrency(activeMonthSec.val)}
          </span>
        </div>

        <div className="flex gap-3 items-end">
          {/* Dynamic Y-Axis Labels */}
          <div className="flex flex-col justify-between h-44 text-[10px] text-gray-400 pb-6 pr-1 shrink-0">
            {yLabels.map((lbl, i) => (
              <span key={i}>{lbl}</span>
            ))}
          </div>

          {/* Dynamic 12-Month SVG Chart */}
          <div className="flex-1 relative">
            <svg viewBox="0 0 600 165" className="w-full h-44 overflow-visible">
              {/* Vertical grid lines */}
              {revenueGeometry.primPts.map((pt, idx) => (
                <line
                  key={idx}
                  x1={pt.x}
                  y1="15"
                  x2={pt.x}
                  y2="145"
                  stroke={idx === selectedMonthIdx ? '#2d9cdb' : '#f3f4f6'}
                  strokeDasharray={idx === selectedMonthIdx ? '4 4' : undefined}
                  strokeWidth={idx === selectedMonthIdx ? '1.5' : '1'}
                />
              ))}

              {/* Baseline */}
              <line x1="15" y1="145" x2="585" y2="145" stroke="#e5e7eb" strokeWidth="1" />

              {/* Primary Curve (Blue) */}
              <path
                d={revenueGeometry.primPath}
                fill="none"
                stroke="#2d9cdb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Secondary Curve (Red) */}
              <path
                d={revenueGeometry.secPath}
                fill="none"
                stroke="#ff5b5b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Month Dots */}
              {revenueGeometry.primPts.map((pt, idx) => (
                <circle
                  key={`p-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === selectedMonthIdx ? 6 : 3.5}
                  fill="#2d9cdb"
                  stroke="#fff"
                  strokeWidth="2"
                  onClick={() => setSelectedMonthIdx(idx)}
                  className="cursor-pointer"
                />
              ))}
              {revenueGeometry.secPts.map((pt, idx) => (
                <circle
                  key={`s-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === selectedMonthIdx ? 6 : 3.5}
                  fill="#ff5b5b"
                  stroke="#fff"
                  strokeWidth="2"
                  onClick={() => setSelectedMonthIdx(idx)}
                  className="cursor-pointer"
                />
              ))}
            </svg>

            <div className="grid grid-cols-12 text-center text-[10px] sm:text-[11px] pt-1">
              {months.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonthIdx(idx)}
                  className={`py-0.5 rounded transition ${
                    idx === selectedMonthIdx
                      ? 'bg-[#dceef9] text-[#2d9cdb] font-extrabold'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Real Customer Map / People Referred Weekly Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-col justify-between relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">
            {apiMap?.title ||
              (isSuperAdmin ? 'Customer Map' : 'People Referred Map')}
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={mapPeriod}
              onChange={(e) => setMapPeriod(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Today">Today</option>
            </select>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 z-20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      refreshFn?.();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Data</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-end h-44 pt-4">
          <div className="flex flex-col justify-between h-full text-[11px] text-gray-400 pb-6">
            <span>{maxBarCount}</span>
            <span>{Math.round(maxBarCount * 0.75)}</span>
            <span>{Math.round(maxBarCount * 0.5)}</span>
            <span>0</span>
          </div>

          <div className="flex-1 flex items-end justify-around h-full pb-6 border-b border-gray-100">
            {activeBars.map((bar, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1.5 h-full justify-end"
                title={`${bar.day}: ${bar.count}`}
              >
                <span className="text-[10px] font-bold text-gray-500">
                  {bar.count}
                </span>
                <div
                  className="w-3.5 rounded-t-full transition-all"
                  style={{
                    height: `${Math.max(4, bar.val)}%`,
                    backgroundColor: bar.count > 0 ? bar.color : '#e5e7eb',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-around pl-6 pt-2 text-[11px] text-gray-500 font-semibold">
          {activeBars.map((b, i) => (
            <span key={i}>{b.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
