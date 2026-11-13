import type { ActivityLevel, Goal, Macros, Profile, Sex, Targets } from './types';

export const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; detail: string; factor: number }[] = [
  { id: 'sedentary', label: 'Mostly sitting', detail: 'Desk job, little exercise', factor: 1.2 },
  { id: 'light', label: 'Lightly active', detail: 'Walks, workouts 1–3×/week', factor: 1.375 },
  { id: 'moderate', label: 'Active', detail: 'Workouts 3–5×/week', factor: 1.55 },
  { id: 'active', label: 'Very active', detail: 'Hard training 6–7×/week', factor: 1.725 },
  { id: 'athlete', label: 'Athlete', detail: 'Twice a day or physical job', factor: 1.9 },
];

export const GOALS: { id: Goal; label: string; emoji: string; detail: string }[] = [
  { id: 'lose', label: 'Lose weight', emoji: '🔥', detail: 'Eat a little under what you burn' },
  { id: 'maintain', label: 'Stay the same', emoji: '⚖️', detail: 'Keep your weight steady' },
  { id: 'gain', label: 'Build muscle', emoji: '💪', detail: 'Eat a little over what you burn' },
];

export const MIN_AGE = 13;
export const ADULT_AGE = 18;

/** Mifflin–St Jeor resting energy, kcal/day. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTargets(input: {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
}): Targets {
  const factor = ACTIVITY_LEVELS.find((a) => a.id === input.activity)?.factor ?? 1.2;
  const maintenance = bmr(input.sex, input.weightKg, input.heightCm, input.age) * factor;
  const isMinor = input.age < ADULT_AGE;

  let calories = maintenance;
  if (input.goal === 'lose') calories -= isMinor ? 250 : 500;
  if (input.goal === 'gain') calories += 300;

  // Never suggest very low intakes. Teens get a higher floor because they are still growing.
  const floor = isMinor ? 1600 : input.sex === 'male' ? 1500 : 1200;
  calories = Math.max(floor, calories);
  calories = Math.round(calories / 10) * 10;

  const proteinPerKg = input.goal === 'maintain' ? 1.6 : 1.8;
  const proteinG = Math.round(Math.min(input.weightKg * proteinPerKg, (calories * 0.35) / 4));
  const fatG = Math.round((calories * 0.27) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return { calories, proteinG, carbsG, fatG };
}

export function withTargets(p: Omit<Profile, 'targets'>): Profile {
  return { ...p, targets: calculateTargets(p) };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce<Macros>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function scaleMacros<T extends Macros>(m: T, factor: number): T {
  return {
    ...m,
    calories: Math.round(m.calories * factor),
    proteinG: round1(m.proteinG * factor),
    carbsG: round1(m.carbsG * factor),
    fatG: round1(m.fatG * factor),
  };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---- Unit helpers ----
export const cmToFeetInches = (cm: number) => {
  const totalIn = cm / 2.54;
  let feet = Math.floor(totalIn / 12);
  let inches = Math.round(totalIn - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
};
export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;

export function formatWeight(kg: number, units: Profile['units']): string {
  return units === 'imperial' ? `${Math.round(kgToLb(kg))} lb` : `${Math.round(kg)} kg`;
}

export function formatHeight(cm: number, units: Profile['units']): string {
  if (units === 'metric') return `${Math.round(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}′${inches}″`;
}
