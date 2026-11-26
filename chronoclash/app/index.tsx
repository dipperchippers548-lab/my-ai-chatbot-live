import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArchiveModal } from '../components/ArchiveModal';
import { GameSession } from '../components/GameSession';
import type { GameMode } from '../components/HeaderBar';
import { COLORS } from '../constants/theme';
import { getLocalDateKey, type DateKey } from '../utils/dailySeed';
import { Sound } from '../utils/soundEffects';
import {
  applyDailyResult,
  displayedStreak,
  loadStats,
  saveStats,
  type DailyResult,
  type PersistedStats,
} from '../utils/storage';

interface DailyTarget {
  key: DateKey;
  isArchive: boolean;
}

export default function GameScreen() {
  const [stats, setStats] = useState<PersistedStats | null>(null);
  const statsRef = useRef<PersistedStats | null>(null);
  const [mode, setMode] = useState<GameMode>('daily');
  const [todayKey, setTodayKey] = useState<DateKey>(getLocalDateKey());
  const todayRef = useRef(todayKey);
  const [dailyTarget, setDailyTarget] = useState<DailyTarget>({ key: getLocalDateKey(), isArchive: false });
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [archiveOpen, setArchiveOpen] = useState(false);

  const commit = useCallback((next: PersistedStats) => {
    statsRef.current = next;
    setStats(next);
    saveStats(next);
  }, []);

  // Load persisted state; open straight into gameplay.
  useEffect(() => {
    loadStats().then((loaded) => {
      statsRef.current = loaded;
      Sound.setMuted(loaded.muted);
      const today = getLocalDateKey();
      // Already solved today's daily? Drop the player straight into Arcade.
      if (loaded.dailyResults[today]) setMode('arcade');
      setStats(loaded);
    });
  }, []);

  // Pause on background; roll over to the new daily after midnight.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const isActive = state === 'active';
      setAppActive(isActive);
      if (isActive) {
        const now = getLocalDateKey();
        if (todayRef.current !== now) {
          todayRef.current = now;
          setTodayKey(now);
          setDailyTarget((t) => (t.isArchive ? t : { key: now, isArchive: false }));
        }
      }
    });
    return () => sub.remove();
  }, []);

  const onToggleMute = useCallback(() => {
    const current = statsRef.current;
    if (!current) return;
    const muted = !current.muted;
    Sound.setMuted(muted);
    if (!muted) Sound.play('grab');
    commit({ ...current, muted });
  }, [commit]);

  const onDailyFinished = useCallback(
    (result: DailyResult) => {
      const current = statsRef.current;
      if (!current) return;
      commit(applyDailyResult(current, result, getLocalDateKey()));
    },
    [commit],
  );

  const onArcadeFinished = useCallback(
    (score: number, bestCombo: number) => {
      const current = statsRef.current;
      if (!current) return;
      commit({
        ...current,
        arcadeHighScore: Math.max(current.arcadeHighScore, score),
        arcadeBestCombo: Math.max(current.arcadeBestCombo, bestCombo),
        arcadeGamesPlayed: current.arcadeGamesPlayed + 1,
      });
    },
    [commit],
  );

  const onUnlockPro = useCallback(() => {
    const unlock = () => {
      const current = statsRef.current;
      if (!current) return;
      commit({ ...current, isPro: true });
      Sound.play('fanfare');
    };
    // Alert dialogs are a no-op on web, so the simulated purchase unlocks directly there.
    if (Platform.OS === 'web') {
      unlock();
      return;
    }
    Alert.alert(
      'ChronoClash Pro',
      'Unlock the full daily archive, remove ads and get free lifelines.\n\n(Simulated purchase — wire up your IAP provider for production.)',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Unlock Pro',
          onPress: unlock,
        },
      ],
    );
  }, [commit]);

  const onSelectArchive = useCallback((key: DateKey) => {
    setArchiveOpen(false);
    setDailyTarget({ key, isArchive: true });
    setMode('daily');
  }, []);

  const onBackToToday = useCallback(() => {
    setDailyTarget({ key: getLocalDateKey(), isArchive: false });
    setMode('daily');
  }, []);

  const onOpenArchive = useCallback(() => setArchiveOpen(true), []);

  if (!stats) {
    return (
      <View style={styles.splash}>
        <Text style={styles.logo}>CHRONO</Text>
        <Text style={[styles.logo, styles.logoAccent]}>CLASH</Text>
        <ActivityIndicator color={COLORS.cyan} style={styles.spinner} />
      </View>
    );
  }

  const streak = displayedStreak(stats, todayKey);
  const shared = {
    appActive: appActive && !archiveOpen,
    streak,
    arcadeHighScore: stats.arcadeHighScore,
    isPro: stats.isPro,
    muted: stats.muted,
    onToggleMute,
    onSwitchMode: setMode,
    onOpenArchive,
    onBackToToday,
    onDailyFinished,
    onArcadeFinished,
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      {/* Both sessions stay mounted so switching modes pauses/resumes instantly. */}
      <View style={styles.stage}>
      <View style={[styles.layer, mode !== 'daily' && styles.hidden]} pointerEvents={mode === 'daily' ? 'auto' : 'none'}>
        <GameSession
          key={`daily-${dailyTarget.key}`}
          mode="daily"
          active={mode === 'daily'}
          dailyKey={dailyTarget.key}
          isArchive={dailyTarget.isArchive}
          existingResult={stats.dailyResults[dailyTarget.key]}
          {...shared}
        />
      </View>
      <View style={[styles.layer, mode !== 'arcade' && styles.hidden]} pointerEvents={mode === 'arcade' ? 'auto' : 'none'}>
        <GameSession
          key="arcade"
          mode="arcade"
          active={mode === 'arcade'}
          dailyKey={todayKey}
          isArchive={false}
          existingResult={undefined}
          {...shared}
        />
      </View>
      </View>

      <ArchiveModal
        visible={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        isPro={stats.isPro}
        onUnlockPro={onUnlockPro}
        todayKey={todayKey}
        results={stats.dailyResults}
        onSelect={onSelectArchive}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  stage: { flex: 1 },
  layer: { ...StyleSheet.absoluteFill },
  hidden: { opacity: 0, zIndex: -1 },
  splash: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  logo: { color: COLORS.textHi, fontSize: 44, fontWeight: '900', letterSpacing: 6 },
  logoAccent: { color: COLORS.cyan, marginTop: -6 },
  spinner: { marginTop: 24 },
});
