import { PUZZLES, scramble, type Puzzle, type RandomFn, type TimelineEvent } from '../data/puzzles';

/** Day #1 of ChronoClash. Daily numbers count up from here. */
export const LAUNCH_DATE_KEY = '2026-07-08';

export type DateKey = string; // YYYY-MM-DD

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Local calendar date as `YYYY-MM-DD`. */
export function getLocalDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseKey(key: DateKey): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map((v) => parseInt(v, 10));
  return { y, m, d };
}

/** Whole days since 1970-01-01 for a local date key (timezone/DST-proof). */
function epochDay(key: DateKey): number {
  const { y, m, d } = parseKey(key);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function addDays(key: DateKey, delta: number): DateKey {
  const { y, m, d } = parseKey(key);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function daysBetween(fromKey: DateKey, toKey: DateKey): number {
  return epochDay(toKey) - epochDay(fromKey);
}

/** `DAILY #N` — 1 on launch day. Never below 1. */
export function getDailyNumber(key: DateKey): number {
  return Math.max(1, daysBetween(LAUNCH_DATE_KEY, key) + 1);
}

export function formatDateLabel(key: DateKey): string {
  const { y, m, d } = parseKey(key);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ---------------------------------------------------------------------------
// Deterministic PRNG
// ---------------------------------------------------------------------------

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 — tiny, fast, good-enough seeded PRNG. */
export function mulberry32(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fixed permutation of puzzle indexes for each 35-day cycle, so a puzzle never
 * repeats within a cycle and every player worldwide gets the same one per date.
 */
function cycleOrder(cycle: number): number[] {
  const rand = mulberry32(hashString(`chronoclash-cycle-${cycle}`));
  const idx = PUZZLES.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export interface DailyPuzzle {
  dateKey: DateKey;
  dailyNumber: number;
  puzzle: Puzzle;
  /** Same scrambled order for everyone on this date. */
  scrambled: TimelineEvent[];
}

export function getDailyPuzzle(key: DateKey = getLocalDateKey()): DailyPuzzle {
  const dayIndex = Math.max(0, daysBetween(LAUNCH_DATE_KEY, key));
  const cycle = Math.floor(dayIndex / PUZZLES.length);
  const puzzle = PUZZLES[cycleOrder(cycle)[dayIndex % PUZZLES.length]];
  const scrambled = scramble(puzzle.events, mulberry32(hashString(`chronoclash-daily-${key}`)));
  return { dateKey: key, dailyNumber: getDailyNumber(key), puzzle, scrambled };
}

/** Past dailies (yesterday backwards to launch), newest first. */
export function getArchiveKeys(todayKey: DateKey = getLocalDateKey(), limit = 90): DateKey[] {
  const keys: DateKey[] = [];
  const available = daysBetween(LAUNCH_DATE_KEY, todayKey);
  for (let i = 1; i <= Math.min(available, limit); i++) keys.push(addDays(todayKey, -i));
  return keys;
}

/** Milliseconds until local midnight (next daily). */
export function msUntilNextDaily(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}
