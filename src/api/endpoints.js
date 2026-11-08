import apiClient from './client';

export const adminApi = {
  // System & Database Health / Counts
  getHealth: () => apiClient.get('/health'),
  getNeonStatus: () => apiClient.get('/api/v1/neon/status'),
  invokeNeonAnalytics: (action = 'odds-analytics') =>
    apiClient.post('/api/v1/neon/functions/invoke', {
      function_slug: 'betauraapi',
      action,
      payload: {},
    }),

  // Authentication
  login: (phone_number, password) =>
    apiClient.post('/api/v1/auth/login', { phone_number, password }),
  getProfile: () => apiClient.get('/api/v1/auth/me'),

  // Fixtures & Live Feed Management
  getFixtures: (params = {}) => apiClient.get('/api/v1/fixtures', { params }),
  getSportsTree: () => apiClient.get('/api/v1/fixtures/sports-tree'),
  syncLiveFixtures: () => apiClient.post('/api/v1/fixtures/sync-live'),
  syncUpcomingFixtures: () => apiClient.post('/api/v1/fixtures/sync-upcoming'),
  syncAllFixtures: () => apiClient.post('/api/v1/fixtures/maintenance/sync-all-fixtures'),

  // Trading & Market Controls (SRD Section 15 & 20)
  suspendMarket: (payload) => apiClient.post('/api/v1/admin/trading/suspend-market', payload),
  unsuspendMarket: (payload) => apiClient.post('/api/v1/admin/trading/unsuspend-market', payload),
  overrideOdds: (payload) => apiClient.post('/api/v1/admin/trading/override-odds', payload),
  settleMatch: (payload) => apiClient.post('/api/v1/admin/settlement/settle-match', payload),

  // KYC, Finance & Compliance Audit
  approveKyc: (userId) => apiClient.post(`/api/v1/admin/kyc/${userId}/approve`),
  approveWithdrawal: (transactionId) =>
    apiClient.post(`/api/v1/admin/finance/withdrawals/${transactionId}/approve`),
  getAuditLogs: () => apiClient.get('/api/v1/admin/audit-logs'),

  // Ticket Verification & Wallet
  verifyTicket: (code) => apiClient.get(`/api/v1/bets/verify/${encodeURIComponent(code)}`),
  getWalletBalance: () => apiClient.get('/api/v1/wallet/balance'),
  getTransactions: () => apiClient.get('/api/v1/wallet/transactions'),
  getReferralStats: () => apiClient.get('/api/v1/referral/stats'),
};
