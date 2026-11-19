import { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const ALL_PERMISSIONS = {
  // Dashboard & Analytics
  view_dashboard: true,
  view_analytics: true,
  export_reports: true,
  // Custom Games & Goal Scripting
  create_games: true,
  edit_games: true,
  script_goals: true,
  script_cards: true,
  control_match_clock: true,
  mix_booking: true,
  // Bet Slips & Ticket Settlement
  view_bets: true,
  override_tickets: true,
  void_cancel_bets: true,
  settle_payouts: true,
  // Player & KYC Operations
  manage_users: true,
  create_customer: true,
  suspend_users: true,
  delete_users: true,
  purge_customers: true,
  reset_passwords: true,
  upgrade_kyc: true,
  adjust_balance: true,
  // Trading Desk & Odds Management
  manage_trading: true,
  suspend_markets: true,
  override_odds: true,
  adjust_margins: true,
  settle_matches: true,
  // Fixtures & Data Feeds
  view_fixtures: true,
  live_feed_sync: true,
  free_db_space: true,
  // Wallet, Banking & Treasury
  manage_wallet: true,
  approve_withdrawals: true,
  view_payment_logs: true,
  // Referrals & Affiliates
  manage_referrals: true,
  adjust_commissions: true,
  // Customer Care & Announcements
  customer_support: true,
  broadcast_alerts: true,
  // Security, Audit & Administration
  view_audit_logs: true,
  regulatory_compliance: true,
  manage_subadmins: true,
};

export function AuthProvider({ children }) {
  // One-time cleanup of all previous admin & sub-admin accounts in localStorage
  try {
    if (localStorage.getItem('betaura_superadmin_reset_v2026') !== 'true') {
      localStorage.removeItem('betaura_sub_admins');
      localStorage.removeItem('betaura_active_admin_profile');
      localStorage.removeItem('betaura_admin_token');
      localStorage.removeItem('betaura_super_admin_token');
      localStorage.removeItem('betaura_super_connected_account');
      localStorage.setItem('betaura_admin_logged_out', 'true');
      localStorage.setItem('betaura_superadmin_reset_v2026', 'true');
    }
  } catch {
    // ignore
  }

  const [subAdmins, setSubAdmins] = useState(() => {
    try {
      const saved = localStorage.getItem('betaura_sub_admins');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [admin, setAdmin] = useState(() => {
    try {
      const token = localStorage.getItem('betaura_admin_token') || localStorage.getItem('betaura_super_admin_token');
      const isOut = localStorage.getItem('betaura_admin_logged_out') === 'true';
      if (!token || isOut) {
        return null;
      }
      let savedSuperConnected = null;
      try {
        const rawConn = localStorage.getItem('betaura_super_connected_account');
        if (rawConn) savedSuperConnected = JSON.parse(rawConn);
      } catch {
        // ignore
      }
      const saved = localStorage.getItem('betaura_active_admin_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.isSuperAdmin ||
          parsed?.role === 'ROLE_SUPER_ADMIN' ||
          parsed?.id === 'super-admin-1' ||
          (parsed?.name || '').toLowerCase() === 'thisissuperadmin'
        ) {
          parsed.isSuperAdmin = true;
          parsed.role = 'ROLE_SUPER_ADMIN';
          parsed.name = 'ThisIsSuperAdmin';
          parsed.username = 'ThisIsSuperAdmin';
          parsed.roleTitle = 'Super Administrator';
          parsed.permissions = { ...ALL_PERMISSIONS };
          if (!parsed.connectedBetauraAccount && savedSuperConnected) {
            parsed.connectedBetauraAccount = savedSuperConnected;
          }
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [authReady, setAuthReady] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(() => {
    try {
      const token = localStorage.getItem('betaura_admin_token') || localStorage.getItem('betaura_super_admin_token');
      const isOut = localStorage.getItem('betaura_admin_logged_out') === 'true';
      return !token || isOut;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('betaura_sub_admins', JSON.stringify(subAdmins));
    } catch {
      // ignore
    }
  }, [subAdmins]);

  useEffect(() => {
    try {
      localStorage.setItem('betaura_active_admin_profile', JSON.stringify(admin));
    } catch {
      // ignore
    }
  }, [admin]);

  async function refreshSubAdmins() {
    try {
      const res = await adminApi.getSubAdmins();
      if (Array.isArray(res?.data)) {
        setSubAdmins(
          res.data.map((remote) => ({
            ...remote,
            phone_number: remote.phone_number || remote.phone || '',
            roleTitle: remote.roleTitle || remote.role_title || 'Sub-Admin',
            connectedBetauraAccount:
              remote.connectedBetauraAccount ||
              remote.connected_betaura_account ||
              null,
          }))
        );
      }
    } catch {
      // Keep local subAdmins if offline
    }
  }

  async function hydrateSession() {
    try {
      const token = localStorage.getItem('betaura_admin_token') || localStorage.getItem('betaura_super_admin_token');
      const isOut = localStorage.getItem('betaura_admin_logged_out') === 'true';
      if (!token || isOut) {
        setIsLoggedOut(true);
        setAdmin(null);
        return;
      }

      // If active admin is NOT super admin and has a connected BetAura account token, synchronize
      if (!admin?.isSuperAdmin && admin?.connectedBetauraAccount?.access_token) {
        localStorage.setItem(
          'betaura_admin_token',
          admin.connectedBetauraAccount.access_token
        );
      }
      await refreshSubAdmins();
    } catch {
      // Keep local profile if offline
    } finally {
      setAuthReady(true);
    }
  }

  useEffect(() => {
    hydrateSession();
  }, []);

  function hasPermission(permKey) {
    if (admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN') return true;
    // Sub-Admins always have access to their Main Dashboard, Referrals & Earnings Analytics
    if (permKey === 'view_dashboard' || permKey === 'view_analytics') return true;
    return Boolean(admin?.permissions?.[permKey]);
  }

  function switchActiveAdmin(targetAdmin) {
    try {
      localStorage.removeItem('betaura_admin_logged_out');
    } catch {
      // ignore
    }
    setIsLoggedOut(false);

    if (!targetAdmin || targetAdmin === 'SUPER') {
      let savedSuperConnected = null;
      try {
        const rawConn = localStorage.getItem('betaura_super_connected_account');
        if (rawConn) savedSuperConnected = JSON.parse(rawConn);
      } catch {
        // ignore
      }
      const superToken =
        localStorage.getItem('betaura_super_admin_token') ||
        savedSuperConnected?.access_token;
      if (superToken) {
        localStorage.setItem('betaura_admin_token', superToken);
      }
      setAdmin({
        id: 'super-admin-1',
        name: 'ThisIsSuperAdmin',
        phone_number: savedSuperConnected?.phone_number || '+233540000001',
        username: 'ThisIsSuperAdmin',
        initial: 'S',
        role: 'ROLE_SUPER_ADMIN',
        roleTitle: 'Super Administrator',
        isSuperAdmin: true,
        kyc_tier: 4,
        status: 'KYC_APPROVED',
        connectedBetauraAccount: savedSuperConnected,
        permissions: { ...ALL_PERMISSIONS },
      });
      return;
    }

    // Save super admin token before switching to sub-admin
    const currentToken = localStorage.getItem('betaura_admin_token');
    if (currentToken && admin?.isSuperAdmin) {
      localStorage.setItem('betaura_super_admin_token', currentToken);
    }

    if (targetAdmin.connectedBetauraAccount?.access_token) {
      localStorage.setItem(
        'betaura_admin_token',
        targetAdmin.connectedBetauraAccount.access_token
      );
    }

    setAdmin({
      ...targetAdmin,
      isSuperAdmin: false,
      initial: (targetAdmin.name?.[0] || targetAdmin.username?.[0] || 'A').toUpperCase(),
    });
  }

  async function loginAdmin(identifier, password) {
    const rawId = (identifier || '').trim();
    const cleanPw = (password || '').trim();
    if (!rawId || !cleanPw) {
      throw new Error('Please enter both your BetAura username/phone and password.');
    }

    // 1. Authenticate credentials directly with BetAura backend
    let authRes;
    try {
      authRes = await adminApi.login(rawId, cleanPw);
    } catch (err) {
      const detail = err.response?.data?.detail;
      throw new Error(detail || 'Invalid login credentials. Please check your BetAura username and password.');
    }

    const token = authRes?.data?.access_token;
    if (!token) {
      throw new Error('Authentication succeeded but no access token was returned.');
    }

    // Temporarily set token in local storage so subsequent profile/subadmin calls succeed
    localStorage.setItem('betaura_admin_token', token);

    // 2. Fetch authenticated profile
    let userProfile = null;
    try {
      const profRes = await adminApi.getProfile();
      userProfile = profRes?.data;
    } catch {
      // ignore
    }

    const authUsername = (userProfile?.username || authRes?.data?.username || rawId).toLowerCase();
    const authPhone = (userProfile?.phone_number || rawId).toLowerCase();
    const authRole = userProfile?.role || authRes?.data?.role || '';

    // Check if this is Super Admin
    const isSuper =
      authRole === 'ROLE_SUPER_ADMIN' ||
      authUsername === 'thisissuperadmin' ||
      authUsername === 'superadmin' ||
      authPhone === '+233540000001' ||
      authPhone === '0540000001';

    if (isSuper) {
      localStorage.setItem('betaura_admin_token', token);
      localStorage.setItem('betaura_super_admin_token', token);
      localStorage.removeItem('betaura_admin_logged_out');
      setIsLoggedOut(false);
      switchActiveAdmin('SUPER');
      return { name: 'ThisIsSuperAdmin', username: 'ThisIsSuperAdmin', role: 'ROLE_SUPER_ADMIN' };
    }

    // 3. Sub-Admin verification: Check if user is appointed as Sub-Admin
    let latestSubs = subAdmins;
    try {
      const res = await adminApi.getSubAdmins();
      if (Array.isArray(res?.data)) {
        latestSubs = res.data;
        setSubAdmins(res.data);
      }
    } catch {
      // ignore
    }

    const matchedSub = latestSubs.find(
      (s) =>
        s.username?.toLowerCase() === authUsername ||
        s.phone?.toLowerCase() === authPhone ||
        s.phone_number?.toLowerCase() === authPhone ||
        (userProfile?.id && String(s.user_id) === String(userProfile.id)) ||
        (s.id && String(s.id) === String(userProfile?.id))
    );

    const isSubRole = authRole === 'ROLE_TRADER' || authRole === 'ROLE_SUB_ADMIN' || authRole === 'ROLE_ADMIN';

    if (!matchedSub && !isSubRole) {
      localStorage.removeItem('betaura_admin_token');
      throw new Error(
        `Access denied. The BetAura account "@${userProfile?.username || rawId}" is not appointed as a Sub-Admin. Please contact Super Admin to assign your username.`
      );
    }

    if (matchedSub && matchedSub.status === 'SUSPENDED') {
      localStorage.removeItem('betaura_admin_token');
      throw new Error('This Sub-Admin account has been suspended by Super Admin.');
    }

    const activeSubProfile = {
      id: matchedSub?.id || String(userProfile?.id || Date.now()),
      user_id: String(userProfile?.id || matchedSub?.user_id || ''),
      name: matchedSub?.name || userProfile?.username || rawId,
      username: userProfile?.username || matchedSub?.username || rawId,
      phone_number: userProfile?.phone_number || matchedSub?.phone_number || rawId,
      initial: (userProfile?.username || rawId)[0].toUpperCase(),
      role: 'ROLE_SUB_ADMIN',
      roleTitle: matchedSub?.roleTitle || matchedSub?.role_title || 'Full Operations Co-Admin',
      status: matchedSub?.status || 'ACTIVE',
      permissions: matchedSub?.permissions || { ...ALL_PERMISSIONS },
      connectedBetauraAccount: matchedSub?.connectedBetauraAccount || matchedSub?.connected_betaura_account || {
        user_id: String(userProfile?.id || ''),
        username: userProfile?.username || rawId,
        phone_number: userProfile?.phone_number || rawId,
        access_token: token,
        connected_at: new Date().toISOString(),
      },
    };

    localStorage.setItem('betaura_admin_token', token);
    localStorage.removeItem('betaura_admin_logged_out');
    setIsLoggedOut(false);
    switchActiveAdmin(activeSubProfile);
    return activeSubProfile;
  }

  async function changeSubAdminPassword(currentPassword, newPassword) {
    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('New password must be at least 4 characters.');
    }
    const cleanNew = newPassword.trim();

    if (!admin?.isSuperAdmin) {
      if (
        admin?.password &&
        currentPassword &&
        admin.password !== currentPassword.trim()
      ) {
        throw new Error('Current password does not match.');
      }

      const updatedAdmin = { ...admin, password: cleanNew };
      setAdmin(updatedAdmin);
      setSubAdmins((prev) =>
        prev.map((s) => (s.id === admin.id ? { ...s, password: cleanNew } : s))
      );

      try {
        await adminApi.changeSubAdminPassword(admin.id, {
          current_password: currentPassword || undefined,
          new_password: cleanNew,
        });
      } catch {
        // Updated locally
      }
      return updatedAdmin;
    }

    // Super admin password update
    try {
      await adminApi.changeSubAdminPassword('super-admin-1', {
        current_password: currentPassword || undefined,
        new_password: cleanNew,
      });
    } catch {
      // ignore
    }
    return admin;
  }

  async function connectBetauraAccount(phoneOrUsername, password, targetSubId = null) {
    const cleanId = (phoneOrUsername || '').trim();
    const cleanPw = (password || '').trim();
    if (!cleanId || !cleanPw) {
      throw new Error('Please enter both your BetAura phone/username and password.');
    }

    const subId = targetSubId || admin?.id || 'sub-active';
    let connectedInfo = null;

    // 1. Try dedicated backend connect-betaura endpoint first
    try {
      const res = await adminApi.connectSubAdminBetaura(subId, {
        phone_number: cleanId,
        password: cleanPw,
      });
      if (res?.data?.connected_account) {
        connectedInfo = res.data.connected_account;
      }
    } catch {
      // 2. Fallback to standard /api/v1/auth/login on https://betaura-api.onrender.com
      const loginRes = await adminApi.login(cleanId, cleanPw);
      if (loginRes?.data?.access_token) {
        const token = loginRes.data.access_token;
        localStorage.setItem('betaura_admin_token', token);

        let refStats = { referral_code: '', bonus_earned: 0, bonus_balance: 0, total_invited: 0 };
        let profileData = null;
        try {
          const [meRes, refRes] = await Promise.allSettled([
            adminApi.getProfile(),
            adminApi.getReferralStats(),
          ]);
          if (meRes.status === 'fulfilled') profileData = meRes.value?.data;
          if (refRes.status === 'fulfilled' && refRes.value?.data) {
            refStats = refRes.value.data;
          }
        } catch {
          // ignore
        }

        connectedInfo = {
          user_id: String(loginRes.data.user_id || profileData?.id || ''),
          phone_number: profileData?.phone_number || cleanId,
          username: profileData?.username || cleanId,
          referral_code: refStats.referral_code || `AURA-${cleanId.slice(-4).toUpperCase()}`,
          access_token: token,
          referral_earnings: Number(refStats.bonus_earned || 0),
          bonus_balance: Number(refStats.bonus_balance || 0),
          total_invited: Number(refStats.total_invited || 0),
          connected_at: new Date().toISOString(),
        };
      }
    }

    if (!connectedInfo) {
      throw new Error('Could not connect BetAura account. Check your number and password.');
    }

    if (connectedInfo.access_token) {
      localStorage.setItem('betaura_admin_token', connectedInfo.access_token);
    }

    const isSuperTarget =
      subId === 'super-admin-1' || (!targetSubId && admin?.isSuperAdmin);

    if (isSuperTarget) {
      try {
        localStorage.setItem(
          'betaura_super_connected_account',
          JSON.stringify(connectedInfo)
        );
        if (connectedInfo.access_token) {
          localStorage.setItem('betaura_super_admin_token', connectedInfo.access_token);
        }
      } catch {
        // ignore
      }
      setAdmin((prev) => ({
        ...prev,
        isSuperAdmin: true,
        role: 'ROLE_SUPER_ADMIN',
        name: 'ThisIsSuperAdmin',
        username: 'ThisIsSuperAdmin',
        connectedBetauraAccount: connectedInfo,
      }));
    } else {
      setSubAdmins((prev) =>
        prev.map((s) =>
          s.id === subId ? { ...s, connectedBetauraAccount: connectedInfo } : s
        )
      );

      if (admin?.id === subId || !admin?.isSuperAdmin) {
        setAdmin((prev) => ({
          ...prev,
          connectedBetauraAccount: connectedInfo,
        }));
      }
    }

    return connectedInfo;
  }

  function disconnectBetauraAccount(targetSubId = null) {
    const subId = targetSubId || admin?.id;
    const isSuperTarget =
      subId === 'super-admin-1' || (!targetSubId && admin?.isSuperAdmin);

    if (isSuperTarget) {
      try {
        localStorage.removeItem('betaura_super_connected_account');
      } catch {
        // ignore
      }
      setAdmin((prev) => ({ ...prev, connectedBetauraAccount: null }));
      return;
    }

    setSubAdmins((prev) =>
      prev.map((s) =>
        s.id === subId ? { ...s, connectedBetauraAccount: null } : s
      )
    );
    if (admin?.id === subId) {
      setAdmin((prev) => ({ ...prev, connectedBetauraAccount: null }));
    }
  }

  function logoutAdmin() {
    try {
      localStorage.removeItem('betaura_admin_token');
      localStorage.removeItem('betaura_super_admin_token');
      localStorage.removeItem('betaura_active_admin_profile');
      localStorage.setItem('betaura_admin_logged_out', 'true');
    } catch {
      // ignore
    }
    setAdmin(null);
    setConnectModalOpen(false);
    setIsLoggedOut(true);
  }

  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin ||
      admin?.role === 'ROLE_SUPER_ADMIN' ||
      admin?.id === 'super-admin-1' ||
      (admin?.name || '').toLowerCase() === 'thisissuperadmin' ||
      (admin?.username || '').toLowerCase() === 'thisissuperadmin'
  );

  return (
    <AuthContext.Provider
      value={{
        admin,
        isSuperAdmin,
        setAdmin,
        subAdmins,
        setSubAdmins,
        authReady,
        isLoggedOut,
        hasPermission,
        switchActiveAdmin,
        loginAdmin,
        logoutAdmin,
        changeSubAdminPassword,
        connectBetauraAccount,
        disconnectBetauraAccount,
        connectModalOpen,
        setConnectModalOpen,
        refreshProfile: hydrateSession,
        refreshSubAdmins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
