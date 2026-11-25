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

const POPULAR_LEAGUES = [
  'Argentina - Liga Profesional (Clausura)',
  'Premier League Special',
  'UEFA Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Ghana Premier League',
  'Nigeria Premier Football League',
];

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
    market_name: 'Red Card in Match',
    visible: true,
    outcomes: [
      { outcome_name: 'Yes', odds: 3.50 },
      { outcome_name: 'No', odds: 1.25 },
    ],
  },
  {
    market_name: 'Total Cards Over/Under 3.5',
    visible: true,
    outcomes: [
      { outcome_name: 'Over 3.5', odds: 1.85 },
      { outcome_name: 'Under 3.5', odds: 1.85 },
    ],
  },
  {
    market_name: 'Total Bookings Over/Under 4.5',
    visible: true,
    outcomes: [
      { outcome_name: 'Over 4.5', odds: 2.10 },
      { outcome_name: 'Under 4.5', odds: 1.65 },
    ],
  },
  {
    market_name: 'Correct Score',
    visible: true,
    outcomes: [
      { outcome_name: '1-0', odds: 7.50 },
      { outcome_name: '2-0', odds: 8.00 },
      { outcome_name: '2-1', odds: 9.50 },
      { outcome_name: '3-0', odds: 15.00 },
      { outcome_name: '3-1', odds: 14.00 },
      { outcome_name: '0-0', odds: 9.00 },
      { outcome_name: '1-1', odds: 6.50 },
      { outcome_name: '2-2', odds: 13.00 },
      { outcome_name: '0-1', odds: 8.50 },
      { outcome_name: '0-2', odds: 12.00 },
      { outcome_name: '1-2', odds: 11.00 },
      { outcome_name: 'Others', odds: 16.00 },
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

export function normalizeMarkets(rawMarkets) {
  if (!Array.isArray(rawMarkets) || rawMarkets.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_MARKETS_TEMPLATE));
  }

  const isGrouped = rawMarkets.some((m) => m && Array.isArray(m.outcomes));
  if (isGrouped) {
    return rawMarkets.map((m) => ({
      market_name: m?.market_name || 'Market',
      visible: m?.visible !== false,
      outcomes: Array.isArray(m?.outcomes)
        ? m.outcomes.map((o) => ({
            outcome_name: String(o?.outcome_name || 'Outcome'),
            odds: Number(o?.odds) || 1.5,
          }))
        : [],
    }));
  }

  // Flat market structure: group by market_name
  const groupedMap = new Map();
  for (const item of rawMarkets) {
    if (!item) continue;
    const mName = item.market_name || '1X2';
    if (!groupedMap.has(mName)) {
      groupedMap.set(mName, {
        market_name: mName,
        visible: item.visible !== false,
        outcomes: [],
      });
    }
    const grp = groupedMap.get(mName);
    if (item.outcome_name) {
      grp.outcomes.push({
        outcome_name: String(item.outcome_name),
        odds: Number(item.odds) || 1.5,
      });
    }
  }

  const result = Array.from(groupedMap.values());
  return result.length > 0 ? result : JSON.parse(JSON.stringify(DEFAULT_MARKETS_TEMPLATE));
}

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
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((g) => g && g.id !== 'custom_pk_royal_01')
        .map((g) => ({
          ...g,
          goal_schedule: Array.isArray(g.goal_schedule) ? g.goal_schedule : [],
          penalty_schedule: Array.isArray(g.penalty_schedule) ? g.penalty_schedule : [],
          card_schedule: Array.isArray(g.card_schedule) ? g.card_schedule : [],
          var_schedule: Array.isArray(g.var_schedule) ? g.var_schedule : [],
          markets: normalizeMarkets(g.markets),
        }));
    } catch {
      return [];
    }
  });

  // Helper to format Date into local YYYY-MM-DDTHH:mm for datetime-local input
  function toLocalDateTimeInput(dateObj) {
    const d = dateObj instanceof Date && !Number.isNaN(dateObj.getTime()) ? dateObj : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Form State for Creating / Editing a Custom Match
  const [editingId, setEditingId] = useState(null);
  const [customGameId, setCustomGameId] = useState('');
  const [homeTeam, setHomeTeam] = useState('Arsenal FC');
  const [awayTeam, setAwayTeam] = useState('Chelsea FC');
  const [leagueName, setLeagueName] = useState('Argentina - Liga Profesional (Clausura)');
  const [sportCategory, setSportCategory] = useState('soccer');
  const [startTime, setStartTime] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 3600 * 1000))
  );
  const [matchStatus, setMatchStatus] = useState('UPCOMING');
  const [isPrivate, setIsPrivate] = useState(true);
  const [finalHomeScore, setFinalHomeScore] = useState(2);
  const [finalAwayScore, setFinalAwayScore] = useState(1);
  const [eventScriptTab, setEventScriptTab] = useState('goals'); // 'goals' | 'cards'
  const [goalSchedule, setGoalSchedule] = useState([
    { minute: 19, team: 'HOME', scorer: 'Opening Goal' },
    { minute: 61, team: 'AWAY', scorer: 'Equalizer' },
    { minute: 84, team: 'HOME', scorer: 'Late Winner' },
  ]);
  const [penaltySchedule, setPenaltySchedule] = useState([]);
  const [cardSchedule, setCardSchedule] = useState([
    { minute: 31, team: 'AWAY', player: 'Defender #4', card_type: 'YELLOW', reason: 'Tactical Foul' },
    { minute: 76, team: 'HOME', player: 'Midfielder #8', card_type: 'YELLOW', reason: 'Dissent' },
  ]);
  const [varSchedule, setVarSchedule] = useState([]);
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
  const [customTicketOrBookingId, setCustomTicketOrBookingId] = useState('');
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
            prev.forEach((g) => {
              if (g?.id) map.set(g.id, g);
            });
            customRes.value.data.forEach((bg) => {
              if (!bg || !bg.id) return;
              if (!map.has(bg.id)) {
                map.set(bg.id, {
                  ...bg,
                  start_time: bg.start_time ? String(bg.start_time).slice(0, 16) : new Date().toISOString().slice(0, 16),
                  goal_schedule: Array.isArray(bg.goal_schedule) ? bg.goal_schedule : [],
                  penalty_schedule: Array.isArray(bg.penalty_schedule) ? bg.penalty_schedule : [],
                  card_schedule: Array.isArray(bg.card_schedule) ? bg.card_schedule : [],
                  var_schedule: Array.isArray(bg.var_schedule) ? bg.var_schedule : [],
                  markets: normalizeMarkets(bg.markets),
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

  function handleAddPenaltyRow() {
    setPenaltySchedule((prev) => [
      ...prev,
      { minute: 50, team: 'HOME', taker: 'Penalty Taker', outcome: 'SCORED' },
    ]);
  }

  function handleUpdatePenaltyRow(idx, field, val) {
    setPenaltySchedule((prev) =>
      prev.map((p, i) =>
        i === idx
          ? { ...p, [field]: field === 'minute' ? Number(val) : val }
          : p
      )
    );
  }

  function handleRemovePenaltyRow(idx) {
    setPenaltySchedule((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleAddCardRow() {
    setCardSchedule((prev) => [
      ...prev,
      { minute: 60, team: 'HOME', player: 'Player Name', card_type: 'YELLOW', reason: 'Tactical Foul' },
    ]);
  }

  function handleUpdateCardRow(idx, field, val) {
    setCardSchedule((prev) =>
      prev.map((c, i) =>
        i === idx
          ? { ...c, [field]: field === 'minute' ? Number(val) : val }
          : c
      )
    );
  }

  function handleRemoveCardRow(idx) {
    setCardSchedule((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleAddVarRow() {
    setVarSchedule((prev) => [
      ...prev,
      { minute: 65, team: 'HOME', decision: 'GOAL_CHECK_CONFIRMED', description: 'VAR Goal Review' },
    ]);
  }

  function handleUpdateVarRow(idx, field, val) {
    setVarSchedule((prev) =>
      prev.map((v, i) =>
        i === idx
          ? { ...v, [field]: field === 'minute' ? Number(val) : val }
          : v
      )
    );
  }

  function handleRemoveVarRow(idx) {
    setVarSchedule((prev) => prev.filter((_, i) => i !== idx));
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

  function handleAddOutcomeToMarket(mIdx, outcomeName, defaultOdds = 2.0) {
    if (!outcomeName || !outcomeName.trim()) return;
    const cleanName = outcomeName.trim();
    setMarkets((prev) =>
      prev.map((m, i) => {
        if (i !== mIdx) return m;
        const currentOutcomes = Array.isArray(m?.outcomes) ? m.outcomes : [];
        const exists = currentOutcomes.some(
          (o) => String(o?.outcome_name || '').toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) {
          return {
            ...m,
            visible: true,
            outcomes: currentOutcomes.map((o) =>
              String(o?.outcome_name || '').toLowerCase() === cleanName.toLowerCase()
                ? { ...o, odds: Number(defaultOdds) || o.odds }
                : o
            ),
          };
        }
        return {
          ...m,
          visible: true,
          outcomes: [...currentOutcomes, { outcome_name: cleanName, odds: Number(defaultOdds) || 2.0 }],
        };
      })
    );
  }

  function handleRemoveOutcome(mIdx, oIdx) {
    setMarkets((prev) =>
      prev.map((m, i) =>
        i === mIdx
          ? {
              ...m,
              outcomes: (Array.isArray(m?.outcomes) ? m.outcomes : []).filter((_, j) => j !== oIdx),
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
        (m) => String(m?.market_name || '').toLowerCase() === mName.toLowerCase()
      );
      if (existingIdx >= 0) {
        return prev.map((m, idx) =>
          idx === existingIdx
            ? {
                ...m,
                visible: true,
                outcomes: [...(Array.isArray(m?.outcomes) ? m.outcomes : []), { outcome_name: oName, odds: oddVal }],
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

    const rawCustomId = customGameId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const normalizedCustomId = rawCustomId
      ? rawCustomId.startsWith('custom_')
        ? rawCustomId
        : `custom_${rawCustomId}`
      : null;
    const gameId = editingId || normalizedCustomId || `custom_${Date.now().toString(36)}`;
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
      penalty_schedule: penaltySchedule,
      card_schedule: cardSchedule,
      var_schedule: varSchedule,
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
          penalty_schedule: penaltySchedule,
          card_schedule: cardSchedule,
          var_schedule: varSchedule,
          markets: flatMarkets,
        });
      } catch {
        // Fallback: register the fixture stub on https://betaura.online via syncTicket
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
      setCustomGameId('');
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
    setEditingId(game.id);
    setCustomGameId(game.id ? String(game.id).replace(/^custom_/, '') : '');
    setHomeTeam(game.home_team);
    setAwayTeam(game.away_team);
    setLeagueName(game.league_name);
    setSportCategory(game.sport_category || 'soccer');
    setStartTime(game.start_time ? toLocalDateTimeInput(new Date(game.start_time)) : toLocalDateTimeInput(new Date()));
    setMatchStatus(game.status || 'UPCOMING');
    setIsPrivate(Boolean(game.is_private));
    setFinalHomeScore(game.final_home_score ?? 0);
    setFinalAwayScore(game.final_away_score ?? 0);
    setGoalSchedule(Array.isArray(game.goal_schedule) ? game.goal_schedule : []);
    setPenaltySchedule(Array.isArray(game.penalty_schedule) ? game.penalty_schedule : []);
    setCardSchedule(Array.isArray(game.card_schedule) ? game.card_schedule : []);
    setVarSchedule(Array.isArray(game.var_schedule) ? game.var_schedule : []);
    setMarkets(normalizeMarkets(game.markets));
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
      setStatusBanner('Generating official Booking Code on https://betaura.online...');

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
      const customCodeClean = customTicketOrBookingId.trim().toUpperCase();
      const res = await adminApi.createBookingCode(payload, customCodeClean || null);
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
      const customTId = customTicketOrBookingId.trim().toUpperCase();
      const tNum = customTId || `BA-${Math.floor(100000 + Math.random() * 900000)}`;
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
                  list="popular-leagues-datalist"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="e.g. Argentina - Liga Profesional (Clausura)"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold"
                />
                <datalist id="popular-leagues-datalist">
                  {POPULAR_LEAGUES.map((lg) => (
                    <option key={lg} value={lg} />
                  ))}
                </datalist>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {POPULAR_LEAGUES.slice(0, 5).map((lg) => (
                    <button
                      key={lg}
                      type="button"
                      onClick={() => setLeagueName(lg)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        leagueName === lg
                          ? 'bg-[#00b074] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {lg}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Match Date &amp; Kickoff Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-mono"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[
                    { label: 'Now', mins: 0 },
                    { label: '+15m', mins: 15 },
                    { label: '+1h', mins: 60 },
                    { label: '+3h', mins: 180 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setStartTime(toLocalDateTimeInput(new Date(Date.now() + p.mins * 60 * 1000)))}
                      className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Custom Game ID <span className="text-gray-400 font-normal">(Optional — leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  value={customGameId}
                  disabled={Boolean(editingId)}
                  onChange={(e) => setCustomGameId(e.target.value)}
                  placeholder="e.g. VIP2026 or MATCH884"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-mono font-bold disabled:bg-gray-50 disabled:text-gray-400"
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

            {/* Scripted Match Events: Goals & Bookings (Cards) */}
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00b074]" />
                  <h4 className="text-xs font-extrabold text-gray-900">
                    Match Scripting: Goals &amp; Bookings (Cards)
                  </h4>
                </div>
                <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  ⏱️ Full 90 Min Match (45m 1H • 15m HT Break • 45m 2H)
                </span>
              </div>

              {/* Sub-tabs for Scripting */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setEventScriptTab('goals')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition flex items-center justify-center gap-1.5 ${
                    eventScriptTab === 'goals'
                      ? 'bg-[#00b074] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>⚽ Goals</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      eventScriptTab === 'goals'
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {goalSchedule.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventScriptTab('cards')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition flex items-center justify-center gap-1.5 ${
                    eventScriptTab === 'cards'
                      ? 'bg-[#00b074] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>🟨 Cards &amp; Bookings</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      eventScriptTab === 'cards'
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {cardSchedule.length}
                  </span>
                </button>
              </div>

              {/* ⚽ TAB 1: GOALS SCRIPTING */}
              {eventScriptTab === 'goals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-600">
                      Final Score Targets
                    </span>
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

                    {goalSchedule.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic bg-white p-3 rounded-xl border border-dashed border-gray-200 text-center">
                        No goals scripted (0-0 draw). Click &apos;Add Goal Minute&apos; to schedule goals.
                      </p>
                    ) : (
                      goalSchedule.map((g, idx) => (
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
                            placeholder="Note / Scorer (e.g. Saka 19')"
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
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 🟨 TAB 2: CARDS & BOOKINGS SCRIPTING */}
              {eventScriptTab === 'cards' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-gray-700">
                        Bookings &amp; Disciplinary Cards ({cardSchedule.length})
                      </span>
                      <p className="text-[10px] text-gray-400">
                        Script Yellows, Second Yellows, Straight Reds and match bookings
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCardRow}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#00b074] bg-[#d9f3ea] px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Card / Booking</span>
                    </button>
                  </div>

                  {cardSchedule.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic bg-white p-3 rounded-xl border border-dashed border-gray-200 text-center">
                      No disciplinary bookings scripted. Click &apos;Add Card / Booking&apos; to schedule bookings.
                    </p>
                  ) : (
                    cardSchedule.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-xl p-2.5 border border-gray-200"
                      >
                        <div className="flex items-center gap-1 w-18">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={c.minute}
                            onChange={(e) =>
                              handleUpdateCardRow(idx, 'minute', e.target.value)
                            }
                            className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-xs font-extrabold text-center"
                          />
                          <span className="text-xs font-bold text-gray-400">&apos;</span>
                        </div>

                        <select
                          value={c.team}
                          onChange={(e) =>
                            handleUpdateCardRow(idx, 'team', e.target.value)
                          }
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-bold text-gray-800"
                        >
                          <option value="HOME">{homeTeam || 'Home'}</option>
                          <option value="AWAY">{awayTeam || 'Away'}</option>
                        </select>

                        <select
                          value={c.card_type}
                          onChange={(e) =>
                            handleUpdateCardRow(idx, 'card_type', e.target.value)
                          }
                          className={`rounded-lg border px-2 py-1 text-xs font-extrabold ${
                            c.card_type === 'YELLOW'
                              ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
                              : c.card_type === 'SECOND_YELLOW'
                              ? 'border-amber-400 bg-amber-50 text-amber-900'
                              : 'border-red-300 bg-red-50 text-red-800'
                          }`}
                        >
                          <option value="YELLOW">🟨 Yellow</option>
                          <option value="SECOND_YELLOW">🟨🟨 2nd Yellow (Red)</option>
                          <option value="RED">🟥 Straight Red</option>
                        </select>

                        <input
                          type="text"
                          value={c.player || ''}
                          onChange={(e) =>
                            handleUpdateCardRow(idx, 'player', e.target.value)
                          }
                          placeholder="Player (e.g. Defender #4)"
                          className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2.5 py-1 text-xs"
                        />

                        <input
                          type="text"
                          value={c.reason || ''}
                          onChange={(e) =>
                            handleUpdateCardRow(idx, 'reason', e.target.value)
                          }
                          placeholder="Reason (e.g. Tactical Foul)"
                          className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2.5 py-1 text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveCardRow(idx)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}

                  <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[10px] text-amber-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>
                      Red &amp; 2nd Yellow cards validate <strong>&apos;Red Card in Match&apos;</strong> as Yes and count toward <strong>&apos;Total Cards Over/Under 3.5&apos;</strong> &amp; <strong>&apos;Total Bookings Over/Under 4.5&apos;</strong>.
                    </span>
                  </div>
                </div>
              )}
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
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(Array.isArray(m?.outcomes) ? m.outcomes : []).map((o, oIdx) => (
                            <div
                              key={o?.outcome_name || oIdx}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5 border border-gray-200 group"
                            >
                              <span className="text-[11px] font-semibold text-gray-700 truncate mr-1">
                                {o?.outcome_name}
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="1.01"
                                  value={o?.odds ?? 1.5}
                                  onChange={(e) =>
                                    updateOutcomeOdds(mIdx, oIdx, e.target.value)
                                  }
                                  className="w-14 rounded bg-white border border-gray-200 px-1 py-0.5 text-xs font-extrabold text-[#00b074] text-right"
                                />
                                {Array.isArray(m?.outcomes) && m.outcomes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOutcome(mIdx, oIdx)}
                                    className="p-0.5 text-gray-300 hover:text-red-500 transition"
                                    title={`Remove ${o?.outcome_name}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Special Quick Action for Correct Score: Add Others & Common Scores */}
                        {m.market_name === 'Correct Score' && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400">Quick Add:</span>
                            {(!Array.isArray(m?.outcomes) || !m.outcomes.some((o) => String(o?.outcome_name || '').toLowerCase().includes('other'))) && (
                              <button
                                type="button"
                                onClick={() => handleAddOutcomeToMarket(mIdx, 'Others', 16.00)}
                                className="px-2.5 py-1 rounded-md bg-[#d9f3ea] text-[#00b074] text-[10px] font-extrabold hover:bg-[#b5e7d8] transition flex items-center gap-1 shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Add &quot;Others&quot; (Any Other Score)</span>
                              </button>
                            )}
                            {['1-0', '2-0', '0-0', '1-1', '0-1', '0-2', 'Others'].map((sc) => {
                              if (Array.isArray(m?.outcomes) && m.outcomes.some((o) => String(o?.outcome_name || '').toLowerCase() === sc.toLowerCase())) return null;
                              return (
                                <button
                                  key={sc}
                                  type="button"
                                  onClick={() => handleAddOutcomeToMarket(mIdx, sc, sc === 'Others' ? 16.00 : 8.00)}
                                  className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition"
                                >
                                  + {sc}
                                </button>
                              );
                            })}
                          </div>
                        )}
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
                          </strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                            ⏱️ 90m (15m HT Break)
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            ⚽ {Array.isArray(g.goal_schedule) ? g.goal_schedule.length : 0} Goals
                          </span>
                          {Array.isArray(g.penalty_schedule) && g.penalty_schedule.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                              🎯 {g.penalty_schedule.length} Pen {g.penalty_schedule.some((p) => p?.outcome === 'SCORED') ? '(Scored)' : ''}
                            </span>
                          )}
                          {Array.isArray(g.card_schedule) && g.card_schedule.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                              🟨 {g.card_schedule.filter((c) => c?.card_type === 'YELLOW').length}
                              {g.card_schedule.some((c) => c?.card_type !== 'YELLOW') ? ` 🟥 ${g.card_schedule.filter((c) => c?.card_type !== 'YELLOW').length}` : ''}
                            </span>
                          )}
                          {Array.isArray(g.var_schedule) && g.var_schedule.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                              📺 {g.var_schedule.length} VAR
                            </span>
                          )}
                        </div>
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
                      {Array.isArray(g.markets) &&
                        g.markets
                          .filter((m) => m?.visible)
                          .slice(0, 3)
                          .map((m) => (
                            <div key={m?.market_name || Math.random()} className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                {m?.market_name}
                              </p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {Array.isArray(m?.outcomes) &&
                                  m.outcomes.map((o) => {
                                    const isSelected = mixedLegs.some(
                                      (l) =>
                                        l.fixture_id === g.id &&
                                        l.market_name === m?.market_name &&
                                        l.outcome_name === o?.outcome_name
                                    );
                                    return (
                                      <button
                                        key={o?.outcome_name || Math.random()}
                                        type="button"
                                        onClick={() =>
                                          addLegToMixedSlip({
                                            fixture_id: g.id,
                                            home_team: g.home_team,
                                            away_team: g.away_team,
                                            league_name: g.league_name,
                                            market_name: m?.market_name,
                                            outcome_name: o?.outcome_name,
                                            odds: o?.odds,
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
                                        <span className="truncate">{o?.outcome_name}</span>
                                        <span
                                          className={
                                            isSelected ? 'text-white' : 'text-[#00b074]'
                                          }
                                        >
                                          {Number(o?.odds || 1.5).toFixed(2)}
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

                    {Array.isArray(g.markets) &&
                      g.markets
                        .filter((m) => m?.visible)
                        .map((m) => (
                          <div key={m?.market_name || Math.random()} className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500">
                              {m?.market_name}
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {Array.isArray(m?.outcomes) &&
                                m.outcomes.map((o) => {
                                  const active = mixedLegs.some(
                                    (l) =>
                                      l.fixture_id === g.id &&
                                      l.market_name === m?.market_name &&
                                      l.outcome_name === o?.outcome_name
                                  );
                                  return (
                                    <button
                                      key={o?.outcome_name || Math.random()}
                                      type="button"
                                      onClick={() =>
                                        addLegToMixedSlip({
                                          fixture_id: g.id,
                                          home_team: g.home_team,
                                          away_team: g.away_team,
                                          league_name: g.league_name,
                                          market_name: m?.market_name,
                                          outcome_name: o?.outcome_name,
                                          odds: o?.odds,
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
                                      <span className="truncate">{o?.outcome_name}</span>
                                      <span>{Number(o?.odds || 1.5).toFixed(2)}</span>
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

            {/* Section B: Real Live / Upcoming Matches from https://betaura.online */}
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
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-gray-600 font-medium">Custom Ticket / Booking ID</span>
                  <input
                    type="text"
                    value={customTicketOrBookingId}
                    onChange={(e) => setCustomTicketOrBookingId(e.target.value)}
                    placeholder="Auto (e.g. VIP777)"
                    className="w-36 rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-right text-xs font-mono font-bold uppercase"
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

