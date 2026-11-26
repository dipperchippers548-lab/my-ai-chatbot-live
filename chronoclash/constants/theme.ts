import type { Category } from '../data/puzzles';

export const COLORS = {
  bg: '#0F172A',
  bgDeep: '#0B1222',
  surface: '#1E293B',
  surfaceHi: '#273449',
  border: '#334155',
  textHi: '#F8FAFC',
  textMid: '#94A3B8',
  textLow: '#64748B',
  card: '#EEF2F7',
  cardEdge: '#CBD5E1',
  cardText: '#0F172A',
  cardClue: '#334155',
  ink: '#0F172A',
  cyan: '#38BDF8',
  amber: '#F59E0B',
  amberSoft: '#FBBF24',
  emerald: '#10B981',
  coral: '#EF4444',
  violet: '#8B5CF6',
  indigo: '#6366F1',
  ice: '#7DD3FC',
} as const;

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  TECH: { bg: '#67E8F9', text: '#083344' },
  GAMING: { bg: '#C4B5FD', text: '#2E1065' },
  MUSIC: { bg: '#F9A8D4', text: '#500724' },
  INTERNET: { bg: '#FCD34D', text: '#451A03' },
  CULTURE: { bg: '#6EE7B7', text: '#022C22' },
};

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chronoclash.app';

export const DAILY_SECONDS = 60;
export const ARCADE_BASE_SECONDS = 30;
export const ARCADE_REFILL_SECONDS = 5;
export const ARCADE_MAX_BONUS_SECONDS = 15;
export const ARCADE_START_HEARTS = 3;
export const ARCADE_MAX_MULTIPLIER = 5;
export const FREEZE_SECONDS = 15;
export const REVEAL_STAGGER_MS = 300;
