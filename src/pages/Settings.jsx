import { useState } from 'react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { admin, setAdmin } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function handleAdminSignIn(e) {
    e.preventDefault();
    try {
      const res = await adminApi.login(phone, password);
      if (res.data?.access_token) {
        localStorage.setItem('betaura_admin_token', res.data.access_token);
        setAdmin({
          name: phone,
          initial: phone.slice(-1).toUpperCase() || 'A',
          role: res.data.role,
        });
        setMsg(`Authenticated with BetAura API (Role: ${res.data.role})`);
      }
    } catch (err) {
      setMsg(`Error: ${err.response?.data?.detail || err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Settings & API Connection</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Connected to https://betaura-api.onrender.com (Frontend: https://betaura.onrender.com)
        </p>
      </div>

      <form
        onSubmit={handleAdminSignIn}
        className="bg-white rounded-2xl p-6 shadow-xs border border-gray-50 max-w-lg space-y-4"
      >
        <h3 className="text-base font-bold text-gray-900">Admin API Session Token</h3>
        <p className="text-xs text-gray-500">
          Current user: <strong>{admin?.name}</strong>
        </p>
        <input
          type="text"
          placeholder="Admin Phone / Username"
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
          className="rounded-xl bg-[#00b074] text-white px-5 py-2.5 text-xs font-bold"
        >
          Connect Admin Token
        </button>
        {msg && <p className="text-xs font-semibold text-[#00b074]">{msg}</p>}
      </form>
    </div>
  );
}
