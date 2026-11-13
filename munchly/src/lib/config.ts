/** How many AI scans (photo or description) a free user gets before the paywall. */
export const FREE_SCANS = 3;

/**
 * Where the /api/analyze route lives.
 * - Web and local development: leave EXPO_PUBLIC_API_URL unset; requests go to the same server.
 * - Android builds: set EXPO_PUBLIC_API_URL to your deployed URL, e.g. https://munchly.expo.app
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Preview builds (EXPO_PUBLIC_PREVIEW_MODE=1) run with no server and return sample scan results. */
export const PREVIEW_MODE = process.env.EXPO_PUBLIC_PREVIEW_MODE === '1';

/** Placeholder prices shown on the paywall until Google Play billing is connected. */
export const PLANS = [
  { id: 'yearly', label: 'Yearly', price: '$29.99', per: '/year', note: 'Just $0.58/week · 3-day free trial', best: true },
  { id: 'weekly', label: 'Weekly', price: '$4.99', per: '/week', note: 'Cancel anytime', best: false },
] as const;
