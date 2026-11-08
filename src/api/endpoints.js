import apiClient from './client';

export const adminApi = {
  // 1. Health & Diagnostics
  getHealth: () => apiClient.get('/health'),

  // 2. Authentication & Account Management (/api/v1/auth/*)
  login: (phone_number, password) =>
    apiClient.post('/api/v1/auth/login', { phone_number, password }),
  register: (payload) => apiClient.post('/api/v1/auth/register', payload),
  getProfile: () => apiClient.get('/api/v1/auth/me'),
  updateProfile: (payload) => apiClient.put('/api/v1/auth/profile', payload),
  submitKyc: (payload) => apiClient.post('/api/v1/auth/kyc/submit', payload),
  cleanupAccount: (identifier) =>
    apiClient.post('/api/v1/auth/cleanup-account', { identifier }),
  purgeAllAccounts: (secret_key) =>
    apiClient.post('/api/v1/auth/maintenance/purge-all-accounts', { secret_key }),

  // 3. Wallet, Deposits, Withdrawals & Referrals (/api/v1/wallet/* & /api/v1/referral/*)
  getWalletBalance: () => apiClient.get('/api/v1/wallet/balance'),
  syncWallet: (balance) => apiClient.post('/api/v1/wallet/sync-wallet', { balance }),
  getTransactions: () => apiClient.get('/api/v1/wallet/transactions'),
  initiateDeposit: (payload) => apiClient.post('/api/v1/wallet/deposit/initiate', payload),
  demoTopup: (payload) => apiClient.post('/api/v1/wallet/deposit/demo-topup', payload),
  requestWithdrawal: (payload) => apiClient.post('/api/v1/wallet/withdraw', payload),
  getReferralStats: () => apiClient.get('/api/v1/referral/stats'),

  // 4. Fixtures, Markets & Live Feed Ingestion (/api/v1/fixtures/*)
  getSportsTree: () => apiClient.get('/api/v1/fixtures/sports-tree'),
  getFixtures: (params = {}) => apiClient.get('/api/v1/fixtures', { params }),
  getFixtureDetail: (fixtureId) =>
    apiClient.get(`/api/v1/fixtures/${encodeURIComponent(fixtureId)}`),
  ingestFixtures: (sport_key = 'all') =>
    apiClient.post(`/api/v1/fixtures/ingest?sport_key=${encodeURIComponent(sport_key)}`),
  syncLiveFixtures: () => apiClient.post('/api/v1/fixtures/sync-live'),
  syncUpcomingFixtures: () => apiClient.post('/api/v1/fixtures/sync-upcoming'),
  syncAllFixtures: () =>
    apiClient.post('/api/v1/fixtures/maintenance/sync-all-fixtures'),

  // 5. Bet Tickets, Booking Codes, Sync & Slip Verification (/api/v1/bets/*)
  getMyBets: (status) =>
    apiClient.get('/api/v1/bets/my-bets', { params: status ? { status } : {} }),
  syncTicket: (payload) => apiClient.post('/api/v1/bets/sync-ticket', payload),
  verifyTicket: (code) =>
    apiClient.get(`/api/v1/bets/verify/${encodeURIComponent(code)}`),
  loadBookingCode: (code) =>
    apiClient.get(`/api/v1/bets/book/${encodeURIComponent(code)}`),
  createBookingCode: (selections) =>
    apiClient.post('/api/v1/bets/book', { selections }),
  calculateAccumulator: (legs_odds, stake) =>
    apiClient.post('/api/v1/bets/calculate-accumulator', { legs_odds, stake }),
  getCashoutOffer: (betId) =>
    apiClient.get(`/api/v1/bets/${encodeURIComponent(betId)}/cashout-offer`),
  executeCashout: (betId, partial_percent = 100) =>
    apiClient.post(
      `/api/v1/bets/${encodeURIComponent(betId)}/cashout?partial_percent=${partial_percent}`
    ),

  // 6. Super Admin & Back-Office Administration (/api/v1/admin/*)
  getAdminOverview: () => apiClient.get('/api/v1/admin/overview'),
  getAdminAnalytics: (params = {}) =>
    apiClient.get('/api/v1/admin/analytics', { params }),
  getAdminUsers: (limit = 500) =>
    apiClient.get('/api/v1/admin/users', { params: { limit } }),
  createOrLookupUser: (payload) =>
    apiClient.post('/api/v1/admin/users/create-or-lookup', payload),
  manageUserAccount: (identifier, payload) =>
    apiClient.post(
      `/api/v1/admin/users/${encodeURIComponent(identifier)}/manage`,
      payload
    ),
  getAdminBets: (limit = 200) =>
    apiClient.get('/api/v1/admin/bets', { params: { limit } }),
  markTicketWon: (ticketIdentifier, payload = { status: 'WON' }) =>
    apiClient.post(
      `/api/v1/admin/tickets/${encodeURIComponent(ticketIdentifier)}/mark-won`,
      payload
    ),
  getCustomGames: () => apiClient.get('/api/v1/admin/custom-games'),
  createCustomGame: (payload) =>
    apiClient.post('/api/v1/admin/custom-games', payload),
  editCustomGame: (fixtureId, payload) =>
    apiClient.put(`/api/v1/admin/custom-games/${encodeURIComponent(fixtureId)}`, payload),
  deleteCustomGame: (fixtureId) =>
    apiClient.delete(`/api/v1/admin/custom-games/${encodeURIComponent(fixtureId)}`),
  getSubAdmins: () => apiClient.get('/api/v1/admin/sub-admins'),
  saveSubAdmin: (payload) => apiClient.post('/api/v1/admin/sub-admins', payload),
  deleteSubAdmin: (subId) =>
    apiClient.delete(`/api/v1/admin/sub-admins/${encodeURIComponent(subId)}`),
  changeSubAdminPassword: (subId, payload) =>
    apiClient.post(
      `/api/v1/admin/sub-admins/${encodeURIComponent(subId)}/change-password`,
      payload
    ),
  connectSubAdminBetaura: (subId, payload) =>
    apiClient.post(
      `/api/v1/admin/sub-admins/${encodeURIComponent(subId)}/connect-betaura`,
      payload
    ),
  suspendMarket: (payload) =>
    apiClient.post('/api/v1/admin/trading/suspend-market', payload),
  unsuspendMarket: (payload) =>
    apiClient.post('/api/v1/admin/trading/unsuspend-market', payload),
  overrideOdds: (payload) =>
    apiClient.post('/api/v1/admin/trading/override-odds', payload),
  settleMatch: (payload) =>
    apiClient.post('/api/v1/admin/settlement/settle-match', payload),
  approveKyc: (userId) =>
    apiClient.post(`/api/v1/admin/kyc/${encodeURIComponent(userId)}/approve`),
  approveWithdrawal: (transactionId) =>
    apiClient.post(
      `/api/v1/admin/finance/withdrawals/${encodeURIComponent(transactionId)}/approve`
    ),
  getAuditLogs: () => apiClient.get('/api/v1/admin/audit-logs'),

  // =========================================================================
  // 8. Customer Care & Live Support Inbox
  // =========================================================================
  getSupportThreads: () => apiClient.get('/api/v1/admin/support/threads'),
  getSupportThread: (threadId, markRead = true) =>
    apiClient.get(
      `/api/v1/admin/support/threads/${encodeURIComponent(threadId)}?mark_read=${markRead}`
    ),
  replySupportThread: (threadId, payload) =>
    apiClient.post(
      `/api/v1/admin/support/threads/${encodeURIComponent(threadId)}/reply`,
      payload
    ),
  deleteSupportThread: (threadId) =>
    apiClient.delete(`/api/v1/admin/support/threads/${encodeURIComponent(threadId)}`),
  sendSupportMessage: (payload) =>
    apiClient.post('/api/v1/admin/support/messages', payload),
};
