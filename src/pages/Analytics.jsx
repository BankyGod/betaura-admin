import ChartsMiddleRow from '../components/dashboard/ChartsMiddleRow';
import ChartsBottomRow from '../components/dashboard/ChartsBottomRow';
import EarningsSummary from '../components/dashboard/EarningsSummary';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Analytics & Performance</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Revenue breakdown, bet order trends, and customer growth metrics
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50">
        <EarningsSummary today={820} week={3210} month={12750} />
      </div>

      <ChartsMiddleRow />
      <ChartsBottomRow />
    </div>
  );
}
