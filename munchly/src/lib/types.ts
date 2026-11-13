export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Units = 'metric' | 'imperial';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  goal: Goal;
  sex: Sex;
  age: number;
  /** Always stored in metric; converted for display. */
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  units: Units;
  targets: Targets;
}

export interface Targets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** One food the AI found in a photo or description. */
export interface FoodItem extends Macros {
  name: string;
  portion: string;
}

/** What /api/analyze returns. */
export interface Analysis {
  isFood: boolean;
  mealName: string;
  items: FoodItem[];
  confidence: 'low' | 'medium' | 'high';
  note: string;
  /** True when the server had no API key and returned sample data. */
  demo?: boolean;
}

export interface LogEntry extends Macros {
  id: string;
  /** Local date key, e.g. 2026-11-13 */
  day: string;
  createdAt: number;
  mealType: MealType;
  name: string;
  source: 'photo' | 'text' | 'manual';
  items?: FoodItem[];
}
