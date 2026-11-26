/**
 * Ad service — a single, provider-agnostic interface for rewarded and
 * interstitial ads.
 *
 * Out of the box it runs a `SimulatedAdProvider` that shows an in-app mock ad
 * (rendered by `components/SimulatedAdOverlay.tsx`) so every monetisation flow
 * is testable in Expo Go.
 *
 * Going live with AdMob:
 *   1. `npx expo install react-native-google-mobile-ads` and add its config
 *      plugin + your AdMob app IDs to app.json.
 *   2. Fill in AD_UNIT_IDS below.
 *   3. Implement `AdProvider` with RewardedAd / InterstitialAd from that
 *      package (load → wait for LOADED → show → resolve on EARNED_REWARD or
 *      CLOSED) and pass it to `Ads.setProvider()` at app start.
 * Game code only ever calls `Ads.showRewarded()` / `Ads.showInterstitial()`,
 * so no gameplay changes are needed.
 */
import { Platform } from 'react-native';

export type RewardedPlacement = 'reveal_year' | 'time_freeze' | 'revive' | 'retry_daily';
export type InterstitialPlacement = 'arcade_game_over';

export interface RewardedResult {
  rewarded: boolean;
  /** Set when the ad could not be shown at all. */
  error?: string;
}

export interface AdProvider {
  readonly name: string;
  initialize(): Promise<void>;
  showRewarded(placement: RewardedPlacement): Promise<RewardedResult>;
  showInterstitial(placement: InterstitialPlacement): Promise<void>;
}

/** Replace with real AdMob unit IDs. Google's public test IDs are used meanwhile. */
export const AD_UNIT_IDS = {
  rewarded: Platform.select({
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
    default: 'test-rewarded',
  }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
    default: 'test-interstitial',
  }),
} as const;

export const PLACEMENT_COPY: Record<RewardedPlacement, { title: string; reward: string }> = {
  reveal_year: { title: 'Reveal 1 Year', reward: 'One card flips open' },
  time_freeze: { title: '+15s Freeze', reward: 'Clock frozen for 15 seconds' },
  revive: { title: 'Second Chance', reward: '+1 ❤️ and a fresh round' },
  retry_daily: { title: 'Retry Daily', reward: 'Replay today\'s puzzle' },
};

// ---------------------------------------------------------------------------
// Simulated provider
// ---------------------------------------------------------------------------

export interface SimulatedAdRequest {
  kind: 'rewarded' | 'interstitial';
  placement: RewardedPlacement | InterstitialPlacement;
  /** How long the mock ad runs before the reward is granted. */
  durationMs: number;
  /** Call with `true` once watched in full, `false` if dismissed early. */
  complete: (watched: boolean) => void;
}

type SimulatedPresenter = (request: SimulatedAdRequest) => void;

let presenter: SimulatedPresenter | null = null;

export function registerSimulatedAdPresenter(fn: SimulatedPresenter | null): void {
  presenter = fn;
}

export class SimulatedAdProvider implements AdProvider {
  readonly name = 'simulated';

  async initialize(): Promise<void> {
    // Nothing to load.
  }

  showRewarded(placement: RewardedPlacement): Promise<RewardedResult> {
    return new Promise((resolve) => {
      if (!presenter) {
        // Headless fallback (tests / no overlay mounted): grant after a beat.
        setTimeout(() => resolve({ rewarded: true }), 600);
        return;
      }
      presenter({
        kind: 'rewarded',
        placement,
        durationMs: 3000,
        complete: (watched) => resolve({ rewarded: watched }),
      });
    });
  }

  showInterstitial(placement: InterstitialPlacement): Promise<void> {
    return new Promise((resolve) => {
      if (!presenter) {
        resolve();
        return;
      }
      presenter({ kind: 'interstitial', placement, durationMs: 2000, complete: () => resolve() });
    });
  }
}

// ---------------------------------------------------------------------------
// Public facade
// ---------------------------------------------------------------------------

let provider: AdProvider = new SimulatedAdProvider();
let initialized = false;
let showing = false;
let gamesSinceInterstitial = 0;
const showingListeners = new Set<(showing: boolean) => void>();

function setShowing(value: boolean) {
  showing = value;
  showingListeners.forEach((l) => l(value));
}

export const Ads = {
  setProvider(next: AdProvider): void {
    provider = next;
    initialized = false;
  },

  get providerName(): string {
    return provider.name;
  },

  async initialize(): Promise<void> {
    if (initialized) return;
    await provider.initialize();
    initialized = true;
  },

  isShowing(): boolean {
    return showing;
  },

  /** Lets the game pause its clock while any ad is on screen. */
  subscribeShowing(listener: (showing: boolean) => void): () => void {
    showingListeners.add(listener);
    return () => {
      showingListeners.delete(listener);
    };
  },

  /**
   * Shows a rewarded ad. Pro users skip the ad and are granted the reward
   * immediately.
   */
  async showRewarded(placement: RewardedPlacement, isPro: boolean): Promise<RewardedResult> {
    if (isPro) return { rewarded: true };
    if (showing) return { rewarded: false, error: 'busy' };
    setShowing(true);
    try {
      await Ads.initialize();
      return await provider.showRewarded(placement);
    } catch (e) {
      return { rewarded: false, error: e instanceof Error ? e.message : 'unknown' };
    } finally {
      setShowing(false);
    }
  },

  /** Frequency-capped interstitial (every 3rd arcade game over). Never for Pro. */
  async maybeShowInterstitial(placement: InterstitialPlacement, isPro: boolean): Promise<void> {
    if (isPro || showing) return;
    gamesSinceInterstitial += 1;
    if (gamesSinceInterstitial < 3) return;
    gamesSinceInterstitial = 0;
    setShowing(true);
    try {
      await Ads.initialize();
      await provider.showInterstitial(placement);
    } catch {
      // Ignore: never block the player on an ad failure.
    } finally {
      setShowing(false);
    }
  },
};
