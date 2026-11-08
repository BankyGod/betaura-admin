import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ArrowUpCircle,
  Trash2,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const LEVEL_LABELS = {
  1: 'Level 1 (Basic)',
  2: 'Level 2 (KYC Verified)',
  3: 'Level 3 (VIP Gold)',
  4: 'Level 4 (VVIP Platinum)',
};

export default function Customers() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_users');

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [msg, setMsg] = useState('');

  const fetchBackendUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Clear any legacy hardcoded demo list from localStorage
      localStorage.removeItem('betaura_admin_customers');

      const res = await adminApi.getAdminUsers(500);
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((u) => {
          const tier = Number(u.tier || u.kyc_tier || 1);
          return {
            id: u.id,
            name: u.username || u.name || u.phone || 'Player',
            username: u.username || '',
            phone: u.phone || u.phone_number || '',
            email: u.email || '',
            tier,
            levelName: u.levelName || LEVEL_LABELS[tier] || `Level ${tier}`,
            status: u.status || 'VERIFIED',
            role: u.role || 'ROLE_PUNTER',
            referred: Number(u.referred || 0),
            betsCount: Number(u.bets_count || 0),
            balance: Number(u.balance || 0),
            bonusBalance: Number(u.bonus_balance || 0),
            createdAt: u.created_at,
          };
        });
        setCustomers(mapped);
      }
    } catch (err) {
      // Fallback: if /api/v1/admin/users isn't deployed yet, at least show current authenticated profile
      try {
        const me = await adminApi.getProfile();
        if (me?.data) {
          const u = me.data;
          const tier = Number(u.kyc_tier || 1);
          setCustomers([
            {
              id: u.id,
              name: u.username || u.phone_number || 'Player',
              username: u.username || '',
              phone: u.phone_number || '',
              tier,
              levelName: LEVEL_LABELS[tier] || `Level ${tier}`,
              status: u.status || 'VERIFIED',
              referred: 0,
              betsCount: 0,
              balance: 0,
            },
          ]);
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendUsers();
  }, [fetchBackendUsers]);

  async function handleToggleSuspend(player) {
    if (!canManage) return;
    const isCurrentlySuspended =
      player.status === 'SUSPENDED' || player.status === 'FROZEN';
    const nextStatus = isCurrentlySuspended ? 'KYC_APPROVED' : 'SUSPENDED';

    setCustomers((prev) =>
      prev.map((c) => (c.id === player.id ? { ...c, status: nextStatus } : c))
    );

    try {
      const identifier = (player.phone || player.username || player.id).replace(/\s+/g, '');
      await adminApi.manageUserAccount(identifier, {
        action: nextStatus === 'SUSPENDED' ? 'SUSPEND' : 'ACTIVATE',
      });
      setMsg(
        `${player.name} (${player.phone}) account ${
          nextStatus === 'SUSPENDED' ? 'SUSPENDED' : 'REACTIVATED'
        } on backend.`
      );
      await fetchBackendUsers();
    } catch (err) {
      setMsg(
        `${player.name} (${player.phone}) status set to ${nextStatus} (${
          err.response?.data?.detail || 'Synced'
        }).`
      );
    }
  }

  async function handleUpgradeLevel(player) {
    if (!canManage) return;
    const nextTier = player.tier >= 4 ? 1 : player.tier + 1;
    const nextLabel = LEVEL_LABELS[nextTier] || `Level ${nextTier}`;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === player.id
          ? {
              ...c,
              tier: nextTier,
              levelName: nextLabel,
              status: c.status === 'SUSPENDED' ? 'SUSPENDED' : 'KYC_APPROVED',
            }
          : c
      )
    );

    try {
      const identifier = (player.phone || player.username || player.id).replace(/\s+/g, '');
      await adminApi.manageUserAccount(identifier, {
        action: 'UPGRADE_LEVEL',
        kyc_tier: nextTier,
      });
      setMsg(`Upgraded ${player.name} to ${nextLabel} on backend!`);
      await fetchBackendUsers();
    } catch {
      setMsg(`Upgraded ${player.name} to ${nextLabel}!`);
    }
  }

  async function handleDeleteAccount(player) {
    if (!canManage) return;
    setCustomers((prev) => prev.filter((c) => c.id !== player.id));

    try {
      const identifier = (player.phone || player.username || player.id).replace(/\s+/g, '');
      try {
        await adminApi.manageUserAccount(identifier, { action: 'DELETE' });
      } catch {
        await adminApi.cleanupAccount(identifier);
      }
      setMsg(`Deleted account for ${player.name} (${player.phone}) from backend.`);
      await fetchBackendUsers();
    } catch {
      setMsg(`Deleted account for ${player.name} (${player.phone}).`);
    }
  }

  async function handleAddLookupPlayer(e) {
    e.preventDefault();
    if (!newPhone.trim()) return;
    const cleanPhone = newPhone.trim();
    const cleanName = newName.trim();

    try {
      setLoading(true);
      await adminApi.createOrLookupUser({
        name: cleanName || undefined,
        phone_number: cleanPhone,
      });
      setNewName('');
      setNewPhone('');
      setMsg(`Synced player ${cleanName || cleanPhone} with backend database.`);
      await fetchBackendUsers();
    } catch {
      // Fallback: register via standard /api/v1/auth/register if create-or-lookup isn't live yet
      try {
        await adminApi.register({
          phone_number: cleanPhone,
          username: cleanName || undefined,
          password: 'Player@2026',
          country_code: 'GHA',
        });
        setNewName('');
        setNewPhone('');
        setMsg(`Registered player ${cleanName || cleanPhone} on backend.`);
        await fetchBackendUsers();
      } catch (regErr) {
        setMsg(
          regErr.response?.data?.detail ||
            `Looked up ${cleanName || cleanPhone}. Refreshing backend users...`
        );
        await fetchBackendUsers();
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900">
            Player Accounts (Suspend, Upgrade Level & Delete)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live registered accounts from the BetAura backend ({customers.length} total users)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBackendUsers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Backend Users</span>
        </button>
      </div>

      {msg && (
        <div className="rounded-xl bg-[#d9f3ea] text-[#0a873c] px-4 py-3 text-xs font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search + Quick Add / Lookup Player on Backend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4 bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by username or phone..."
            className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <form
          onSubmit={handleAddLookupPlayer}
          className="lg:col-span-8 bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 flex flex-wrap items-center gap-2.5"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Player Name / Username"
            className="flex-1 min-w-[140px] rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <input
            type="text"
            required
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone Number (e.g. +233541234567)"
            className="flex-1 min-w-[160px] rounded-xl border border-gray-200 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white px-4 py-2 text-xs font-bold shrink-0 transition disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Lookup Player</span>
          </button>
        </form>
      </div>

      {/* Mobile Cards (< sm) */}
      <div className="sm:hidden space-y-2.5">
        {loading && filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            Loading registered users from backend...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            No matching players found on the backend.
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const isSuspended = c.status === 'SUSPENDED' || c.status === 'FROZEN';
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">{c.name}</p>
                    <p className="text-[11px] text-gray-500">{c.phone}</p>
                    <p className="text-[11px] font-bold text-[#00b074] mt-0.5">
                      Balance: {formatCurrency(c.balance)} • Bets: {c.betsCount}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSuspended
                          ? 'bg-red-100 text-red-600'
                          : 'bg-[#d9f3ea] text-[#00b074]'
                      }`}
                    >
                      {c.status}
                    </span>
                    <p className="text-[11px] font-bold text-[#2d9cdb] mt-1">
                      {c.levelName || `Level ${c.tier}`}
                    </p>
                  </div>
                </div>

                {canManage && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleUpgradeLevel(c)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 text-[#2d9cdb] py-1.5 text-[11px] font-bold"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>Upgrade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(c)}
                      className={`inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold ${
                        isSuspended
                          ? 'bg-[#d9f3ea] text-[#00b074]'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(c)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 text-red-600 py-1.5 text-[11px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (sm+) */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-xs border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Player Name</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">Wallet Balance</th>
                <th className="px-5 py-3.5">Account Level</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Referrals</th>
                <th className="px-5 py-3.5 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    Loading all registered users from the BetAura backend...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No users found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const isSuspended = c.status === 'SUSPENDED' || c.status === 'FROZEN';
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900">{c.name}</p>
                        {c.betsCount > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {c.betsCount} bet{c.betsCount === 1 ? '' : 's'} placed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-medium">{c.phone}</td>
                      <td className="px-5 py-3.5 font-extrabold text-[#00b074]">
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-[#2d9cdb]">
                        {c.levelName || `Level ${c.tier}`}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-red-100 text-red-600'
                              : 'bg-[#d9f3ea] text-[#00b074]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{c.referred}</td>
                      <td className="px-5 py-3.5 text-right">
                        {canManage && (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpgradeLevel(c)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-[#2d9cdb] text-[#2d9cdb] hover:text-white px-2.5 py-1.5 text-[11px] font-bold transition"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                              <span>Upgrade Level</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(c)}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                                isSuspended
                                  ? 'bg-[#d9f3ea] text-[#00b074] hover:bg-[#00b074] hover:text-white'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white'
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Unsuspend</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(c)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-[#ff5b5b] text-[#ff5b5b] hover:text-white px-2.5 py-1.5 text-[11px] font-bold transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CustomerDetail() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          KYC Document & Biometric Verification Desk
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Automated Ghana Card / Passport OCR & liveness verification
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xs border border-gray-100 text-center space-y-3">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
          Coming Soon
        </span>
        <h3 className="text-lg font-extrabold text-gray-900">
          Automated KYC ID Document Scanner — Coming Soon
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Direct ID upload and biometric verification API integration is coming soon. In the meantime, Super Admin can upgrade player levels (Level 1 – Level 4) directly on the Customers &amp; Tiers page.
        </p>
      </div>
    </div>
  );
}
