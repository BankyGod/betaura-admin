import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/endpoints';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export function useDashboardData() {
  const { authReady, admin } = useAuth();
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );
  const connectedAcc = admin?.connectedBetauraAccount;

  const [data, setData] = useState({
    totalBalance: 0,
    bonusBalance: 0,
    currency: 'GH₵',
    todayGain: 0,
    earnings: {
      today: 0,
      week: 0,
      month: 0,
    },
    referralsCount: 0,
    referralCode: isSuperAdmin
      ? 'AURA-PROFIT'
      : connectedAcc?.referral_code || 'CONNECT-ACCOUNT',
    referralBonusEarned: 0,
    referredPeople: connectedAcc?.referred_people || [],
    kpi: {
      totalOrders: 0,
      totalDelivered: 0,
      totalCanceled: 0,
      totalRevenueFormatted: formatCurrency(0),
    },
    sportsTree: [],
    totalLiveMatches: 0,
    apiHealth: null,
    bets: [],
    transactions: [],
    recentPayments: [],
    analytics: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // SUB-ADMIN MODE: Strictly referral earnings, people referred, and referral analytics
      if (!isSuperAdmin) {
        const [healthRes, treeRes, refRes, betsRes, txRes, usersRes, analyticsRes] =
          await Promise.allSettled([
            adminApi.getHealth(),
            adminApi.getSportsTree(),
            connectedAcc ? adminApi.getReferralStats() : Promise.resolve(null),
            connectedAcc ? adminApi.getMyBets() : Promise.resolve(null),
            connectedAcc ? adminApi.getTransactions() : Promise.resolve(null),
            adminApi.getAdminUsers(500),
            adminApi.getAdminAnalytics({
              mode: 'SUB_ADMIN',
              sub_id: admin?.id,
              referral_code: connectedAcc?.referral_code,
              identifier:
                connectedAcc?.phone_number ||
                connectedAcc?.username ||
                admin?.phone_number ||
                admin?.username,
            }),
          ]);

        setData((prev) => {
          const next = { ...prev };

          if (healthRes.status === 'fulfilled' && healthRes.value?.data) {
            next.apiHealth = healthRes.value.data;
          }

          if (treeRes.status === 'fulfilled' && Array.isArray(treeRes.value?.data)) {
            next.sportsTree = treeRes.value.data;
            next.totalLiveMatches = treeRes.value.data.reduce(
              (sum, s) => sum + Number(s.total_matches || 0),
              0
            );
          }

          let refEarned = Number(connectedAcc?.referral_earnings || 0);
          let refInvited = Number(connectedAcc?.total_invited || 0);
          let refCode =
            connectedAcc?.referral_code ||
            `AURA-${(admin?.username || admin?.phone_number || 'SUB').slice(-4).toUpperCase()}`;
          let bonusBal = Number(connectedAcc?.bonus_balance || 0);
          let peopleList = Array.isArray(connectedAcc?.referred_people)
            ? [...connectedAcc.referred_people]
            : [];
          let earningsBreakdown = null;

          if (refRes.status === 'fulfilled' && refRes.value?.data) {
            const r = refRes.value.data;
            if (r.referral_code) refCode = r.referral_code;
            if (r.total_invited !== undefined) refInvited = Number(r.total_invited || 0);
            if (r.bonus_earned !== undefined) refEarned = Number(r.bonus_earned || 0);
            if (r.bonus_balance !== undefined) bonusBal = Number(r.bonus_balance || 0);
            if (Array.isArray(r.referred_people) && r.referred_people.length > 0) {
              peopleList = r.referred_people;
            }
            if (r.earnings) {
              earningsBreakdown = r.earnings;
            }
          }

          if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data)) {
            const allUsers = usersRes.value.data;
            const myCodes = new Set(
              [
                refCode,
                connectedAcc?.referral_code,
                connectedAcc?.username,
                admin?.username,
                admin?.phone_number,
              ]
                .filter(Boolean)
                .map((x) => String(x).toLowerCase())
            );

            const matchedFromUsers = allUsers
              .filter(
                (u) =>
                  u.referred_by &&
                  myCodes.has(String(u.referred_by).toLowerCase())
              )
              .map((u) => ({
                id: u.id,
                name: u.name || u.username || u.phone,
                username: u.username,
                phone: u.phone,
                status: u.status,
                tier: u.tier || 1,
                deposit_active: Number(u.balance || 0) > 0,
                commission_earned:
                  Number(u.balance || 0) > 0
                    ? Math.round(Math.max(25, Number(u.balance) * 0.25) * 100) / 100
                    : 0,
                joined: u.created_at
                  ? new Date(u.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent',
              }));

            const byId = new Map();
            [...peopleList, ...matchedFromUsers].forEach((p) => {
              if (p?.id && !byId.has(p.id)) byId.set(p.id, p);
            });
            peopleList = Array.from(byId.values());
            if (peopleList.length > refInvited) {
              refInvited = peopleList.length;
            }
          }

          const commissionFromPeople = peopleList.reduce(
            (sum, p) => sum + Number(p.commission_earned || 0),
            0
          );
          const effectiveReferralMoney = Math.max(
            refEarned,
            bonusBal,
            commissionFromPeople
          );

          next.totalBalance = effectiveReferralMoney;
          next.bonusBalance = bonusBal;
          next.referralBonusEarned = effectiveReferralMoney;
          next.referralsCount = refInvited;
          next.referralCode = refCode;
          next.referredPeople = peopleList;
          next.todayGain = Number(earningsBreakdown?.today ?? 0);
          next.earnings = {
            today: Number(earningsBreakdown?.today ?? 0),
            week: Number(earningsBreakdown?.week ?? 0),
            month: Number(earningsBreakdown?.month ?? 0),
          };

          let myBetsList = [];
          if (betsRes.status === 'fulfilled' && Array.isArray(betsRes.value?.data)) {
            myBetsList = betsRes.value.data;
          }
          next.bets = myBetsList;

          const wonCount = myBetsList.filter((b) => b.status === 'WON').length;
          const lostCount = myBetsList.filter((b) =>
            ['LOST', 'VOIDED', 'CANCELLED'].includes(b.status)
          ).length;

          next.kpi = {
            totalOrders: myBetsList.length,
            totalDelivered: wonCount,
            totalCanceled: lostCount,
            totalRevenueFormatted: formatCurrency(effectiveReferralMoney),
          };

          if (txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data)) {
            const refTxs = txRes.value.data.filter((t) =>
              ['REFERRAL_BONUS', 'BONUS'].includes((t.type || '').toUpperCase())
            );
            next.recentPayments = refTxs.map((tx, idx) => ({
              id: tx.id || idx,
              name: `Referral Commission (${refCode})`,
              time: tx.created_at
                ? new Date(tx.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Recent',
              amount: Math.abs(Number(tx.amount || 0)),
              type: tx.type,
              reference: tx.reference,
              status: tx.status,
            }));
          } else {
            next.recentPayments = [];
          }

          if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
            const an = analyticsRes.value.data;
            next.analytics = an;
            if (an.earnings) {
              next.earnings = {
                today: Number(an.earnings.today ?? next.earnings.today),
                week: Number(an.earnings.week ?? next.earnings.week),
                month: Number(an.earnings.month ?? next.earnings.month),
              };
              next.todayGain = next.earnings.today;
            }
            if (
              Array.isArray(an.referred_people) &&
              an.referred_people.length > next.referredPeople.length
            ) {
              next.referredPeople = an.referred_people;
              next.referralsCount = an.referred_people.length;
            }
          }

          return next;
        });
        return;
      }

      // SUPER ADMIN MODE: 100% Real Platform Data from Backend API
      const [
        healthRes,
        treeRes,
        overviewRes,
        walletRes,
        txRes,
        refRes,
        adminBetsRes,
        analyticsRes,
      ] = await Promise.allSettled([
        adminApi.getHealth(),
        adminApi.getSportsTree(),
        adminApi.getAdminOverview(),
        adminApi.getWalletBalance(),
        adminApi.getTransactions(),
        adminApi.getReferralStats(),
        adminApi.getAdminBets(200),
        adminApi.getAdminAnalytics({ mode: 'SUPER_ADMIN' }),
      ]);

      setData((prev) => {
        const next = { ...prev };

        if (healthRes.status === 'fulfilled' && healthRes.value?.data) {
          next.apiHealth = healthRes.value.data;
        }

        if (treeRes.status === 'fulfilled' && Array.isArray(treeRes.value?.data)) {
          next.sportsTree = treeRes.value.data;
          next.totalLiveMatches = treeRes.value.data.reduce(
            (sum, s) => sum + Number(s.total_matches || 0),
            0
          );
        }

        if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
          const ov = overviewRes.value.data;
          next.totalBalance = Number(ov.total_balance ?? 0);
          next.todayGain = Number(ov.today_gain ?? 0);
          if (ov.earnings) {
            next.earnings = {
              today: Number(ov.earnings.today ?? 0),
              week: Number(ov.earnings.week ?? 0),
              month: Number(ov.earnings.month ?? 0),
            };
          }
          if (ov.kpi) {
            next.kpi = {
              totalOrders: Number(ov.kpi.total_orders ?? 0),
              totalDelivered: Number(ov.kpi.total_delivered ?? 0),
              totalCanceled: Number(ov.kpi.total_canceled ?? 0),
              totalRevenueFormatted: formatCurrency(
                Number(ov.kpi.total_revenue ?? next.totalBalance)
              ),
            };
          }
          if (ov.referrals_count !== undefined) {
            next.referralsCount = Number(ov.referrals_count ?? 0);
          }
          if (Array.isArray(ov.recent_payments)) {
            next.recentPayments = ov.recent_payments;
          }
        }

        if (walletRes.status === 'fulfilled' && walletRes.value?.data) {
          const w = walletRes.value.data;
          next.bonusBalance = Number(w.bonus_balance || 0);
        }

        if (txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data)) {
          const txs = txRes.value.data;
          next.transactions = txs;
          if (
            txs.length > 0 &&
            (!overviewRes.value?.data?.recent_payments ||
              overviewRes.value.data.recent_payments.length === 0)
          ) {
            next.recentPayments = txs.slice(0, 10).map((tx, idx) => ({
              id: tx.id || idx,
              name: tx.external_provider || tx.type || 'Transaction',
              time: tx.created_at
                ? new Date(tx.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Recent',
              amount: Math.abs(Number(tx.amount || 0)),
              type: tx.type,
              reference: tx.reference,
              status: tx.status,
            }));
          }
        }

        if (refRes.status === 'fulfilled' && refRes.value?.data) {
          const r = refRes.value.data;
          if (r.referral_code) next.referralCode = r.referral_code;
          if (r.bonus_earned !== undefined) {
            next.referralBonusEarned = Number(r.bonus_earned || 0);
          }
          if (Array.isArray(r.referred_people)) {
            next.referredPeople = r.referred_people;
          }
        }

        if (
          adminBetsRes.status === 'fulfilled' &&
          Array.isArray(adminBetsRes.value?.data)
        ) {
          const allBets = adminBetsRes.value.data;
          next.bets = allBets;
          // Compute real KPIs directly from real backend bets if overview had 0
          const realTotalOrders = allBets.length;
          const realDelivered = allBets.filter((b) =>
            ['WON', 'CASHED_OUT'].includes(b.status)
          ).length;
          const realCanceled = allBets.filter((b) =>
            ['LOST', 'VOIDED', 'CANCELLED'].includes(b.status)
          ).length;
          const realStakesSum = allBets.reduce(
            (sum, b) => sum + Number(b.stake || 0),
            0
          );

          next.kpi = {
            totalOrders: realTotalOrders,
            totalDelivered: realDelivered,
            totalCanceled: realCanceled,
            totalRevenueFormatted: formatCurrency(
              next.totalBalance > 0 ? next.totalBalance : realStakesSum
            ),
          };
          if (next.totalBalance === 0 && realStakesSum > 0) {
            next.totalBalance = realStakesSum;
          }
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
          next.analytics = analyticsRes.value.data;
        }

        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, connectedAcc, admin]);

  useEffect(() => {
    if (authReady) {
      loadDashboard();
    }
  }, [authReady, loadDashboard]);

  return { data, loading, error, refresh: loadDashboard };
}
