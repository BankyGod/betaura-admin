import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Eye,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Link2,
  RefreshCw,
  Search,
  Users,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/endpoints';
import { formatCurrency } from '../utils/formatters';

const PERMISSION_META = [
  // 1. Dashboard & Financial Intelligence
  {
    key: 'view_dashboard',
    category: 'Dashboard & Reports',
    label: 'View Dashboard & Financial KPIs',
    desc: 'Can see main dashboard financial summary, gross gaming revenue (GGR), and KPI cards',
  },
  {
    key: 'view_analytics',
    category: 'Dashboard & Reports',
    label: 'Analytics & Revenue Performance',
    desc: 'Can view revenue charts, betting turnover, customer retention graphs, and daily stats',
  },
  {
    key: 'export_reports',
    category: 'Dashboard & Reports',
    label: 'Download & Export Financial CSVs',
    desc: 'Can download bet tickets, player ledger, cash flow, and tax reporting spreadsheets',
  },

  // 2. Custom Game & Goal Scripting Engine
  {
    key: 'create_games',
    category: 'Games & Goal Scripting',
    label: 'Create Custom Games & Match Profiles',
    desc: 'Can scaffold custom soccer fixtures, pick leagues, teams, and kickoff timestamps',
  },
  {
    key: 'edit_games',
    category: 'Games & Goal Scripting',
    label: 'Edit Created Games & Markets',
    desc: 'Can modify existing custom match names, leagues, kickoff times, or delete games',
  },
  {
    key: 'script_goals',
    category: 'Games & Goal Scripting',
    label: 'Script Goal Times & Scorers',
    desc: 'Can script exact minute-by-minute goal events (e.g. 14\', 45\'+2, 89\') and goal scorers',
  },
  {
    key: 'script_cards',
    category: 'Games & Goal Scripting',
    label: 'Script Cards, Penalties & VAR',
    desc: 'Can script yellow cards, red cards, penalties, and disallowed VAR moments',
  },
  {
    key: 'control_match_clock',
    category: 'Games & Goal Scripting',
    label: 'Match Whistle & Clock Fast-Forward',
    desc: 'Can manually advance the match clock, trigger HT break, and blow full-time whistle',
  },
  {
    key: 'mix_booking',
    category: 'Games & Goal Scripting',
    label: 'Mix Games & Generate Booking Codes',
    desc: 'Can combine custom scripted matches with real live API fixtures into booking codes',
  },

  // 3. Bet Slips & Ticket Settlement Operations
  {
    key: 'view_bets',
    category: 'Tickets & Payouts',
    label: 'Inspect Bet Slips & Selections',
    desc: 'Can search all placed bets, inspect multi-leg selections, stakes, and player IP addresses',
  },
  {
    key: 'override_tickets',
    category: 'Tickets & Payouts',
    label: 'Update Lost/Pending Tickets to WON',
    desc: 'Can flip any LOST or PENDING bet slip to WON, recalculate multiplier, and force payouts',
  },
  {
    key: 'void_cancel_bets',
    category: 'Tickets & Payouts',
    label: 'Void, Cancel & Refund Bet Slips',
    desc: 'Can void erroneous or postponed legs and refund stakes directly to punter wallets',
  },
  {
    key: 'settle_payouts',
    category: 'Tickets & Payouts',
    label: 'Trigger Bet Payout Settlement Engine',
    desc: 'Can run automated payout distribution and credit punter balance for winning betslips',
  },

  // 4. Player, KYC & Customer Management
  {
    key: 'manage_users',
    category: 'Players & Accounts',
    label: 'Manage Players & Betting Activity',
    desc: 'Can view customer directory, transaction histories, wallet balances, and user details',
  },
  {
    key: 'create_customer',
    category: 'Players & Accounts',
    label: 'Add & Register Players Manually',
    desc: 'Can register new player accounts with initial password, tier, and starting wallet balance',
  },
  {
    key: 'suspend_users',
    category: 'Players & Accounts',
    label: 'Suspend & Ban Player Accounts',
    desc: 'Can lock out players, kick active sessions off the platform, and require support contact',
  },
  {
    key: 'delete_users',
    category: 'Players & Accounts',
    label: 'Delete Single Player Account',
    desc: 'Can purge individual player profile and betting records permanently',
  },
  {
    key: 'purge_customers',
    category: 'Players & Accounts',
    label: 'Purge All Customer Accounts (Super)',
    desc: 'Can wipe all non-admin customer records and reset the user database completely',
  },
  {
    key: 'reset_passwords',
    category: 'Players & Accounts',
    label: '1-Click Player Password Reset',
    desc: 'Can generate new temporary passwords and reset locked-out customer accounts',
  },
  {
    key: 'upgrade_kyc',
    category: 'Players & Accounts',
    label: 'Upgrade VIP Levels (Tier 1-4)',
    desc: 'Can approve KYC IDs, verify national identity cards, and elevate deposit/stake limits',
  },
  {
    key: 'adjust_balance',
    category: 'Players & Accounts',
    label: 'Credit / Debit Player Balances',
    desc: 'Can perform direct wallet credit or debit adjustments on any punter account',
  },

  // 5. Trading Desk & Market Operations
  {
    key: 'manage_trading',
    category: 'Trading & Markets',
    label: 'Trading Desk & Live Overview',
    desc: 'Can access live match trading console, monitor exposure, and oversee active books',
  },
  {
    key: 'suspend_markets',
    category: 'Trading & Markets',
    label: 'Freeze & Suspend Live Markets',
    desc: 'Can freeze betting markets, lock odds, and broadcast instant suspension to all clients',
  },
  {
    key: 'override_odds',
    category: 'Trading & Markets',
    label: 'Override Live Odds & Multipliers',
    desc: 'Can adjust Home/Draw/Away and Over/Under odds multipliers in real time',
  },
  {
    key: 'adjust_margins',
    category: 'Trading & Markets',
    label: 'Adjust House Profit Margin %',
    desc: 'Can tune bookmaker commission percentage and overround on match betting markets',
  },
  {
    key: 'settle_matches',
    category: 'Trading & Markets',
    label: 'Match Whistle & FT Settlement Engine',
    desc: 'Can mark matches concluded, set official FT scores, and trigger automatic payouts',
  },

  // 6. Fixtures, Schedules & Sports Data Feed
  {
    key: 'view_fixtures',
    category: 'Fixtures & Data Feed',
    label: 'Fixtures & Match Schedule Inspector',
    desc: 'Can search upcoming matches, league fixtures, team lineups, and verify raw odds',
  },
  {
    key: 'live_feed_sync',
    category: 'Fixtures & Data Feed',
    label: 'Force Live Sports API Feed Sync',
    desc: 'Can trigger immediate API sync to fetch latest fixtures and scores from data providers',
  },
  {
    key: 'free_db_space',
    category: 'Fixtures & Data Feed',
    label: 'Free DB Space & Prune Expired Matches',
    desc: 'Can purge historical expired matches, orphaned odds, and optimize database storage',
  },

  // 7. Wallet, Banking & Treasury
  {
    key: 'manage_wallet',
    category: 'Wallet & Treasury',
    label: 'Treasury Balances & Vault Cashflow',
    desc: 'Can inspect platform total reserves, gross deposits, pending payouts, and cash ledger',
  },
  {
    key: 'approve_withdrawals',
    category: 'Wallet & Treasury',
    label: 'Approve High-Value Withdrawals',
    desc: 'Can review, approve, or reject player MoMo and bank withdrawal payout requests',
  },
  {
    key: 'view_payment_logs',
    category: 'Wallet & Treasury',
    label: 'Payment Gateway Transaction Logs',
    desc: 'Can inspect Paystack, Flutterwave, and Mobile Money API payment receipts and webhooks',
  },

  // 8. Referral Program & Affiliate Commission
  {
    key: 'manage_referrals',
    category: 'Referrals & Growth',
    label: 'Referral Program & 70% First Deposit Share',
    desc: 'Can track affiliate links, punter acquisition, downstream bets, and calculate earnings',
  },
  {
    key: 'adjust_commissions',
    category: 'Referrals & Growth',
    label: 'Affiliate Commission Rate Overrides',
    desc: 'Can set custom affiliate commission percentages and override partner tier payouts',
  },

  // 9. Customer Care & Live Communications
  {
    key: 'customer_support',
    category: 'Support & Alerts',
    label: 'Customer Care & Live Chat Desk',
    desc: 'Can view customer support inbox, reply to live chats, and resolve player tickets',
  },
  {
    key: 'broadcast_alerts',
    category: 'Support & Alerts',
    label: 'Broadcast Platform Notices & Alerts',
    desc: 'Can send system-wide maintenance banners, promotional popups, and player SMS alerts',
  },

  // 10. Audit, Security & Administration
  {
    key: 'view_audit_logs',
    category: 'Security & Compliance',
    label: 'Audit Logs & Tamper-Evident Trail',
    desc: 'Can inspect immutable security audit trail of all staff logins, odds edits, and payouts',
  },
  {
    key: 'regulatory_compliance',
    category: 'Security & Compliance',
    label: 'AML & Fraud Regulatory Compliance',
    desc: 'Can inspect suspicious betting activity, multi-account collisions, and AML flags',
  },
  {
    key: 'manage_subadmins',
    category: 'Security & Compliance',
    label: 'Manage Sub-Admins (Super Admin Only)',
    desc: 'Full control over creating sub-admins, managing staff accounts, and setting permissions',
  },
];

const ROLE_PRESETS = {
  'Super Administrator (Full)': {
    view_dashboard: true,
    view_analytics: true,
    export_reports: true,
    create_games: true,
    edit_games: true,
    script_goals: true,
    script_cards: true,
    control_match_clock: true,
    mix_booking: true,
    view_bets: true,
    override_tickets: true,
    void_cancel_bets: true,
    settle_payouts: true,
    manage_users: true,
    create_customer: true,
    suspend_users: true,
    delete_users: true,
    purge_customers: true,
    reset_passwords: true,
    upgrade_kyc: true,
    adjust_balance: true,
    manage_trading: true,
    suspend_markets: true,
    override_odds: true,
    adjust_margins: true,
    settle_matches: true,
    view_fixtures: true,
    live_feed_sync: true,
    free_db_space: true,
    manage_wallet: true,
    approve_withdrawals: true,
    view_payment_logs: true,
    manage_referrals: true,
    adjust_commissions: true,
    customer_support: true,
    broadcast_alerts: true,
    view_audit_logs: true,
    regulatory_compliance: true,
    manage_subadmins: true,
  },
  'Full Operations Co-Admin': {
    view_dashboard: true,
    view_analytics: true,
    export_reports: true,
    create_games: true,
    edit_games: true,
    script_goals: true,
    script_cards: true,
    control_match_clock: true,
    mix_booking: true,
    view_bets: true,
    override_tickets: true,
    void_cancel_bets: true,
    settle_payouts: true,
    manage_users: true,
    create_customer: true,
    suspend_users: true,
    delete_users: true,
    purge_customers: false,
    reset_passwords: true,
    upgrade_kyc: true,
    adjust_balance: true,
    manage_trading: true,
    suspend_markets: true,
    override_odds: true,
    adjust_margins: true,
    settle_matches: true,
    view_fixtures: true,
    live_feed_sync: true,
    free_db_space: true,
    manage_wallet: true,
    approve_withdrawals: true,
    view_payment_logs: true,
    manage_referrals: true,
    adjust_commissions: true,
    customer_support: true,
    broadcast_alerts: true,
    view_audit_logs: true,
    regulatory_compliance: true,
    manage_subadmins: false,
  },
  'Senior Trading & Odds Manager': {
    view_dashboard: true,
    view_analytics: true,
    export_reports: true,
    create_games: true,
    edit_games: true,
    script_goals: true,
    script_cards: true,
    control_match_clock: true,
    mix_booking: true,
    view_bets: true,
    override_tickets: true,
    void_cancel_bets: true,
    settle_payouts: true,
    manage_users: false,
    create_customer: false,
    suspend_users: false,
    delete_users: false,
    purge_customers: false,
    reset_passwords: false,
    upgrade_kyc: false,
    adjust_balance: false,
    manage_trading: true,
    suspend_markets: true,
    override_odds: true,
    adjust_margins: true,
    settle_matches: true,
    view_fixtures: true,
    live_feed_sync: true,
    free_db_space: false,
    manage_wallet: false,
    approve_withdrawals: false,
    view_payment_logs: false,
    manage_referrals: false,
    adjust_commissions: false,
    customer_support: false,
    broadcast_alerts: false,
    view_audit_logs: true,
    regulatory_compliance: true,
    manage_subadmins: false,
  },
  'Match Fixing & Scripting Specialist': {
    view_dashboard: true,
    view_analytics: false,
    export_reports: false,
    create_games: true,
    edit_games: true,
    script_goals: true,
    script_cards: true,
    control_match_clock: true,
    mix_booking: true,
    view_bets: true,
    override_tickets: true,
    void_cancel_bets: false,
    settle_payouts: true,
    manage_users: false,
    create_customer: false,
    suspend_users: false,
    delete_users: false,
    purge_customers: false,
    reset_passwords: false,
    upgrade_kyc: false,
    adjust_balance: false,
    manage_trading: true,
    suspend_markets: true,
    override_odds: false,
    adjust_margins: false,
    settle_matches: true,
    view_fixtures: true,
    live_feed_sync: false,
    free_db_space: false,
    manage_wallet: false,
    approve_withdrawals: false,
    view_payment_logs: false,
    manage_referrals: false,
    adjust_commissions: false,
    customer_support: false,
    broadcast_alerts: false,
    view_audit_logs: false,
    regulatory_compliance: false,
    manage_subadmins: false,
  },
  'Bet Slip & Ticket Settlement Officer': {
    view_dashboard: true,
    view_analytics: false,
    export_reports: true,
    create_games: false,
    edit_games: false,
    script_goals: false,
    script_cards: false,
    control_match_clock: false,
    mix_booking: true,
    view_bets: true,
    override_tickets: true,
    void_cancel_bets: true,
    settle_payouts: true,
    manage_users: true,
    create_customer: false,
    suspend_users: false,
    delete_users: false,
    purge_customers: false,
    reset_passwords: false,
    upgrade_kyc: false,
    adjust_balance: false,
    manage_trading: false,
    suspend_markets: false,
    override_odds: false,
    adjust_margins: false,
    settle_matches: true,
    view_fixtures: true,
    live_feed_sync: false,
    free_db_space: false,
    manage_wallet: false,
    approve_withdrawals: false,
    view_payment_logs: false,
    manage_referrals: false,
    adjust_commissions: false,
    customer_support: false,
    broadcast_alerts: false,
    view_audit_logs: false,
    regulatory_compliance: false,
    manage_subadmins: false,
  },
  'Customer Care & Player Support Lead': {
    view_dashboard: true,
    view_analytics: false,
    export_reports: false,
    create_games: false,
    edit_games: false,
    script_goals: false,
    script_cards: false,
    control_match_clock: false,
    mix_booking: false,
    view_bets: true,
    override_tickets: true,
    void_cancel_bets: false,
    settle_payouts: false,
    manage_users: true,
    create_customer: true,
    suspend_users: true,
    delete_users: false,
    purge_customers: false,
    reset_passwords: true,
    upgrade_kyc: true,
    adjust_balance: false,
    manage_trading: false,
    suspend_markets: false,
    override_odds: false,
    adjust_margins: false,
    settle_matches: false,
    view_fixtures: true,
    live_feed_sync: false,
    free_db_space: false,
    manage_wallet: false,
    approve_withdrawals: false,
    view_payment_logs: false,
    manage_referrals: true,
    adjust_commissions: false,
    customer_support: true,
    broadcast_alerts: true,
    view_audit_logs: false,
    regulatory_compliance: false,
    manage_subadmins: false,
  },
  'KYC, Compliance & AML Auditor': {
    view_dashboard: true,
    view_analytics: true,
    export_reports: true,
    create_games: false,
    edit_games: false,
    script_goals: false,
    script_cards: false,
    control_match_clock: false,
    mix_booking: false,
    view_bets: true,
    override_tickets: false,
    void_cancel_bets: false,
    settle_payouts: false,
    manage_users: true,
    create_customer: false,
    suspend_users: true,
    delete_users: false,
    purge_customers: false,
    reset_passwords: false,
    upgrade_kyc: true,
    adjust_balance: false,
    manage_trading: false,
    suspend_markets: false,
    override_odds: false,
    adjust_margins: false,
    settle_matches: false,
    view_fixtures: false,
    live_feed_sync: false,
    free_db_space: false,
    manage_wallet: false,
    approve_withdrawals: false,
    view_payment_logs: true,
    manage_referrals: false,
    adjust_commissions: false,
    customer_support: true,
    broadcast_alerts: false,
    view_audit_logs: true,
    regulatory_compliance: true,
    manage_subadmins: false,
  },
  'Treasury & Payout Controller': {
    view_dashboard: true,
    view_analytics: true,
    export_reports: true,
    create_games: false,
    edit_games: false,
    script_goals: false,
    script_cards: false,
    control_match_clock: false,
    mix_booking: false,
    view_bets: true,
    override_tickets: false,
    void_cancel_bets: true,
    settle_payouts: true,
    manage_users: false,
    create_customer: false,
    suspend_users: false,
    delete_users: false,
    purge_customers: false,
    reset_passwords: false,
    upgrade_kyc: false,
    adjust_balance: true,
    manage_trading: false,
    suspend_markets: false,
    override_odds: false,
    adjust_margins: false,
    settle_matches: false,
    view_fixtures: false,
    live_feed_sync: false,
    free_db_space: false,
    manage_wallet: true,
    approve_withdrawals: true,
    view_payment_logs: true,
    manage_referrals: true,
    adjust_commissions: false,
    customer_support: false,
    broadcast_alerts: false,
    view_audit_logs: true,
    regulatory_compliance: true,
    manage_subadmins: false,
  },
  'Affiliate & Growth Manager': {
    view_dashboard: true,
    view_analytics: true,
    export_reports: true,
    create_games: false,
    edit_games: false,
    script_goals: false,
    script_cards: false,
    control_match_clock: false,
    mix_booking: true,
    view_bets: false,
    override_tickets: false,
    void_cancel_bets: false,
    settle_payouts: false,
    manage_users: true,
    create_customer: true,
    suspend_users: false,
    delete_users: false,
    purge_customers: false,
    reset_passwords: false,
    upgrade_kyc: false,
    adjust_balance: false,
    manage_trading: false,
    suspend_markets: false,
    override_odds: false,
    adjust_margins: false,
    settle_matches: false,
    view_fixtures: true,
    live_feed_sync: false,
    free_db_space: false,
    manage_wallet: false,
    approve_withdrawals: false,
    view_payment_logs: false,
    manage_referrals: true,
    adjust_commissions: true,
    customer_support: false,
    broadcast_alerts: true,
    view_audit_logs: false,
    regulatory_compliance: false,
    manage_subadmins: false,
  },
};

const PERMISSION_CATEGORIES = [
  'All Categories',
  'Dashboard & Reports',
  'Games & Goal Scripting',
  'Tickets & Payouts',
  'Players & Accounts',
  'Trading & Markets',
  'Fixtures & Data Feed',
  'Wallet & Treasury',
  'Referrals & Growth',
  'Support & Alerts',
  'Security & Compliance',
];

export default function SubAdmins() {
  const {
    admin,
    subAdmins,
    setSubAdmins,
    switchActiveAdmin,
    hasPermission,
    setConnectModalOpen,
    refreshSubAdmins,
  } = useAuth();
  const canManageSubs = hasPermission('manage_subadmins');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('SubAdmin@2026');
  const [roleTitle, setRoleTitle] = useState('Full Operations Co-Admin');
  const [permissions, setPermissions] = useState({
    ...ROLE_PRESETS['Full Operations Co-Admin'],
  });
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [permSearch, setPermSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    refreshSubAdmins?.();
  }, []);

  async function handleRefreshList() {
    try {
      setSyncing(true);
      await refreshSubAdmins?.();
      setMsg('Synced all Sub-Admin accounts from BetAura backend!');
    } finally {
      setSyncing(false);
    }
  }

  function handlePresetChange(presetName) {
    setRoleTitle(presetName);
    if (ROLE_PRESETS[presetName]) {
      setPermissions({ ...ROLE_PRESETS[presetName] });
    }
  }

  function togglePerm(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleCreateSubAdmin(e) {
    e.preventDefault();
    if (!canManageSubs) return;
    if (!name.trim() || !username.trim()) return;

    const newSub = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      username: username.trim(),
      phone_number: phone.trim() || '+233540009999',
      password,
      role: 'ROLE_SUB_ADMIN',
      roleTitle,
      status: 'ACTIVE',
      referral_code: `AURA-${username.trim().slice(0, 6).toUpperCase()}`,
      total_referrals: 0,
      referral_earnings: 0,
      permissions: { ...permissions },
    };

    setSubAdmins((prev) => [newSub, ...prev]);
    setName('');
    setUsername('');
    setPhone('');
    setMsg(
      `Created Sub-Admin "${newSub.name}" (${newSub.roleTitle}) with custom access limits!`
    );

    try {
      const res = await adminApi.saveSubAdmin({
        id: newSub.id,
        name: newSub.name,
        username: newSub.username,
        phone_number: newSub.phone_number,
        password: newSub.password,
        role_title: newSub.roleTitle,
        status: 'ACTIVE',
        permissions: newSub.permissions,
      });
      if (res?.data?.id) {
        setSubAdmins((prev) =>
          prev.map((s) => (s.id === newSub.id ? { ...s, ...res.data } : s))
        );
      }
    } catch {
      // ignore
    }
  }

  function handleToggleSubPermission(subId, permKey) {
    if (!canManageSubs) return;
    setSubAdmins((prev) =>
      prev.map((s) => {
        if (s.id !== subId) return s;
        const updatedPerms = {
          ...s.permissions,
          [permKey]: !s.permissions?.[permKey],
        };
        if (admin?.id === subId) {
          switchActiveAdmin({ ...s, permissions: updatedPerms });
        }
        adminApi
          .saveSubAdmin({
            id: s.id,
            name: s.name,
            username: s.username,
            phone_number: s.phone_number || s.phone || '+233540009999',
            password: s.password || 'SubAdmin@2026',
            role_title: s.roleTitle || s.role || 'Sub-Admin',
            status: s.status || 'ACTIVE',
            permissions: updatedPerms,
          })
          .catch(() => {});
        return { ...s, permissions: updatedPerms };
      })
    );
  }

  function handleToggleSubStatus(sub) {
    if (!canManageSubs) return;
    const nextStatus = sub.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setSubAdmins((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s))
    );
    adminApi
      .saveSubAdmin({
        id: sub.id,
        name: sub.name,
        username: sub.username,
        phone_number: sub.phone_number || sub.phone || '+233540009999',
        password: sub.password || 'SubAdmin@2026',
        role_title: sub.roleTitle || sub.role || 'Sub-Admin',
        status: nextStatus,
        permissions: sub.permissions || {},
      })
      .catch(() => {});
    setMsg(`Sub-Admin ${sub.name} status set to ${nextStatus}.`);
  }

  async function handleDeleteSubAdmin(sub) {
    if (!canManageSubs) return;
    setSubAdmins((prev) => prev.filter((s) => s.id !== sub.id));
    if (admin?.id === sub.id) {
      switchActiveAdmin('SUPER');
    }
    setMsg(`Removed Sub-Admin ${sub.name}.`);
    try {
      await adminApi.deleteSubAdmin(sub.id);
    } catch {
      // ignore
    }
  }

  const filteredSubs = subAdmins.filter((sub) => {
    const matchesStatus =
      statusFilter === 'ALL' || (sub.status || 'ACTIVE') === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      sub.name?.toLowerCase().includes(q) ||
      sub.username?.toLowerCase().includes(q) ||
      (sub.phone_number || sub.phone || '').toLowerCase().includes(q) ||
      (sub.roleTitle || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalSubs = subAdmins.length;
  const activeSubs = subAdmins.filter((s) => s.status !== 'SUSPENDED').length;
  const linkedSubs = subAdmins.filter(
    (s) => Boolean(s.connectedBetauraAccount || s.connected_betaura_account)
  ).length;
  const totalSubReferrals = subAdmins.reduce(
    (acc, s) =>
      acc +
      Number(
        s.total_referrals ??
          s.connectedBetauraAccount?.total_invited ??
          0
      ),
    0
  );
  const totalSubReferralEarnings = subAdmins.reduce(
    (acc, s) =>
      acc +
      Number(
        s.referral_earnings ??
          s.connectedBetauraAccount?.referral_earnings ??
          0
      ),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            All Sub-Admin Accounts, Roles & Access Limits
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Super Admin overview of all Sub-Admin accounts, referral earnings, linked BetAura accounts, and permissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshList}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-xs font-extrabold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Refresh All Sub-Admins</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-[#d9f3ea] text-[#00b074] text-xs font-extrabold">
            Active: {admin?.name} ({admin?.roleTitle || 'Super Admin'})
          </span>
          {!admin?.isSuperAdmin && (
            <button
              type="button"
              onClick={() => switchActiveAdmin('SUPER')}
              className="rounded-xl bg-gray-900 text-white px-3.5 py-1.5 text-xs font-extrabold"
            >
              Switch Back to Super Admin
            </button>
          )}
        </div>
      </div>

      {/* Super Admin All Sub-Admins Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <p className="text-[11px] font-bold text-gray-400 uppercase">
            Total Sub-Admins
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            {totalSubs}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <p className="text-[11px] font-bold text-gray-400 uppercase">
            Active Accounts
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#00b074] mt-1">
            {activeSubs}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <p className="text-[11px] font-bold text-gray-400 uppercase">
            BetAura Linked
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#2d9cdb] mt-1">
            {linkedSubs} / {totalSubs}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <p className="text-[11px] font-bold text-gray-400 uppercase">
            Sub-Admin Referrals
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            {totalSubReferrals}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase">
            Sub-Admin Ref. Earnings
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#00b074] mt-1">
            {formatCurrency(totalSubReferralEarnings)}
          </p>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#0a873c] px-4 py-3 text-xs font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left 5 Cols: Create Sub-Admin & Set Limits */}
        <form
          onSubmit={handleCreateSubAdmin}
          className="xl:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-4 self-start"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <UserPlus className="w-5 h-5 text-[#00b074]" />
            <h3 className="text-base font-extrabold text-gray-900">
              Create New Sub-Admin Account
            </h3>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name (e.g. Kwesi Boateng)"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (e.g. kwesi_admin)"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (+233...)"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial Password"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
              />
              <select
                value={roleTitle}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-800"
              >
                {Object.keys(ROLE_PRESETS).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Granular Permission Checkboxes */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-gray-900">
                  Limit What This Sub-Admin Can See &amp; Do:
                </p>
                <p className="text-[10px] text-gray-500">
                  {Object.values(permissions).filter(Boolean).length} of {PERMISSION_META.length} capabilities active
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = {};
                    PERMISSION_META.forEach((p) => {
                      allTrue[p.key] = p.key !== 'manage_subadmins';
                    });
                    setPermissions(allTrue);
                  }}
                  className="text-[11px] font-bold text-[#00b074] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setPermissions({})}
                  className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Quick Search & Category Filter Pills */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Search capabilities (e.g. odds, kyc, goals, wallet)..."
                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-[11px]"
              />
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                {PERMISSION_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition ${
                      selectedCategory === cat
                        ? 'bg-[#00b074] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {PERMISSION_META.filter((p) => {
                if (selectedCategory !== 'All Categories' && p.category !== selectedCategory) {
                  return false;
                }
                if (permSearch.trim()) {
                  const q = permSearch.toLowerCase();
                  return (
                    p.label.toLowerCase().includes(q) ||
                    p.desc.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q)
                  );
                }
                return true;
              }).map((p) => (
                <label
                  key={p.key}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    permissions[p.key]
                      ? 'bg-[#eaf7ef]/60 border-[#00b074]/30'
                      : 'bg-gray-50 border-gray-100 opacity-75'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(permissions[p.key])}
                    onChange={() => togglePerm(p.key)}
                    className="accent-[#00b074] mt-0.5 w-4 h-4 rounded"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-gray-900">{p.label}</p>
                      <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-600 text-[9px] font-semibold">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManageSubs}
            className="w-full rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white py-2.5 text-xs font-extrabold shadow-xs transition disabled:opacity-50"
          >
            Create Sub-Admin with Selected Limits
          </button>
        </form>

        {/* Right 7 Cols: All Sub-Admin Accounts Directory & Live Permission Switches */}
        <div className="xl:col-span-7 space-y-4">
          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00b074]" />
              <h3 className="text-sm font-extrabold text-gray-900">
                All Sub-Admin Accounts ({filteredSubs.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
              <div className="relative flex-1 sm:w-52">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-admin name, @username, phone..."
                  className="w-full rounded-xl border border-gray-200 pl-3 pr-8 py-1.5 text-xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700"
              >
                <option value="ALL">All ({subAdmins.length})</option>
                <option value="ACTIVE">Active ({activeSubs})</option>
                <option value="SUSPENDED">
                  Suspended ({subAdmins.length - activeSubs})
                </option>
              </select>
            </div>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-gray-100">
              No Sub-Admin accounts match your filter.
            </div>
          ) : (
            filteredSubs.map((sub) => {
              const isCurrentlyPreviewing = admin?.id === sub.id;
              const connAcc =
                sub.connectedBetauraAccount || sub.connected_betaura_account;
              const subRefCount = Number(
                sub.total_referrals ?? connAcc?.total_invited ?? 0
              );
              const subRefEarnings = Number(
                sub.referral_earnings ?? connAcc?.referral_earnings ?? 0
              );
              const subRefCode =
                sub.referral_code ||
                connAcc?.referral_code ||
                `AURA-${(sub.username || 'ADMIN').slice(0, 6).toUpperCase()}`;

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#d9f3ea] text-[#00b074] font-extrabold text-sm flex items-center justify-center">
                        {(sub.name?.[0] || 'A').toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-gray-900">
                            {sub.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'SUSPENDED'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-[#d9f3ea] text-[#00b074]'
                            }`}
                          >
                            {sub.status || 'ACTIVE'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono text-[10px] font-bold">
                            Ref: {subRefCode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          @{sub.username} • {sub.phone_number || sub.phone} •{' '}
                          <strong className="text-gray-700">
                            {sub.roleTitle || 'Sub-Admin'}
                          </strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00b074]">
                            <DollarSign className="w-3 h-3" />
                            Referral Earnings: {formatCurrency(subRefEarnings)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d9cdb]">
                            <Users className="w-3 h-3" />
                            People Referred: {subRefCount}
                          </span>
                          <span className="text-[11px] font-bold text-gray-500">
                            {connAcc
                              ? `✓ Linked BetAura: ${
                                  connAcc.username || connAcc.phone_number
                                }`
                              : '• No BetAura Account Linked Yet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchActiveAdmin(sub);
                          setConnectModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#d9f3ea] text-[#00b074] hover:bg-[#00b074] hover:text-white px-3 py-1.5 text-xs font-extrabold transition"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>
                          {connAcc
                            ? 'BetAura Connected'
                            : 'Connect BetAura Account'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          isCurrentlyPreviewing
                            ? switchActiveAdmin('SUPER')
                            : switchActiveAdmin(sub)
                        }
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          isCurrentlyPreviewing
                            ? 'bg-gray-900 text-white'
                            : 'bg-blue-50 text-[#2d9cdb] hover:bg-[#2d9cdb] hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {isCurrentlyPreviewing
                            ? 'Exit Sub-Admin View'
                            : 'Preview as This Admin'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSubStatus(sub)}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                        title={
                          sub.status === 'SUSPENDED' ? 'Activate' : 'Suspend'
                        }
                      >
                        {sub.status === 'SUSPENDED' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <ShieldAlert className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubAdmin(sub)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        title="Delete Sub-Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Live Permission Toggles for this Sub-Admin */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Allowed Capabilities (Click to Enable / Restrict):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PERMISSION_META.map((p) => {
                        const allowed = Boolean(sub.permissions?.[p.key]);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            disabled={!canManageSubs}
                            onClick={() =>
                              handleToggleSubPermission(sub.id, p.key)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                              allowed
                                ? 'bg-[#d9f3ea] text-[#00b074]'
                                : 'bg-gray-100 text-gray-400 line-through'
                            }`}
                          >
                            {allowed ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            <span>{p.label.split(' (')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
