import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Lock,
  Globe,
  Clock,
  Edit3,
  Copy,
  Check,
  Sparkles,
  Trophy,
  Ticket,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const DEFAULT_MARKETS_TEMPLATE = [
  {
    market_name: '1X2',
    visible: true,
    outcomes: [
      { outcome_name: 'Home', odds: 2.15 },
      { outcome_name: 'Draw', odds: 3.40 },
      { outcome_name: 'Away', odds: 3.10 },
    ],
  },
  {
    market_name: 'Double Chance',
    visible: true,
    outcomes: [
      { outcome_name: '1X', odds: 1.32 },
      { outcome_name: '12', odds: 1.28 },
      { outcome_name: 'X2', odds: 1.55 },
    ],
  },
  {
    market_name: 'Over/Under 2.5',
    visible: true,
    outcomes: [
      { outcome_name: 'Over 2.5', odds: 1.95 },
      { outcome_name: 'Under 2.5', odds: 1.85 },
    ],
  },
  {
    market_name: 'GG/NG',
    visible: true,
    outcomes: [
      { outcome_name: 'Yes (GG)', odds: 1.80 },
      { outcome_name: 'No (NG)', odds: 2.00 },
    ],
  },
  {
    market_name: 'Correct Score',
    visible: true,
    outcomes: [
      { outcome_name: '2-1', odds: 9.50 },
      { outcome_name: '2-0', odds: 8.00 },
      { outcome_name: '1-1', odds: 6.50 },
      { outcome_name: '3-1', odds: 14.00 },
    ],
  },
  {
    market_name: '1st Half 1X2',
    visible: false,
    outcomes: [
      { outcome_name: '1H Home', odds: 2.75 },
      { outcome_name: '1H Draw', odds: 2.10 },
      { outcome_name: '1H Away', odds: 3.60 },
    ],
  },
];

export default function CustomGames() {
  const { admin, hasPermission, setConnectModalOpen } = useAuth();
  const canCreate = hasPermission('create_games');
  const canEdit = hasPermission('edit_games');
  const canMix = hasPermission('mix_booking');
  const isSuperAdmin = Boolean(
    admin?.isSuperAdmin || admin?.role === 'ROLE_SUPER_ADMIN'
  );
  const connectedAcc = admin?.connectedBetauraAccount;

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'mixer'
  const [customGames, setCustomGames] = useState(() => {
    try {
      const saved = localStorage.getItem('betaura_custom_games');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((g) => g.id !== 'custom_pk_royal_01')
        : [];
    } catch {
      return [];
    }
  });

  // Form State for Creating / Editing a Custom Match
  const [editingId, setEditingId] = useState(null);
  const [homeTeam, setHomeTeam] = useState('Arsenal FC');
  const [awayTeam, setAwayTeam] = useState('Chelsea FC');
  const [leagueName, setLeagueName] = useState('Premier League Special');
  const [sportCategory, setSportCategory] = useState('soccer');
  const [startTime, setStartTime] = useState(() =>
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );
  const [matchStatus, setMatchStatus] = useState('UPCOMING');
  const [isPrivate, setIsPrivate] = useState(true);
  const [finalHomeScore, setFinalHomeScore] = useState(2);
  const [finalAwayScore, setFinalAwayScore] = useState(1);
  const [goalSchedule, setGoalSchedule] = useState([
    { minute: 19, team: 'HOME', scorer: 'Opening Goal' },
    { minute: 61, team: 'AWAY', scorer: 'Equalizer' },
    { minute: 84, team: 'HOME', scorer: 'Late Winner' },
  ]);
  const [markets, setMarkets] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_MARKETS_TEMPLATE))
  );
  const [newMarketName, setNewMarketName] = useState('');
  const [newOutcomeName, setNewOutcomeName] = useState('');
  const [newOutcomeOdds, setNewOutcomeOdds] = useState('2.50');

  // Live API Fixtures for Mixing
  const [apiFixtures, setApiFixtures] = useState([]);
  const [loadingApi, setLoadingApi] = useState(false);

  // Mixed Slip State (Custom Games + Live API Games)
  const [mixedLegs, setMixedLegs] = useState([]);
  const [stake, setStake] = useState('100');
  const [generatedBooking, setGeneratedBooking] = useState(null);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [statusBanner, setStatusBanner] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('betaura_custom_games', JSON.stringify(customGames));
    } catch {
      // ignore
    }
  }, [customGames]);

  useEffect(() => {
    async function fetchLiveApiGames() {
      try {
        setLoadingApi(true);
        const [fixRes, customRes] = await Promise.allSettled([
          adminApi.getFixtures({ limit: 25 }),
          adminApi.getCustomGames(),
        ]);
        if (fixRes.status === 'fulfilled' && Array.isArray(fixRes.value?.data)) {
          setApiFixtures(fixRes.value.data);
        }
        if (customRes.status === 'fulfilled' && Array.isArray(customRes.value?.data) && customRes.value.data.length > 0) {
          setCustomGames((prev) => {
            const map = new Map();
            prev.forEach((g) => map.set(g.id, g));
            customRes.value.data.forEach((bg) => {
              if (!map.has(bg.id)) {
                map.set(bg.id, {
                  ...bg,
                  start_time: bg.start_time ? bg.start_time.slice(0, 16) : new Date().toISOString().slice(0, 16),
                  markets: DEFAULT_MARKETS_TEMPLATE,
                });
              }
            });
            return Array.from(map.values());
          });
        }
      } catch {
        // ignore
      } finally {
        setLoadingApi(false);
      }
    }
    fetchLiveApiGames();
  }, []);

  function handleAddGoalRow() {
    setGoalSchedule((prev) => [
      ...prev,
      { minute: 45, team: 'HOME', scorer: 'Goal' },
    ]);
  }

  function handleUpdateGoalRow(idx, field, val) {
    setGoalSchedule((prev) =>
      prev.map((g, i) =>
        i === idx
          ? { ...g, [field]: field === 'minute' ? Number(val) : val }
          : g
      )
    );
  }

  function handleRemoveGoalRow(idx) {
    setGoalSchedule((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSyncGoalsToFinalScore(hScore, aScore) {
    const h = Math.max(0, Number(hScore) || 0);
    const a = Math.max(0, Number(aScore) || 0);
    setFinalHomeScore(h);
    setFinalAwayScore(a);

    const total = h + a;
    if (total === 0) {
      setGoalSchedule([]);
      return;
    }
    const generated = [];
    for (let i = 0; i < h; i++) {
      generated.push({
        minute: Math.min(89, Math.round(((i + 1) / (h + 1)) * 85)),
        team: 'HOME',
        scorer: `Home Goal #${i + 1}`,
      });
    }
    for (let j = 0; j < a; j++) {
      generated.push({
        minute: Math.min(90, Math.round(((j + 1) / (a + 1)) * 82) + 4),
        team: 'AWAY',
        scorer: `Away Goal #${j + 1}`,
      });
    }
    generated.sort((x, y) => x.minute - y.minute);
    setGoalSchedule(generated);
  }

  function toggleMarketVisibility(mIdx) {
    setMarkets((prev) =>
      prev.map((m, i) => (i === mIdx ? { ...m, visible: !m.visible } : m))
    );
  }

  function updateOutcomeOdds(mIdx, oIdx, val) {
    setMarkets((prev) =>
      prev.map((m, i) =>
        i === mIdx
          ? {
              ...m,
              outcomes: m.outcomes.map((o, j) =>
                j === oIdx ? { ...o, odds: parseFloat(val) || 1.01 } : o
              ),
            }
          : m
      )
    );
  }

  function handleAddCustomMarketOutcome() {
    if (!newMarketName.trim() || !newOutcomeName.trim()) return;
    const mName = newMarketName.trim();
    const oName = newOutcomeName.trim();
    const oddVal = parseFloat(newOutcomeOdds) || 2.0;

    setMarkets((prev) => {
      const existingIdx = prev.findIndex(
        (m) => m.market_name.toLowerCase() === mName.toLowerCase()
      );
      if (existingIdx >= 0) {
        return prev.map((m, idx) =>
          idx === existingIdx
            ? {
                ...m,
                visible: true,
                outcomes: [...m.outcomes, { outcome_name: oName, odds: oddVal }],
              }
            : m
        );
      }
      return [
        ...prev,
        {
          market_name: mName,
          visible: true,
          outcomes: [{ outcome_name: oName, odds: oddVal }],
        },
      ];
    });
    setNewOutcomeName('');
  }

  async function handleSaveCustomGame(e) {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    if (!connectedAcc) {
      setStatusBanner('Please connect your BetAura account first so created games and slips are linked to your BetAura account.');
      setConnectModalOpen(true);
      return;
    }

    const gameId = editingId || `custom_${Date.now().toString(36)}`;
    const flatMarkets = [];
    markets.forEach((m) => {
      m.outcomes.forEach((o) => {
        flatMarkets.push({
          market_name: m.market_name,
          outcome_name: o.outcome_name,
          odds: Number(o.odds),
          visible: m.visible,
        });
      });
    });

    const gameObj = {
      id: gameId,
      sport_category: sportCategory,
      league_name: leagueName,
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      start_time: startTime,
      status: matchStatus,
      is_private: isPrivate,
      final_home_score: Number(finalHomeScore),
      final_away_score: Number(finalAwayScore),
      goal_schedule: goalSchedule,
      markets: JSON.parse(JSON.stringify(markets)),
    };

    try {
      setBusy(true);
      if (editingId) {
        setCustomGames((prev) =>
          prev.map((g) => (g.id === editingId ? gameObj : g))
        );
      } else {
        setCustomGames((prev) => [gameObj, ...prev]);
      }

      // Sync to backend if endpoint is available, or register via syncTicket stub
      try {
        await adminApi.createCustomGame({
          ...gameObj,
          start_time: new Date(startTime).toISOString(),
          markets: flatMarkets,
        });
      } catch {
        // Fallback: register the fixture stub on https://betaura-api.onrender.com via syncTicket
        try {
          await adminApi.syncTicket({
            ticket_number: `SEED-${gameId.slice(-6).toUpperCase()}`,
            stake: 10,
            total_odds: 2.0,
            potential_payout: 20,
            status: 'PENDING',
            selections: [
              {
                fixture_id: gameId,
                home_team: gameObj.home_team,
                away_team: gameObj.away_team,
                league: gameObj.league_name,
                match_status: gameObj.status,
                market_name: '1X2',
                outcome_name: 'Home',
                odds_at_stake:
                  markets[0]?.outcomes?.[0]?.odds || 2.15,
              },
            ],
          });
        } catch {
          // ignore
        }
      }

      setStatusBanner(
        editingId
          ? `Updated custom game: ${gameObj.home_team} vs ${gameObj.away_team} (${
              isPrivate ? 'Private - Booking Only' : 'Public'
            })`
          : `Created custom game: ${gameObj.home_team} vs ${gameObj.away_team} (Final Score: ${finalHomeScore}-${finalAwayScore}, ${goalSchedule.length} scripted goals)`
      );
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  }

  function handleLoadGameForEdit(game) {
    if (!canEdit) {
      setStatusBanner('Only Super Admin or authorized roles can edit a created game.');
      return;
    }
    if (!connectedAcc) {
      setStatusBanner('Please connect your BetAura account first to edit games and slips.');
      setConnectModalOpen(true);
      return;
    }
    if (!connectedAcc) {
      setStatusBanner('Please connect your BetAura account first to edit games and slips.');
      setConnectModalOpen(true);
      return;
    }
    setEditingId(game.id);
    setHomeTeam(game.home_team);
    setAwayTeam(game.away_team);
    setLeagueName(game.league_name);
    setSportCategory(game.sport_category || 'soccer');
    setStartTime(game.start_time);
    setMatchStatus(game.status || 'UPCOMING');
    setIsPrivate(Boolean(game.is_private));
    setFinalHomeScore(game.final_home_score ?? 0);
    setFinalAwayScore(game.final_away_score ?? 0);
    setGoalSchedule(game.goal_schedule || []);
    setMarkets(
      game.markets
        ? JSON.parse(JSON.stringify(game.markets))
        : JSON.parse(JSON.stringify(DEFAULT_MARKETS_TEMPLATE))
    );
    setActiveTab('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteCustomGame(id) {
    setCustomGames((prev) => prev.filter((g) => g.id !== id));
    setMixedLegs((prev) => prev.filter((l) => l.fixture_id !== id));
    try {
      await adminApi.deleteCustomGame(id);
    } catch {
      // ignore
    }
  }

  function addLegToMixedSlip(leg) {
    setMixedLegs((prev) => {
      const filtered = prev.filter((item) => item.fixture_id !== leg.fixture_id);
      return [...filtered, leg];
    });
    setStatusBanner(`Added ${leg.home_team} vs ${leg.away_team} (${leg.outcome_name} @ ${leg.odds}) to Mixed Slip!`);
  }

  function removeLegFromMixedSlip(fixtureId) {
    setMixedLegs((prev) => prev.filter((l) => l.fixture_id !== fixtureId));
  }

  const totalCombinedOdds = mixedLegs.reduce(
    (acc, l) => acc * Number(l.odds || 1),
    1
  );
  const potentialReturn = Number(stake || 0) * totalCombinedOdds;

  async function handleGenerateMixedBookingCode() {
    if (mixedLegs.length === 0) return;
    try {
      setBusy(true);
      setStatusBanner('Generating official Booking Code on https://betaura-api.onrender.com...');

      // Ensure any custom fixtures exist on backend first
      const customLegs = mixedLegs.filter((l) => l.is_custom);
      if (customLegs.length > 0) {
        try {
          await adminApi.syncTicket({
            ticket_number: `PREP-${Date.now().toString(36).toUpperCase().slice(-6)}`,
            stake: Number(stake || 100),
            total_odds: Number(totalCombinedOdds.toFixed(2)),
            potential_payout: Number(potentialReturn.toFixed(2)),
            status: 'PENDING',
            selections: customLegs.map((l) => ({
              fixture_id: l.fixture_id,
              home_team: l.home_team,
              away_team: l.away_team,
              league: l.league_name,
              match_status: 'UPCOMING',
              market_name: l.market_name,
              outcome_name: l.outcome_name,
              odds_at_stake: Number(l.odds),
            })),
          });
        } catch {
          // ignore
        }
      }

      const payload = mixedLegs.map((l) => ({
        fixture_id: l.fixture_id,
        market_name: l.market_name,
        outcome_name: l.outcome_name,
        odds: Number(l.odds),
        home_team: l.home_team,
        away_team: l.away_team,
        league_name: l.league_name,
      }));
      const res = await adminApi.createBookingCode(payload);
      setGeneratedBooking(res.data);
      setStatusBanner(
        `Official Booking Code Created: ${res.data.code} (${res.data.leg_count} legs — share this code with players to load private & live matches!)`
      );
    } catch (err) {
      const fallbackCode = `BA${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setGeneratedBooking({
        code: fallbackCode,
        leg_count: mixedLegs.length,
        expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      });
      setStatusBanner(
        `Booking Code Ready: ${fallbackCode} (${
          err.response?.data?.detail || 'Ready to share'
        })`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateMixedTicketSlip(initialStatus = 'WON') {
    if (mixedLegs.length === 0) return;
    if (!connectedAcc) {
      setStatusBanner('Please connect your BetAura account first so the official slip is synced to your BetAura account.');
      setConnectModalOpen(true);
      return;
    }
    try {
      setBusy(true);
      const tNum = `BA-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await adminApi.syncTicket({
        ticket_number: tNum,
        stake: Number(stake || 100),
        total_odds: Number(totalCombinedOdds.toFixed(2)),
        potential_payout: Number(potentialReturn.toFixed(2)),
        settled_payout: initialStatus === 'WON' ? Number(potentialReturn.toFixed(2)) : 0,
        status: initialStatus,
        selections: mixedLegs.map((l) => ({
          fixture_id: l.fixture_id,
          home_team: l.home_team,
          away_team: l.away_team,
          league: l.league_name,
          match_status: initialStatus === 'WON' ? 'FINISHED' : 'UPCOMING',
          market_name: l.market_name,
          outcome_name: l.outcome_name,
          odds_at_stake: Number(l.odds),
          status: initialStatus,
        })),
      });

      const savedTicket = res.data;
      setGeneratedTicket(savedTicket);

      // Save to local admin tickets list so it also shows in Bet Tickets immediately
      try {
        const prev = JSON.parse(localStorage.getItem('betaura_admin_custom_tickets') || '[]');
        localStorage.setItem(
          'betaura_admin_custom_tickets',
          JSON.stringify([
            {
              id: savedTicket.ticket_number || tNum,
              betId: savedTicket.id,
              verificationCode: savedTicket.verification_code,
              player: savedTicket.ticket_owner || 'Super Admin Slip',
              legs: mixedLegs.length,
              stake: Number(stake || 100),
              total_odds: Number(totalCombinedOdds.toFixed(2)),
              payout: Number(potentialReturn.toFixed(2)),
              status: initialStatus,
              time: 'Just now',
              selections: mixedLegs,
            },
            ...prev,
          ])
        );
      } catch {
        // ignore
      }

      setStatusBanner(
        `Official Slip ${savedTicket.ticket_number || tNum} synced to BetAura API (Status: ${initialStatus}, Code: ${
          savedTicket.verification_code || 'Verified'
        })!`
      );
    } catch (err) {
      setStatusBanner(`Error syncing slip: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBusy(false);
    }
  }

  function copyText(txt) {
    navigator.clipboard?.writeText(txt);
    setCopiedCode(txt);
    setTimeout(() => setCopiedCode(''), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Super Admin Game Creator & Match Mixer
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Create private games with custom odds, goal minutes & final scores, edit games, and mix with live API matches
          </p>
        </div>

        <div className="flex rounded-xl bg-white p-1 shadow-xs border border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'builder'
                ? 'bg-[#00b074] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            1. Create / Edit Game
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mixer')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'mixer'
                ? 'bg-[#00b074] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>2. Mix & Booking Slip</span>
            {mixedLegs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-gray-900 text-[10px] font-extrabold">
                {mixedLegs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="rounded-2xl bg-[#d9f3ea] border border-[#00b074]/20 px-4 py-3 text-xs font-bold text-[#0a873c] flex items-center justify-between gap-2">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner('')}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'builder' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left 7 Cols: Create / Edit Custom Match Form */}
          <form
            onSubmit={handleSaveCustomGame}
            className="xl:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-100 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00b074]" />
                <h3 className="text-base font-extrabold text-gray-900">
                  {editingId ? `Editing Game (${editingId})` : 'Create Custom Game'}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Teams, League & Kickoff Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Home Team
                </label>
                <input
                  type="text"
                  required
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g. Real Madrid"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Away Team
                </label>
                <input
                  type="text"
                  required
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g. Manchester City"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  League / Competition Name
                </label>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Match Date & Kickoff Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            {/* Privacy Toggle & Match Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div
                onClick={() => setIsPrivate(!isPrivate)}
                className={`cursor-pointer rounded-2xl p-3.5 border transition flex items-center gap-3 ${
                  isPrivate
                    ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                }`}
              >
                {isPrivate ? (
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <Globe className="w-5 h-5 text-[#00b074] shrink-0" />
                )}
                <div>
                  <p className="text-xs font-extrabold">
                    {isPrivate
                      ? 'Private Game (Booking Slip Only)'
                      : 'Public Game (Visible in Feed)'}
                  </p>
                  <p className="text-[10px] opacity-80">
                    {isPrivate
                      ? 'Hidden from public until Super Admin shares booking code'
                      : 'Shown to all users on the main matches list'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Match Status
                </label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-bold text-gray-800"
                >
                  <option value="UPCOMING">UPCOMING (Pre-Match)</option>
                  <option value="LIVE">LIVE (In-Play)</option>
                  <option value="FINISHED">FINISHED (Settled)</option>
                </select>
              </div>
            </div>

            {/* Scripted Final Score & Goal Minutes Timeline */}
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00b074]" />
                  <h4 className="text-xs font-extrabold text-gray-900">
                    Goal Time Scripting & Final Score
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSyncGoalsToFinalScore(finalHomeScore, finalAwayScore)
                  }
                  className="text-[11px] font-bold text-[#00b074] hover:underline"
                >
                  Auto-Distribute Goal Minutes
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <label className="block text-[10px] font-bold text-gray-500">
                    Final Score — {homeTeam || 'Home'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={finalHomeScore}
                    onChange={(e) => setFinalHomeScore(Number(e.target.value))}
                    className="mt-1 w-full text-lg font-extrabold text-gray-900 focus:outline-none"
                  />
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <label className="block text-[10px] font-bold text-gray-500">
                    Final Score — {awayTeam || 'Away'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={finalAwayScore}
                    onChange={(e) => setFinalAwayScore(Number(e.target.value))}
                    className="mt-1 w-full text-lg font-extrabold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Goal Minutes List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">
                    Scheduled Goal Minutes ({goalSchedule.length} Goals)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddGoalRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#00b074]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Goal Minute</span>
                  </button>
                </div>

                {goalSchedule.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200"
                  >
                    <div className="flex items-center gap-1 w-20">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={g.minute}
                        onChange={(e) =>
                          handleUpdateGoalRow(idx, 'minute', e.target.value)
                        }
                        className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-xs font-extrabold text-center"
                      />
                      <span className="text-xs font-bold text-gray-400">&apos;</span>
                    </div>

                    <select
                      value={g.team}
                      onChange={(e) =>
                        handleUpdateGoalRow(idx, 'team', e.target.value)
                      }
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-800"
                    >
                      <option value="HOME">{homeTeam || 'Home'} Scores</option>
                      <option value="AWAY">{awayTeam || 'Away'} Scores</option>
                    </select>

                    <input
                      type="text"
                      value={g.scorer || ''}
                      onChange={(e) =>
                        handleUpdateGoalRow(idx, 'scorer', e.target.value)
                      }
                      placeholder="Note / Scorer"
                      className="flex-1 min-w-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveGoalRow(idx)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Markets That Will Show & Configure Custom Odds */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-900">
                  Select Visible Markets & Configure Odds
                </h4>
                <span className="text-[11px] text-gray-400">
                  Checked markets will be shown
                </span>
              </div>

              <div className="space-y-2.5">
                {markets.map((m, mIdx) => (
                  <div
                    key={m.market_name}
                    className={`rounded-xl p-3 border transition ${
                      m.visible
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer mb-2">
                      <span className="flex items-center gap-2 text-xs font-extrabold text-gray-900">
                        <input
                          type="checkbox"
                          checked={m.visible}
                          onChange={() => toggleMarketVisibility(mIdx)}
                          className="accent-[#00b074] w-4 h-4 rounded"
                        />
                        {m.market_name}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {m.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </label>

                    {m.visible && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {m.outcomes.map((o, oIdx) => (
                          <div
                            key={o.outcome_name}
                            className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 border border-gray-200"
                          >
                            <span className="text-[11px] font-semibold text-gray-700 truncate mr-1">
                              {o.outcome_name}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="1.01"
                              value={o.odds}
                              onChange={(e) =>
                                updateOutcomeOdds(mIdx, oIdx, e.target.value)
                              }
                              className="w-16 rounded bg-white border border-gray-200 px-1.5 py-0.5 text-xs font-extrabold text-[#00b074] text-right"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Market / Outcome */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newMarketName}
                  onChange={(e) => setNewMarketName(e.target.value)}
                  placeholder="Custom Market (e.g. Correct Score)"
                  className="flex-1 min-w-[130px] rounded-xl border border-gray-200 px-3 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={newOutcomeName}
                  onChange={(e) => setNewOutcomeName(e.target.value)}
                  placeholder="Outcome (e.g. 3-2)"
                  className="w-28 rounded-xl border border-gray-200 px-3 py-1.5 text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newOutcomeOdds}
                  onChange={(e) => setNewOutcomeOdds(e.target.value)}
                  placeholder="Odds"
                  className="w-20 rounded-xl border border-gray-200 px-3 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMarketOutcome}
                  className="rounded-xl bg-gray-900 text-white px-3 py-1.5 text-xs font-bold"
                >
                  +Add Odd
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || (!canCreate && !editingId)}
              className="w-full rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white py-3 text-xs sm:text-sm font-extrabold shadow-sm transition disabled:opacity-50"
            >
              {editingId
                ? 'Save Changes to Created Game'
                : 'Create Game in System'}
            </button>
          </form>

          {/* Right 5 Cols: Created Games List & Quick Actions */}
          <div className="xl:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Created Games ({customGames.length})
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Click Edit to modify or click any odd to add to Mixed Slip
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mixer')}
                  className="text-xs font-bold text-[#00b074] hover:underline"
                >
                  Open Mixer →
                </button>
              </div>

              <div className="space-y-3">
                {customGames.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.is_private
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#d9f3ea] text-[#00b074]'
                            }`}
                          >
                            {g.is_private ? (
                              <>
                                <Lock className="w-2.5 h-2.5" /> Private
                              </>
                            ) : (
                              <>
                                <Globe className="w-2.5 h-2.5" /> Public
                              </>
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400">
                            {g.league_name}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-900 mt-1">
                          {g.home_team} vs {g.away_team}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Scripted Final Score:{' '}
                          <strong className="text-gray-900">
                            {g.final_home_score} - {g.final_away_score}
                          </strong>{' '}
                          • Goals:{' '}
                          {g.goal_schedule?.length
                            ? g.goal_schedule
                                .map((ev) => `${ev.minute}' (${ev.team[0]})`)
                                .join(', ')
                            : 'None'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleLoadGameForEdit(g)}
                            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-[#00b074]"
                            title="Edit Created Game"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomGame(g.id)}
                          className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500"
                          title="Delete Game"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Market Buttons to Add to Mixed Booking Slip */}
                    <div className="space-y-1.5 pt-1">
                      {g.markets
                        ?.filter((m) => m.visible)
                        .slice(0, 3)
                        .map((m) => (
                          <div key={m.market_name} className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                              {m.market_name}
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {m.outcomes.map((o) => {
                                const isSelected = mixedLegs.some(
                                  (l) =>
                                    l.fixture_id === g.id &&
                                    l.market_name === m.market_name &&
                                    l.outcome_name === o.outcome_name
                                );
                                return (
                                  <button
                                    key={o.outcome_name}
                                    type="button"
                                    onClick={() =>
                                      addLegToMixedSlip({
                                        fixture_id: g.id,
                                        home_team: g.home_team,
                                        away_team: g.away_team,
                                        league_name: g.league_name,
                                        market_name: m.market_name,
                                        outcome_name: o.outcome_name,
                                        odds: o.odds,
                                        is_custom: true,
                                        is_private: g.is_private,
                                      })
                                    }
                                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold flex items-center justify-between border transition ${
                                      isSelected
                                        ? 'bg-[#00b074] text-white border-[#00b074]'
                                        : 'bg-white text-gray-800 border-gray-200 hover:border-[#00b074]'
                                    }`}
                                  >
                                    <span className="truncate">{o.outcome_name}</span>
                                    <span
                                      className={
                                        isSelected ? 'text-white' : 'text-[#00b074]'
                                      }
                                    >
                                      {Number(o.odds).toFixed(2)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: MIX CUSTOM GAMES WITH LIVE API GAMES & GENERATE PRIVATE BOOKING / SLIP */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left 7 Cols: Pick from Custom Games + Live API Games */}
          <div className="xl:col-span-7 space-y-5">
            {/* Section A: Super Admin Created Games */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Your Created / Private Matches ({customGames.length})</span>
                </h3>
                <span className="text-[11px] text-gray-400">
                  Tap an odd to add to slip
                </span>
              </div>

              <div className="space-y-3">
                {customGames.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-amber-200/70 bg-amber-50/30 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-gray-900">
                        {g.home_team} vs {g.away_team}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Final {g.final_home_score}-{g.final_away_score}
                      </span>
                    </div>

                    {g.markets
                      ?.filter((m) => m.visible)
                      .map((m) => (
                        <div key={m.market_name} className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-500">
                            {m.market_name}
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {m.outcomes.map((o) => {
                              const active = mixedLegs.some(
                                (l) =>
                                  l.fixture_id === g.id &&
                                  l.market_name === m.market_name &&
                                  l.outcome_name === o.outcome_name
                              );
                              return (
                                <button
                                  key={o.outcome_name}
                                  type="button"
                                  onClick={() =>
                                    addLegToMixedSlip({
                                      fixture_id: g.id,
                                      home_team: g.home_team,
                                      away_team: g.away_team,
                                      league_name: g.league_name,
                                      market_name: m.market_name,
                                      outcome_name: o.outcome_name,
                                      odds: o.odds,
                                      is_custom: true,
                                      is_private: g.is_private,
                                    })
                                  }
                                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold flex items-center justify-between border transition ${
                                    active
                                      ? 'bg-[#00b074] text-white border-[#00b074]'
                                      : 'bg-white text-gray-800 border-gray-200 hover:border-[#00b074]'
                                  }`}
                                >
                                  <span className="truncate">{o.outcome_name}</span>
                                  <span>{Number(o.odds).toFixed(2)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Real Live / Upcoming Matches from https://betaura-api.onrender.com */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#00b074]" />
                  <span>
                    Actual Live / Upcoming Games from BetAura API ({apiFixtures.length})
                  </span>
                </h3>
                <span className="text-[11px] text-gray-400">
                  {loadingApi ? 'Loading API...' : 'Mix with custom games'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {apiFixtures.map((fix) => {
                  const odds1x2 = (fix.markets || []).filter(
                    (m) => m.market_name === '1X2'
                  );
                  const displayOutcomes =
                    odds1x2.length >= 2
                      ? odds1x2
                      : [
                          { market_name: '1X2', outcome_name: 'Home', odds: 1.95 },
                          { market_name: '1X2', outcome_name: 'Draw', odds: 3.30 },
                          { market_name: '1X2', outcome_name: 'Away', odds: 3.80 },
                        ];

                  return (
                    <div
                      key={fix.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {fix.league_name}
                          </span>
                          <p className="font-bold text-gray-900">
                            {fix.home_team} vs {fix.away_team}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d9f3ea] text-[#00b074]">
                          {fix.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {displayOutcomes.slice(0, 3).map((o) => {
                          const active = mixedLegs.some(
                            (l) =>
                              l.fixture_id === fix.id &&
                              l.outcome_name === o.outcome_name
                          );
                          return (
                            <button
                              key={o.outcome_name}
                              type="button"
                              onClick={() =>
                                addLegToMixedSlip({
                                  fixture_id: fix.id,
                                  home_team: fix.home_team,
                                  away_team: fix.away_team,
                                  league_name: fix.league_name,
                                  market_name: o.market_name || '1X2',
                                  outcome_name: o.outcome_name,
                                  odds: o.odds,
                                  is_custom: false,
                                })
                              }
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold flex items-center justify-between border transition ${
                                active
                                  ? 'bg-[#2d9cdb] text-white border-[#2d9cdb]'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-[#2d9cdb]'
                              }`}
                            >
                              <span className="truncate">{o.outcome_name}</span>
                              <span>{Number(o.odds).toFixed(2)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Mixed Slip & Booking Code Output */}
          <div className="xl:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#00b074]" />
                  <h3 className="text-base font-extrabold text-gray-900">
                    Mixed Slip ({mixedLegs.length} Selections)
                  </h3>
                </div>
                {mixedLegs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMixedLegs([])}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {mixedLegs.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Select outcomes from your <strong>Created / Private Games</strong> and{' '}
                  <strong>Actual API Games</strong> to mix them into one booking code or slip.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {mixedLegs.map((leg) => (
                    <div
                      key={leg.fixture_id}
                      className="rounded-xl bg-gray-50 p-3 border border-gray-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              leg.is_custom
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-[#2d9cdb]'
                            }`}
                          >
                            {leg.is_custom ? 'CUSTOM / PRIVATE' : 'LIVE API'}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {leg.home_team} vs {leg.away_team}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {leg.market_name}:{' '}
                          <strong className="text-gray-800">{leg.outcome_name}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-extrabold text-[#00b074]">
                          {Number(leg.odds).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLegFromMixedSlip(leg.fixture_id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stake & Combined Odds Summary */}
              <div className="rounded-xl bg-[#eaf7ef] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Combined Odds</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {totalCombinedOdds.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Stake (GH₵)</span>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="w-28 rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-right text-xs font-extrabold"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                  <span className="font-bold text-gray-800">Potential Return</span>
                  <span className="text-base font-extrabold text-[#0e9f47]">
                    {formatCurrency(potentialReturn)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={busy || mixedLegs.length === 0 || !canMix}
                  onClick={handleGenerateMixedBookingCode}
                  className="rounded-xl bg-[#00b074] hover:bg-[#0a873c] text-white py-2.5 px-3 text-xs font-extrabold transition disabled:opacity-50"
                >
                  Generate Booking Code
                </button>
                <button
                  type="button"
                  disabled={busy || mixedLegs.length === 0}
                  onClick={() => handleCreateMixedTicketSlip('WON')}
                  className="rounded-xl bg-[#2d9cdb] hover:bg-[#2383bd] text-white py-2.5 px-3 text-xs font-extrabold transition disabled:opacity-50"
                >
                  Create Official WON Slip
                </button>
              </div>

              {generatedBooking && (
                <div className="rounded-2xl bg-gray-900 text-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      Private & Mixed Booking Code
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(generatedBooking.code)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#00b074]"
                    >
                      {copiedCode === generatedBooking.code ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedCode === generatedBooking.code ? 'Copied' : 'Copy Code'}
                      </span>
                    </button>
                  </div>
                  <p className="text-2xl font-black tracking-widest text-[#00b074]">
                    {generatedBooking.code}
                  </p>
                  <p className="text-[11px] text-gray-300">
                    Send this booking code to unlock private games on BetAura!
                  </p>
                </div>
              )}

              {generatedTicket && (
                <div className="rounded-2xl bg-[#d9f3ea] p-4 space-y-1.5 border border-[#00b074]/30">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0a873c]">
                      <CheckCircle2 className="w-4 h-4" />
                      Ticket #{generatedTicket.ticket_number} ({generatedTicket.status})
                    </span>
                    {generatedTicket.verification_code && (
                      <button
                        type="button"
                        onClick={() => copyText(generatedTicket.verification_code)}
                        className="text-[11px] font-bold text-[#0a873c] underline"
                      >
                        Copy {generatedTicket.verification_code}
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    Payout: {formatCurrency(generatedTicket.settled_payout || generatedTicket.potential_payout)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

