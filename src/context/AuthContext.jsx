import { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const ALL_PERMISSIONS = {
  view_dashboard: true,
  create_games: true,
  edit_games: true,
  mix_booking: true,
  override_tickets: true,
  manage_users: true,
  manage_wallet: true,
  manage_trading: true,
  view_analytics: true,
  manage_subadmins: true,
};

export function AuthProvider({ children }) {
  // One-time cleanup of all previous admin & sub-admin accounts in localStorage
  try {
    if (localStorage.getItem('betaura_superadmin_reset_v1') !== 'true') {
      localStorage.removeItem('betaura_sub_admins');
      localStorage.removeItem('betaura_active_admin_profile');
      localStorage.removeItem('betaura_admin_token');
      localStorage.removeItem('betaura_super_admin_token');
      localStorage.setItem('betaura_superadmin_reset_v1', 'true');
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
    let savedSuperConnected = null;
    try {
      const rawConn = localStorage.getItem('betaura_super_connected_account');
      if (rawConn) savedSuperConnected = JSON.parse(rawConn);
    } catch {
      // ignore
    }
    try {
      const saved = localStorage.getItem('betaura_active_admin_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isSuperAdmin && !parsed.connectedBetauraAccount && savedSuperConnected) {
          parsed.connectedBetauraAccount = savedSuperConnected;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      id: 'super-admin-1',
      name: 'ThisIsSuperAdmin',
      phone_number: '+233540000001',
      username: 'ThisIsSuperAdmin',
      initial: 'S',
      role: 'ROLE_SUPER_ADMIN',
      roleTitle: 'Super Administrator',
      isSuperAdmin: true,
      kyc_tier: 4,
      status: 'KYC_APPROVED',
      connectedBetauraAccount: savedSuperConnected,
      permissions: { ...ALL_PERMISSIONS },
    };
  });

  const [authReady, setAuthReady] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(() => {
    try {
      return localStorage.getItem('betaura_admin_logged_out') === 'true';
    } catch {
      return false;
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
      // If active admin (Super Admin or Sub-Admin) has a connected BetAura account token, use that token
      if (admin?.connectedBetauraAccount?.access_token) {
        localStorage.setItem(
          'betaura_admin_token',
          admin.connectedBetauraAccount.access_token
        );
      } else {
        let token = localStorage.getItem('betaura_admin_token');
        if (!token) {
          const loginRes = await adminApi.login('ThisIsSuperAdmin', 'SuperAdmin@2026');
          if (loginRes?.data?.access_token) {
            token = loginRes.data.access_token;
            localStorage.setItem('betaura_admin_token', token);
            localStorage.setItem('betaura_super_admin_token', token);
          }
        }
      }
      await refreshSubAdmins();
    } catch {
      // Keep local fallback profile if offline
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
        savedSuperConnected?.access_token ||
        localStorage.getItem('betaura_super_admin_token');
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
      initial: (targetAdmin.name?.[0] || 'A').toUpperCase(),
    });
  }

  async function loginAdmin(identifier, password) {
    const clean = (identifier || '').trim().toLowerCase();
    const cleanPw = (password || '').trim();

    const matchedSub = subAdmins.find(
      (s) =>
        s.username?.toLowerCase() === clean ||
        s.phone_number?.toLowerCase() === clean ||
        s.name?.toLowerCase() === clean
    );

    if (matchedSub) {
      if (matchedSub.status === 'SUSPENDED') {
        throw new Error('This Sub-Admin account has been suspended by Super Admin.');
      }
      if (matchedSub.password && matchedSub.password !== cleanPw) {
        throw new Error('Incorrect Sub-Admin password. Please check your password.');
      }
      switchActiveAdmin(matchedSub);
      return matchedSub;
    }

    // Only allow the single Super Admin account (ThisIsSuperAdmin / SuperAdmin@2026)
    if (clean !== 'thisissuperadmin' || cleanPw !== 'SuperAdmin@2026') {
      throw new Error('Invalid admin credentials. Use your assigned Admin username and password.');
    }

    try {
      const res = await adminApi.login('ThisIsSuperAdmin', 'SuperAdmin@2026');
      if (res.data?.access_token) {
        localStorage.setItem('betaura_admin_token', res.data.access_token);
        localStorage.setItem('betaura_super_admin_token', res.data.access_token);
      }
    } catch {
      // Allow local Super Admin login even if backend is still deploying
    }
    switchActiveAdmin('SUPER');
    return { name: 'ThisIsSuperAdmin', username: 'ThisIsSuperAdmin', role: 'ROLE_SUPER_ADMIN' };
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
        phone_number: connectedInfo.phone_number || prev.phone_number,
        username: connectedInfo.username || prev.username,
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
      localStorage.setItem('betaura_admin_logged_out', 'true');
    } catch {
      // ignore
    }
    setConnectModalOpen(false);
    setIsLoggedOut(true);
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
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
