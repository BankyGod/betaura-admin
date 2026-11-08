import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await loginAdmin(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2f7] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl shadow-md p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0e9f47] flex items-center justify-center text-white">
            <Crown className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">BetAura Admin</h1>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone, Username, or Email"
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#0e9f47] text-white py-2.5 text-xs font-bold hover:bg-[#0a873c] transition disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
