# ChronoClash

Drag five historical events into order, from earliest at the top to latest at the bottom. Built with Expo SDK 58, React Native, TypeScript, Reanimated 4 and Gesture Handler 3.

## Run

```bash
npm install
npx expo start          # press a / i, or scan with Expo Go
npx tsc --noEmit        # typecheck
```

## Modes
- **Daily #N**: everyone gets the same 5 cards on the same local calendar date (`utils/dailySeed.ts`). You have 60 seconds, and winning builds your 🔥 streak.
- **Arcade**: you start with 3 ❤️ and 30 seconds per round. A 5/5 round adds points × the multiplier (x2 → x5) and banks +5s for the next round (up to +15s). A round with any card in the wrong place costs 1 ❤️ and resets the multiplier. The game ends at 0 ❤️ or when time runs out.

## Structure
| Path | Purpose |
| --- | --- |
| `app/_layout.tsx`, `app/index.tsx` | Root (gesture/safe-area providers, sound and ad init) and the main screen |
| `components/GameSession.tsx` | Game loop: dealing, timer, reveal sequence, lifelines, arcade scoring |
| `components/TimelineCard.tsx` | Draggable card on the UI thread, with a 3D year flip |
| `components/HeaderBar.tsx`, `ResultModal.tsx`, `ArchiveModal.tsx`, `ConfettiBurst.tsx`, `SimulatedAdOverlay.tsx` | UI |
| `data/puzzles.ts` | 35 curated sets, each with 5 distinct years, plus the Arcade "Shuffle Mix" generator |
| `utils/soundEffects.ts` | WAV synthesis in code, played with `expo-audio` |
| `utils/storage.ts` | AsyncStorage: streaks, results, high score, mute, Pro, in-progress daily |
| `services/ads.ts` | Ad interface that doesn't depend on a provider. It ships with a simulated provider; see the file header to plug in AdMob |

Note: `expo-av` was removed from the Expo SDK, so the sound engine uses `expo-audio`, its official replacement.
