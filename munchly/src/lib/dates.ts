import type { MealType } from './types';

/** Local-time day key like "2026-11-13". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The last `count` day keys, oldest first, ending today. */
export function lastDays(count: number, today: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => dayKey(addDays(today, i - (count - 1))));
}

/**
 * Days in a row with at least one logged meal. Today counts if logged;
 * if today is still empty the streak runs through yesterday so it doesn't reset at breakfast.
 */
export function currentStreak(loggedDays: Set<string>, today: Date = new Date()): number {
  let cursor = loggedDays.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (loggedDays.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function mealTypeForNow(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack';
}

export function friendlyDay(key: string, today: Date = new Date()): string {
  if (key === dayKey(today)) return 'Today';
  if (key === dayKey(addDays(today, -1))) return 'Yesterday';
  return parseDayKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export const MEAL_TYPES: { id: MealType; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lunch', label: 'Lunch', emoji: '🥗' },
  { id: 'dinner', label: 'Dinner', emoji: '🍝' },
  { id: 'snack', label: 'Snack', emoji: '🍪' },
];
