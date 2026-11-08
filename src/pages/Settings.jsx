import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, Link2, Unlink, LogOut } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const {
    admin,
    loginAdmin,
    logoutAdmin,
    changeSubAdminPassword,
    connectBetauraAccount,
    disconnectBetauraAccount,
    refreshProfile,
  } = useAuth();

  const [phone, setPhone] = useState(admin?.username || 'ThisIsSuperAdmin');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(admin?.username || '');
  const [email, setEmail] = useState(admin?.email || '');

  // Change Password State (For Sub-Admin or Super Admin)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Connect BetAura Account State
  const [betauraPhone, setBetauraPhone] = useState(
    admin?.connectedBetauraAccount?.phone_number || ''
  );
  const [betauraPassword, setBetauraPassword] = useState('');

  const [health, setHealth] = useState(null);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    adminApi
      .getHealth()
      .then((res) => setHealth(res.data))
      .catch(() => {});
  }, []);

  async function handleAdminSignIn(e) {
    e.preventDefault();
    try {
      setErrMsg('');
      setMsg('Authenticating...');
      const data = await loginAdmin(phone, password);
      setMsg(`Authenticated as ${data.name || phone}!`);
      setPassword('');
    } catch (err) {
      setMsg('');
      setErrMsg(err.response?.data?.detail || err.message);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setErrMsg('');
    setMsg('');
    if (newPassword !== confirmPassword) {
      setErrMsg('New password and confirmation do not match.');
      return;
    }
    try {
      await changeSubAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg(`Password updated successfully for ${admin?.name}! You can use your new password on your next login.`);
    } catch (err) {
      setErrMsg(err.response?.data?.detail || err.message);
    }
  }

  async function handleConnectBetaura(e) {
    e.preventDefault();
    setErrMsg('');
    setMsg('Connecting your BetAura account...');
    try {
      const connected = await connectBetauraAccount(betauraPhone, betauraPassword);
      setBetauraPassword('');
      setMsg(
        `BetAura Account Connected (${connected.username || connected.phone_number})! You can now edit your slips and perform your assigned roles.`
      );
    } catch (err) {
      setMsg('');
      setErrMsg(err.response?.data?.detail || err.message);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      setErrMsg('');
      setMsg('Updating profile via /api/v1/auth/profile...');
      await adminApi.updateProfile({
        username: username || undefined,
        email: email || undefined,
      });
      await refreshProfile();
      setMsg('Profile updated on BetAura API!');
    } catch (err) {
      setMsg('');
      setErrMsg(err.response?.data?.detail || err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Account Settings, Password & BetAura Connection
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Active Role: <strong>{admin?.name}</strong> ({admin?.roleTitle || 'Super Admin'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {health && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d9f3ea] text-[#00b074] text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              API {health.status} (v{health.version})
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              logoutAdmin();
              navigate('/login');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 text-xs font-extrabold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#00b074] px-4 py-3 text-xs font-bold">
          {msg}
        </div>
      )}

      {errMsg && (
        <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-xs font-bold">
          {errMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Connect BetAura Account Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Connect BetAura Account
                </h3>
                <p className="text-[11px] text-gray-500">
                  Link your personal BetAura account with your number & password
                </p>
              </div>
            </div>
          </div>

          {admin?.connectedBetauraAccount && (
            <div className="rounded-xl bg-[#eaf7ef] border border-[#00b074]/30 p-3.5 flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-extrabold text-[#0a873c]">
                  ✓ Connected: {admin.connectedBetauraAccount.username || admin.connectedBetauraAccount.phone_number}
                </p>
                <p className="text-[11px] text-gray-600">
                  Phone: {admin.connectedBetauraAccount.phone_number} • Referral Code:{' '}
                  <strong>{admin.connectedBetauraAccount.referral_code}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => disconnectBetauraAccount()}
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 px-2.5 py-1.5 text-[11px] font-bold"
              >
                <Unlink className="w-3 h-3" />
                <span>Unlink</span>
              </button>
            </div>
          )}

          <form onSubmit={handleConnectBetaura} className="space-y-3">
            <input
              type="text"
              required
              placeholder="BetAura Phone Number or Username (e.g. +233541234567)"
              value={betauraPhone}
              onChange={(e) => setBetauraPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
            />
            <input
              type="password"
              required
              placeholder="BetAura Account Password"
              value={betauraPassword}
              onChange={(e) => setBetauraPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white py-2.5 text-xs font-extrabold transition"
            >
              {admin?.connectedBetauraAccount
                ? 'Switch Connected BetAura Account'
                : 'Connect BetAura Account'}
            </button>
          </form>
        </div>

        {/* 2. Change Sub-Admin / Admin Password Card */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2d9cdb] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Change Your Admin Password
              </h3>
              <p className="text-[11px] text-gray-500">
                Update the password assigned when your account was created
              </p>
            </div>
          </div>

          <input
            type="password"
            placeholder="Current Password (optional if first change)"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <input
            type="password"
            required
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <input
            type="password"
            required
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2d9cdb] hover:bg-[#2382ba] text-white py-2.5 text-xs font-extrabold transition"
          >
            Update Password
          </button>
        </form>

        {/* 3. Switch Admin / Sub-Admin Account */}
        <form
          onSubmit={handleAdminSignIn}
          className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-3"
        >
          <h3 className="text-base font-bold text-gray-900">
            Sign In as Different Admin / Sub-Admin
          </h3>
          <p className="text-xs text-gray-500">
            Active: <strong>{admin?.name}</strong> (@{admin?.username})
          </p>
          <input
            type="text"
            placeholder="Sub-Admin Username or Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 text-white py-2.5 text-xs font-bold"
          >
            Sign In
          </button>
        </form>

        {/* 4. Update Username / Email */}
        <form
          onSubmit={handleUpdateProfile}
          className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-3"
        >
          <h3 className="text-base font-bold text-gray-900">
            Update Profile (/api/v1/auth/profile)
          </h3>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[#00b074] text-white py-2.5 text-xs font-bold"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
