import { useState, useEffect } from 'react';
import { adminApi } from '../api/endpoints';
import { formatCurrency } from '../utils/formatters';

export function useDashboardData() {
  const [data, setData] = useState({
    totalBalance: 5420,
    todayGain: 820,
    earnings: {
      today: 820,
      week: 3210,
      month: 12750,
    },
    referralsCount: 87,
    kpi: {
      totalOrders: 75,
      totalDelivered: 357,
      totalCanceled: 65,
      totalRevenueFormatted: formatCurrency(5420),
    },
    systemStats: null,
    recentPayments: [
      { id: 1, name: 'Kwame Mensah', time: 'Today, 9:24 PM', amount: 150 },
      { id: 2, name: 'Abena Darko', time: 'Today, 7:12 PM', amount: 200 },
      { id: 3, name: 'Prince Boateng', time: 'Today, 5:30 PM', amount: 300 },
      { id: 4, name: 'Ama Serwaa', time: 'Today, 2:18 PM', amount: 120 },
      { id: 5, name: 'David Okrah', time: 'Today, 11:45 AM', amount: 250 },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await adminApi.getNeonStatus();
        if (isMounted && res?.data?.services?.postgres) {
          const pg = res.data.services.postgres;
          setData((prev) => ({
            ...prev,
            systemStats: res.data,
            kpi: {
              ...prev.kpi,
              totalOrders: pg.fixtures_count || prev.kpi.totalOrders,
              totalDelivered: pg.market_odds_count || prev.kpi.totalDelivered,
              totalCanceled: pg.users_count || prev.kpi.totalCanceled,
            },
          }));
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}
