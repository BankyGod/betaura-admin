import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';

const sampleOrders = [
  { id: 'BA-892411', player: 'Kwame Mensah', legs: 5, stake: 150, payout: 1450, status: 'WON', time: 'Today, 9:24 PM' },
  { id: 'BA-892390', player: 'Abena Darko', legs: 3, stake: 200, payout: 680, status: 'PENDING', time: 'Today, 7:12 PM' },
  { id: 'BA-892312', player: 'Prince Boateng', legs: 6, stake: 300, payout: 2190, status: 'WON', time: 'Today, 5:30 PM' },
  { id: 'BA-892204', player: 'Ama Serwaa', legs: 4, stake: 120, payout: 490, status: 'ONGOING', time: 'Today, 2:18 PM' },
  { id: 'BA-892118', player: 'David Okrah', legs: 2, stake: 250, payout: 525, status: 'WON', time: 'Today, 11:45 AM' },
];

export default function Orders() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Bet Tickets (Order List)</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Recent sportsbook bet slips and settlement statuses
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/order-detail')}
          className="rounded-xl bg-[#00b074] text-white px-4 py-2 text-xs font-bold"
        >
          Verify Ticket Code
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Player</th>
                <th className="px-5 py-3.5">Selections</th>
                <th className="px-5 py-3.5">Stake</th>
                <th className="px-5 py-3.5">Potential Return</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sampleOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-bold text-gray-900">{o.id}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{o.player}</td>
                  <td className="px-5 py-3.5 text-gray-500">{o.legs} Legs</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{formatCurrency(o.stake)}</td>
                  <td className="px-5 py-3.5 font-bold text-[#00b074]">{formatCurrency(o.payout)}</td>
                  <td className="px-5 py-3.5 text-gray-400">{o.time}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.status === 'WON'
                          ? 'bg-[#d9f3ea] text-[#00b074]'
                          : 'bg-blue-50 text-[#2d9cdb]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

