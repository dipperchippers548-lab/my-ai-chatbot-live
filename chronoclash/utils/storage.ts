import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, getLocalDateKey, type DateKey } from './dailySeed';

const KEYS = {
  stats: 'chronoclash:stats:v1',
  dailyProgress: 'chronoclash:dailyProgress:v1',
} as const;

export interface DailyResult {
  dateKey: DateKey;
  dailyNumber: number;
  /** Per-slot correctness, top to bottom. */
  grid: boolean[];
  correct: number;
  /** Seconds taken. */
  timeUsed: number;
  won: boolean;
  /** The order the player locked in (event ids). */
  order: string[];
  usedLifeline: boolean;
}

export interface PersistedStats {
  streakCount: number;
  bestStreak: number;
  lastWinKey: DateKey | null;
  lastLossKey: DateKey | null;
  dailyResults: Record<DateKey, DailyResult>;
  arcadeHighScore: number;
  arcadeBestCombo: number;
  arcadeGamesPlayed: number;
  muted: boolean;
  isPro: boolean;
}

export interface DailyProgress {
  dateKey: DateKey;
  order: string[];
  remainingMs: number;
  peekedIds: string[];
  usedReveal: boolean;
  usedFreeze: boolean;
}

export const DEFAULT_STATS: PersistedStats = {
  streakCount: 0,
  bestStreak: 0,
  lastWinKey: null,
  lastLossKey: null,
  dailyResults: {},
  arcadeHighScore: 0,
  arcadeBestCombo: 0,
  arcadeGamesPlayed: 0,
  muted: false,
  isPro: false,
};

export async function loadStats(): Promise<PersistedStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.stats);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw) as Partial<PersistedStats>;
    return { ...DEFAULT_STATS, ...parsed, dailyResults: parsed.dailyResults ?? {} };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export async function saveStats(stats: PersistedStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.stats, JSON.stringify(stats));
  } catch {
    // Storage full / unavailable: gameplay continues with in-memory state.
  }
}

/** The streak to display right now (0 once a day has been missed or lost). */
export function displayedStreak(stats: PersistedStats, today: DateKey = getLocalDateKey()): number {
  if (stats.lastWinKey === today) return stats.streakCount;
  if (stats.lastLossKey === today) return 0;
  if (stats.lastWinKey === addDays(today, -1)) return stats.streakCount;
  return 0;
}

/**
 * Applies a finished daily to the stats. Only today's puzzle affects the
 * streak; archive replays are recorded but streak-neutral.
 */
export function applyDailyResult(
  stats: PersistedStats,
  result: DailyResult,
  today: DateKey = getLocalDateKey(),
): PersistedStats {
  const next: PersistedStats = {
    ...stats,
    dailyResults: { ...stats.dailyResults, [result.dateKey]: result },
  };
  if (result.dateKey !== today) return next;

  if (result.won) {
    if (stats.lastWinKey !== today) {
      const base = stats.lastWinKey === addDays(today, -1) ? stats.streakCount : 0;
      next.streakCount = base + 1;
    }
    next.lastWinKey = today;
    next.lastLossKey = null;
    next.bestStreak = Math.max(stats.bestStreak, next.streakCount);
  } else if (stats.lastWinKey !== today) {
    next.lastLossKey = today;
  }
  return next;
}

export async function loadDailyProgress(dateKey: DateKey): Promise<DailyProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.dailyProgress);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyProgress;
    return parsed.dateKey === dateKey ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveDailyProgress(progress: DailyProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.dailyProgress, JSON.stringify(progress));
  } catch {
    // Non-fatal.
  }
}

export async function clearDailyProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.dailyProgress);
  } catch {
    // Non-fatal.
  }
}
