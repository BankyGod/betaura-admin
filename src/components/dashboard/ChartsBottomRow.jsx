import { MoreVertical } from 'lucide-react';

export default function ChartsBottomRow() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Des'];
  const weeklyBars = [
    { day: 'Sun', val: 60, color: '#ff5b5b' },
    { day: 'Mon', val: 80, color: '#f7c604' },
    { day: 'Tue', val: 40, color: '#ff5b5b' },
    { day: 'Wed', val: 68, color: '#f7c604' },
    { day: 'Thu', val: 60, color: '#ff5b5b' },
    { day: 'Fri', val: 25, color: '#f7c604' },
    { day: 'Sat', val: 60, color: '#ff5b5b' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Total Revenue Dual Line Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Total Revenue</h3>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2d9cdb]" />
              2025
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5b5b]" />
              2026
            </span>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between h-44 text-[11px] text-gray-400 pb-6 pr-1">
            <span>GH₵40k</span>
            <span>GH₵30k</span>
            <span>GH₵20k</span>
            <span>GH₵10k</span>
          </div>

          {/* Dual Bezier SVG Chart */}
          <div className="flex-1 relative">
            {/* Callout Badges */}
            <div className="absolute left-[40%] top-2 bg-[#dceef9] text-[#2d9cdb] px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs">
              GH₵ 38,753.00
            </div>
            <div className="absolute right-[16%] bottom-14 bg-[#ffe3e3] text-[#ff5b5b] px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs">
              GH₵ 12,657.00
            </div>

            <svg viewBox="0 0 600 180" className="w-full h-44 overflow-visible">
              {/* Vertical grid lines */}
              {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550].map((x) => (
                <line
                  key={x}
                  x1={x}
                  y1="10"
                  x2={x}
                  y2="155"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}

              {/* Dashed highlight lines */}
              <line
                x1="275"
                y1="42"
                x2="275"
                y2="155"
                stroke="#2d9cdb"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <line
                x1="465"
                y1="20"
                x2="465"
                y2="155"
                stroke="#9ca3af"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />

              {/* Blue Curve (2025) */}
              <path
                d="M 15,145 C 50,105 90,115 140,115 C 190,115 230,42 275,42 C 320,42 360,115 410,115 C 460,115 510,95 575,102"
                fill="none"
                stroke="#2d9cdb"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Red Curve (2026) */}
              <path
                d="M 15,120 C 45,35 70,145 105,145 C 140,145 180,35 215,35 C 250,35 265,105 300,105 C 335,105 360,35 395,35 C 430,35 445,130 465,130 C 495,130 535,38 575,42"
                fill="none"
                stroke="#ff5b5b"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Highlighted Dots */}
              <circle cx="275" cy="42" r="5" fill="#2d9cdb" stroke="#fff" strokeWidth="2" />
              <circle cx="465" cy="130" r="5" fill="#ff5b5b" stroke="#fff" strokeWidth="2" />
            </svg>

            <div className="grid grid-cols-12 text-center text-[11px] text-gray-400 pt-1">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Customer Map Weekly Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Customer Map</h3>
          <div className="flex items-center gap-2">
            <select
              defaultValue="Weekly"
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Today">Today</option>
            </select>
            <button type="button" className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-end h-44 pt-4">
          <div className="flex flex-col justify-between h-full text-[11px] text-gray-400 pb-6">
            <span>80</span>
            <span>60</span>
            <span>40</span>
            <span>20</span>
          </div>

          <div className="flex-1 flex items-end justify-around h-full pb-6 border-b border-gray-100">
            {weeklyBars.map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-3 rounded-t-full transition-all"
                  style={{
                    height: `${bar.val}%`,
                    backgroundColor: bar.color,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-around pl-6 pt-2 text-[11px] text-gray-400">
          {weeklyBars.map((b, i) => (
            <span key={i}>{b.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

