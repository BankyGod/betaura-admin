import { useState } from 'react';
import { MoreVertical, Download } from 'lucide-react';

function DonutChart({ percentage, color, bgTrack, label, showValue }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 110 110">
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
            <div className="w-14 h-14 rounded-full bg-white shadow-xs flex items-center justify-center">
              <span className="text-sm font-extrabold text-gray-900">{percentage}%</span>
            </div>
          </div>
        )}
      </div>
      <span className="mt-3 text-xs font-semibold text-gray-700">{label}</span>
    </div>
  );
}

export default function ChartsMiddleRow() {
  const [showChart, setShowChart] = useState(true);
  const [showValue, setShowValue] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Card: Pie Chart (3 Donuts) */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-gray-900">Pie Chart</h3>
          <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
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
            <button type="button" className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showChart && (
          <div className="grid grid-cols-3 gap-2 py-2">
            <DonutChart
              percentage={81}
              color="#ff5b5b"
              bgTrack="#ffe5e5"
              label="Total Order"
              showValue={showValue}
            />
            <DonutChart
              percentage={22}
              color="#00b074"
              bgTrack="#d9f3ea"
              label="Customer Growth"
              showValue={showValue}
            />
            <DonutChart
              percentage={62}
              color="#2d9cdb"
              bgTrack="#dceef9"
              label="Total Revenue"
              showValue={showValue}
            />
          </div>
        )}
      </div>

      {/* Right Card: Chart Order (Smooth Blue Area Chart) */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Chart Order</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Weekly bet slip & payment volume across BetAura
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d9cdb] px-3.5 py-2 text-xs font-semibold text-[#2d9cdb] hover:bg-[#2d9cdb]/5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Report</span>
          </button>
        </div>

        <div className="relative pt-4">
          {/* Tooltip callout matching Sedap */}
          <div className="absolute left-[38%] top-0 bg-white rounded-xl shadow-md px-3 py-1.5 border border-gray-100 z-10">
            <p className="text-xs font-bold text-gray-800">456 Order</p>
            <p className="text-[10px] text-gray-400">Active Weekly Peak</p>
          </div>

          <svg viewBox="0 0 500 150" className="w-full h-36 overflow-visible">
            <defs>
              <linearGradient id="orderAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2d9cdb" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#2d9cdb" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path
              d="M 10,115 C 35,70 55,70 75,92 C 95,114 125,35 155,40 C 185,45 205,95 235,98 C 265,101 295,60 325,65 C 355,70 375,120 400,100 C 425,80 445,35 475,38 L 490,55 L 490,135 L 10,135 Z"
              fill="url(#orderAreaGrad)"
            />

            {/* Smooth Stroke */}
            <path
              d="M 10,115 C 35,70 55,70 75,92 C 95,114 125,35 155,40 C 185,45 205,95 235,98 C 265,101 295,60 325,65 C 355,70 375,120 400,100 C 425,80 445,35 475,38 L 490,55"
              fill="none"
              stroke="#2d9cdb"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Highlighted Data Dot */}
            <circle
              cx="175"
              cy="55"
              r="6"
              fill="#2d9cdb"
              stroke="#ffffff"
              strokeWidth="3"
            />
          </svg>

          <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 font-medium pt-1">
            <span>Sunday</span>
            <span>Monday</span>
            <span>Tuesday</span>
            <span>Wednesday</span>
            <span>Thursday</span>
            <span>Friday</span>
            <span>Saturday</span>
          </div>
        </div>
      </div>
    </div>
  );
}

