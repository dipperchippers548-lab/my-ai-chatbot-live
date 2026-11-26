import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Play, RotateCcw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  ARCADE_BASE_SECONDS,
  ARCADE_MAX_BONUS_SECONDS,
  ARCADE_MAX_MULTIPLIER,
  ARCADE_REFILL_SECONDS,
  ARCADE_START_HEARTS,
  COLORS,
  DAILY_SECONDS,
  FREEZE_SECONDS,
  PLAY_STORE_URL,
  REVEAL_STAGGER_MS,
} from '../constants/theme';
import { generateArcadeRound, scramble, type TimelineEvent } from '../data/puzzles';
import { useCountdown } from '../hooks/useCountdown';
import { Ads } from '../services/ads';
import { getDailyPuzzle, hashString, mulberry32, type DateKey } from '../utils/dailySeed';
import { Sound } from '../utils/soundEffects';
import {
  clearDailyProgress,
  loadDailyProgress,
  saveDailyProgress,
  type DailyResult,
} from '../utils/storage';
import { ConfettiBurst } from './ConfettiBurst';
import { formatClock, HeaderBar, type GameMode, type TimerVisual } from './HeaderBar';
import { gridToEmoji, ResultModal, type ResultAction, type ResultStat } from './ResultModal';
import { CARD_GAP, TimelineCard, type CardStatus, type Positions } from './TimelineCard';

type Phase = 'loading' | 'playing' | 'revealing' | 'between' | 'finished';

interface Props {
  mode: GameMode;
  active: boolean;
  appActive: boolean;
  /** Daily only: which date's puzzle to play. */
  dailyKey: DateKey;
  isArchive: boolean;
  existingResult: DailyResult | undefined;
  streak: number;
  arcadeHighScore: number;
  isPro: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onSwitchMode: (mode: GameMode) => void;
  onOpenArchive: () => void;
  onBackToToday: () => void;
  onDailyFinished: (result: DailyResult) => void;
  onArcadeFinished: (score: number, bestCombo: number) => void;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const toPositions = (ids: string[]): Positions => {
  const p: Positions = {};
  ids.forEach((id, i) => {
    p[id] = i;
  });
  return p;
};

const orderFromPositions = (p: Positions): string[] =>
  Object.keys(p).sort((a, b) => p[a] - p[b]);

const haptic = (fn: () => Promise<void>) => {
  fn().catch(() => undefined);
};

export function GameSession(props: Props) {
  const {
    mode,
    active,
    appActive,
    dailyKey,
    isArchive,
    existingResult,
    streak,
    arcadeHighScore,
    isPro,
    muted,
    onToggleMute,
    onSwitchMode,
    onOpenArchive,
    onBackToToday,
    onDailyFinished,
    onArcadeFinished,
  } = props;

  const isDaily = mode === 'daily';
  const daily = useMemo(() => getDailyPuzzle(dailyKey), [dailyKey]);

  // ---- board state --------------------------------------------------------
  const [cards, setCards] = useState<TimelineEvent[]>([]);
  const [roundKey, setRoundKey] = useState(0);
  const [cardState, setCardState] = useState<Record<string, CardStatus>>({});
  const positions = useSharedValue<Positions>({});
  const [phase, setPhaseState] = useState<Phase>('loading');
  const phaseRef = useRef<Phase>('loading');
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const byId = useMemo(() => {
    const m: Record<string, TimelineEvent> = {};
    cards.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [cards]);

  // ---- lifelines / pause sources -----------------------------------------
  const [usedReveal, setUsedReveal] = useState(false);
  const [usedFreeze, setUsedFreeze] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const freezeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adShowing, setAdShowing] = useState(Ads.isShowing());

  // ---- arcade -------------------------------------------------------------
  const [hearts, setHearts] = useState(ARCADE_START_HEARTS);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [round, setRound] = useState(0);
  const [bonusSeconds, setBonusSeconds] = useState(0);
  const [bestCombo, setBestCombo] = useState(1);
  const [arcadeGrid, setArcadeGrid] = useState<boolean[][]>([]);
  const [totals, setTotals] = useState({ correct: 0, cards: 0 });
  const [revived, setRevived] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [highAtStart, setHighAtStart] = useState(arcadeHighScore);
  const recentIds = useRef<string[]>([]);
  const [toast, setToast] = useState<{ key: number; text: string; good: boolean } | null>(null);

  // ---- daily --------------------------------------------------------------
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(existingResult ?? null);
  const [retried, setRetried] = useState(false);

  // ---- fx -----------------------------------------------------------------
  const [confetti, setConfetti] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const shakeX = useSharedValue(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (freezeTimer.current) clearTimeout(freezeTimer.current);
    };
  }, []);

  useEffect(() => Ads.subscribeShowing(setAdShowing), []);

  const shake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-11, { duration: 45 }),
      withTiming(11, { duration: 45 }),
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(-4, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
  }, [shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  // ---- timer --------------------------------------------------------------
  const lockInRef = useRef<(timedOut: boolean) => void>(() => undefined);
  const onExpire = useCallback(() => lockInRef.current(true), []);
  const {
    seconds: timerSeconds,
    getRemainingMs,
    reset: resetTimer,
    setRunning: setTimerRunning,
  } = useCountdown((isDaily ? DAILY_SECONDS : ARCADE_BASE_SECONDS) * 1000, onExpire);

  const shouldRun = active && appActive && !adShowing && !frozen && !modalVisible && phase === 'playing';
  useEffect(() => {
    setTimerRunning(shouldRun);
  }, [shouldRun, setTimerRunning]);

  const lastTick = useRef(-1);
  useEffect(() => {
    if (shouldRun && timerSeconds <= 5 && timerSeconds > 0 && lastTick.current !== timerSeconds) {
      lastTick.current = timerSeconds;
      Sound.play('tick');
    }
  }, [timerSeconds, shouldRun]);

  const clearFreeze = useCallback(() => {
    if (freezeTimer.current) clearTimeout(freezeTimer.current);
    freezeTimer.current = null;
    setFrozen(false);
  }, []);

  // ---- dealing ------------------------------------------------------------
  const deal = useCallback(
    (events: TimelineEvent[], seconds: number, restoredOrder?: string[]) => {
      const ids = restoredOrder ?? events.map((e) => e.id);
      positions.value = toPositions(ids);
      setCards(events);
      setRoundKey((k) => k + 1);
      setCardState({});
      clearFreeze();
      resetTimer(seconds * 1000);
      lastTick.current = -1;
      setPhase('playing');
    },
    [positions, resetTimer, clearFreeze, setPhase],
  );

  const dealArcade = useCallback(
    (nextRound: number, seconds: number) => {
      const recent = new Set(recentIds.current);
      const events = generateArcadeRound(nextRound, recent);
      recentIds.current = [...recentIds.current, ...events.map((e) => e.id)].slice(-60);
      setRound(nextRound);
      setUsedReveal(false);
      setUsedFreeze(false);
      deal(events, seconds);
    },
    [deal],
  );

  const startArcade = useCallback(() => {
    setHearts(ARCADE_START_HEARTS);
    setScore(0);
    setMultiplier(1);
    setBonusSeconds(0);
    setBestCombo(1);
    setArcadeGrid([]);
    setTotals({ correct: 0, cards: 0 });
    setRevived(false);
    setTimedOut(false);
    setHighAtStart(arcadeHighScore);
    setModalVisible(false);
    dealArcade(1, ARCADE_BASE_SECONDS);
  }, [arcadeHighScore, dealArcade]);

  const showFinishedDaily = useCallback(
    (result: DailyResult) => {
      const ordered = result.order.map((id) => daily.puzzle.events.find((e) => e.id === id)).filter(
        (e): e is TimelineEvent => e !== undefined,
      );
      const events = ordered.length === 5 ? ordered : daily.scrambled;
      positions.value = toPositions(events.map((e) => e.id));
      setCards(events);
      setRoundKey((k) => k + 1);
      const states: Record<string, CardStatus> = {};
      events.forEach((e, i) => {
        states[e.id] = result.grid[i] ? 'correct' : 'wrong';
      });
      setCardState(states);
      resetTimer(Math.max(0, DAILY_SECONDS - result.timeUsed) * 1000);
      setPhase('finished');
    },
    [daily, positions, resetTimer, setPhase],
  );

  // Initial setup (once per mount; daily sessions are keyed by date).
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current) return;
    if (!isDaily) {
      if (!active) return; // Arcade deals when first opened.
      initialised.current = true;
      startArcade();
      return;
    }
    initialised.current = true;
    if (existingResult) {
      showFinishedDaily(existingResult);
      return;
    }
    (async () => {
      const progress = isArchive ? null : await loadDailyProgress(dailyKey);
      if (!mounted.current) return;
      const validIds = new Set(daily.puzzle.events.map((e) => e.id));
      if (progress && progress.order.length === 5 && progress.order.every((id) => validIds.has(id))) {
        deal(daily.scrambled, Math.max(1, Math.round(progress.remainingMs / 1000)), progress.order);
        resetTimer(Math.max(1000, progress.remainingMs));
        setUsedReveal(progress.usedReveal);
        setUsedFreeze(progress.usedFreeze);
        const peeks: Record<string, CardStatus> = {};
        progress.peekedIds.forEach((id) => {
          if (validIds.has(id)) peeks[id] = 'peek';
        });
        setCardState(peeks);
      } else {
        deal(daily.scrambled, DAILY_SECONDS);
      }
    })();
  }, [isDaily, active, existingResult, isArchive, dailyKey, daily, deal, resetTimer, startArcade, showFinishedDaily]);

  // ---- daily progress persistence ----------------------------------------
  const persistProgress = useCallback(() => {
    if (!isDaily || isArchive || phaseRef.current !== 'playing') return;
    saveDailyProgress({
      dateKey: dailyKey,
      order: orderFromPositions(positions.value),
      remainingMs: getRemainingMs(),
      peekedIds: Object.keys(cardState).filter((id) => cardState[id] === 'peek'),
      usedReveal,
      usedFreeze,
    });
  }, [isDaily, isArchive, dailyKey, positions, getRemainingMs, cardState, usedReveal, usedFreeze]);

  useEffect(() => {
    if (!shouldRun) persistProgress();
  }, [shouldRun, persistProgress]);

  useEffect(() => {
    if (!shouldRun || !isDaily) return undefined;
    const id = setInterval(persistProgress, 5000);
    return () => clearInterval(id);
  }, [shouldRun, isDaily, persistProgress]);

  // ---- drag callbacks -----------------------------------------------------
  const onGrab = useCallback(() => {
    Sound.play('grab');
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, []);
  const onSwap = useCallback(() => {
    Sound.play('swap');
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, []);
  const onDrop = useCallback(() => {
    Sound.play('drop');
    persistProgress();
  }, [persistProgress]);

  // ---- game over / results -----------------------------------------------
  const finishArcade = useCallback(
    async (finalScore: number, combo: number) => {
      setPhase('finished');
      Sound.play('gameover');
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
      onArcadeFinished(finalScore, combo);
      await wait(900);
      if (mounted.current) setModalVisible(true);
    },
    [onArcadeFinished, setPhase],
  );

  // ---- lock in & reveal sequence -----------------------------------------
  const lockIn = useCallback(
    async (fromTimeout: boolean) => {
      if (phaseRef.current !== 'playing') return;
      setPhase('revealing');
      clearFreeze();
      setTimerRunning(false);
      const secondsLeft = Math.ceil(getRemainingMs() / 1000);

      const order = orderFromPositions(positions.value);
      const sortedYears = order.map((id) => byId[id].year).sort((a, b) => a - b);
      const grid = order.map((id, i) => byId[id].year === sortedYears[i]);
      const correct = grid.filter(Boolean).length;
      const perfect = correct === order.length;

      let run = 0;
      for (let i = 0; i < order.length; i++) {
        await wait(i === 0 ? 180 : REVEAL_STAGGER_MS);
        if (!mounted.current) return;
        const id = order[i];
        const ok = grid[i];
        setCardState((prev) => ({ ...prev, [id]: ok ? 'correct' : 'wrong' }));
        Sound.play('flip');
        if (ok) {
          Sound.playChime(run);
          run += 1;
          haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
        } else {
          run = 0;
          Sound.play('buzzer');
          shake();
          haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
        }
      }
      await wait(450);
      if (!mounted.current) return;

      if (perfect) {
        Sound.play('fanfare');
        setConfetti((c) => c + 1);
        haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      }

      if (isDaily) {
        const result: DailyResult = {
          dateKey: dailyKey,
          dailyNumber: daily.dailyNumber,
          grid,
          correct,
          timeUsed: Math.max(0, DAILY_SECONDS - secondsLeft),
          won: perfect,
          order,
          usedLifeline: usedReveal || usedFreeze || retried,
        };
        setDailyResult(result);
        setPhase('finished');
        if (!isArchive) clearDailyProgress();
        onDailyFinished(result);
        await wait(perfect ? 1100 : 700);
        if (mounted.current) setModalVisible(true);
        return;
      }

      // ---- arcade round resolution ----
      setArcadeGrid((g) => [...g, grid]);
      setTotals((t) => ({ correct: t.correct + correct, cards: t.cards + order.length }));

      if (fromTimeout) {
        setTimedOut(true);
        await finishArcade(score, bestCombo);
        return;
      }

      if (perfect) {
        const gained = 100 * multiplier + secondsLeft * 5 * multiplier;
        const nextScore = score + gained;
        const nextBonus = Math.min(ARCADE_MAX_BONUS_SECONDS, bonusSeconds + ARCADE_REFILL_SECONDS);
        setScore(nextScore);
        setBestCombo((b) => Math.max(b, multiplier));
        setMultiplier((m) => Math.min(ARCADE_MAX_MULTIPLIER, m + 1));
        setBonusSeconds(nextBonus);
        setToast({ key: Date.now(), text: `+${gained} PERFECT! +${ARCADE_REFILL_SECONDS}s`, good: true });
        setPhase('between');
        await wait(1300);
        if (mounted.current) dealArcade(round + 1, ARCADE_BASE_SECONDS + nextBonus);
        return;
      }

      const gained = correct * 10;
      const nextScore = score + gained;
      const nextHearts = hearts - 1;
      setScore(nextScore);
      setHearts(nextHearts);
      setMultiplier(1);
      setBonusSeconds(0);
      setToast({ key: Date.now(), text: `-1 ❤️  ${correct}/5  +${gained}`, good: false });
      if (nextHearts <= 0) {
        await finishArcade(nextScore, bestCombo);
        return;
      }
      setPhase('between');
      await wait(1500);
      if (mounted.current) dealArcade(round + 1, ARCADE_BASE_SECONDS);
    },
    [
      setPhase,
      clearFreeze,
      setTimerRunning,
      getRemainingMs,
      positions,
      byId,
      shake,
      isDaily,
      dailyKey,
      daily,
      usedReveal,
      usedFreeze,
      retried,
      isArchive,
      onDailyFinished,
      finishArcade,
      score,
      bestCombo,
      multiplier,
      bonusSeconds,
      dealArcade,
      round,
      hearts,
    ],
  );

  useEffect(() => {
    lockInRef.current = (t) => {
      lockIn(t);
    };
  }, [lockIn]);

  // ---- lifelines ----------------------------------------------------------
  const onReveal = useCallback(async () => {
    if (phaseRef.current !== 'playing' || usedReveal) return;
    const res = await Ads.showRewarded('reveal_year', isPro);
    if (!res.rewarded || !mounted.current || phaseRef.current !== 'playing') return;
    const order = orderFromPositions(positions.value);
    const sortedYears = order.map((id) => byId[id].year).sort((a, b) => a - b);
    const hidden = order.filter((id) => !cardState[id]);
    // Prefer revealing a card that's currently misplaced — the most useful hint.
    const misplaced = hidden.filter((id) => byId[id].year !== sortedYears[order.indexOf(id)]);
    const pool = misplaced.length > 0 ? misplaced : hidden;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setUsedReveal(true);
    setCardState((prev) => ({ ...prev, [pick]: 'peek' }));
    Sound.play('powerup');
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }, [usedReveal, isPro, positions, byId, cardState]);

  const onFreeze = useCallback(async () => {
    if (phaseRef.current !== 'playing' || usedFreeze) return;
    const res = await Ads.showRewarded('time_freeze', isPro);
    if (!res.rewarded || !mounted.current || phaseRef.current !== 'playing') return;
    setUsedFreeze(true);
    setFrozen(true);
    Sound.play('powerup');
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    if (freezeTimer.current) clearTimeout(freezeTimer.current);
    freezeTimer.current = setTimeout(() => {
      freezeTimer.current = null;
      if (mounted.current) setFrozen(false);
    }, FREEZE_SECONDS * 1000);
  }, [usedFreeze, isPro]);

  // ---- revive / retry -----------------------------------------------------
  const onReviveArcade = useCallback(async () => {
    const res = await Ads.showRewarded('revive', isPro);
    if (!res.rewarded || !mounted.current) return;
    setRevived(true);
    setTimedOut(false);
    setHearts((h) => Math.max(1, h + (h <= 0 ? 1 : 0)));
    setModalVisible(false);
    Sound.play('powerup');
    dealArcade(round + 1, ARCADE_BASE_SECONDS);
  }, [isPro, dealArcade, round]);

  const onRetryDaily = useCallback(async () => {
    const res = await Ads.showRewarded('retry_daily', isPro);
    if (!res.rewarded || !mounted.current) return;
    setRetried(true);
    setModalVisible(false);
    setUsedReveal(false);
    setUsedFreeze(false);
    setDailyResult(null);
    const reshuffled = scramble(daily.puzzle.events, mulberry32(hashString(`${dailyKey}-retry-${Date.now()}`)));
    Sound.play('powerup');
    deal(reshuffled, DAILY_SECONDS);
  }, [isPro, daily, dailyKey, deal]);

  const onPlayAgain = useCallback(async () => {
    setModalVisible(false);
    await Ads.maybeShowInterstitial('arcade_game_over', isPro);
    if (mounted.current) startArcade();
  }, [isPro, startArcade]);

  // ---- layout -------------------------------------------------------------
  const [boardHeight, setBoardHeight] = useState(0);
  const onBoardLayout = (e: LayoutChangeEvent) => setBoardHeight(e.nativeEvent.layout.height);
  const slotHeight = boardHeight > 0 ? Math.max(72, Math.min(124, Math.floor(boardHeight / 5))) : 0;

  // ---- header -------------------------------------------------------------
  const timerVisual: TimerVisual =
    phase === 'finished' || phase === 'revealing' || phase === 'between'
      ? 'done'
      : frozen
        ? 'frozen'
        : shouldRun
          ? 'running'
          : 'paused';

  const dailyLabel = isArchive ? `ARCHIVE #${daily.dailyNumber}` : `DAILY #${daily.dailyNumber}`;
  const canUseLifelines = phase === 'playing' && !adShowing;

  const handleSwitch = useCallback(
    (m: GameMode) => {
      if (m === 'daily' && isDaily && isArchive && phaseRef.current !== 'playing') onBackToToday();
      else onSwitchMode(m);
    },
    [isDaily, isArchive, onBackToToday, onSwitchMode],
  );

  const lifelines = useMemo(
    () => ({
      revealAvailable: !usedReveal,
      freezeAvailable: !usedFreeze,
      disabled: !canUseLifelines,
      isPro,
      onReveal,
      onFreeze,
    }),
    [usedReveal, usedFreeze, canUseLifelines, isPro, onReveal, onFreeze],
  );

  // ---- result modal content ----------------------------------------------
  const resultContent = useMemo(() => {
    if (isDaily) {
      const r = dailyResult;
      const grid = r ? [r.grid] : [];
      const correct = r?.correct ?? 0;
      const won = r?.won ?? false;
      const time = formatClock(r?.timeUsed ?? 0);
      const label = isArchive ? `Archive #${daily.dailyNumber}` : `Daily #${daily.dailyNumber}`;
      const stats: ResultStat[] = [
        { label: 'ACCURACY', value: `${correct}/5` },
        { label: 'TIME', value: time },
        { label: 'STREAK', value: `🔥 ${streak}` },
        { label: 'THEME', value: daily.puzzle.theme },
      ];
      const shareText = [
        `⏳ ChronoClash ${label}${retried ? ' (retry)' : ''}`,
        `${gridToEmoji(r?.grid ?? [])} ${correct}/5`,
        `⏱ ${time}${isArchive ? '' : ` · 🔥 ${streak}`}`,
        'Can you put history in order?',
        PLAY_STORE_URL,
      ].join('\n');
      const revive: ResultAction | null =
        !won && !isArchive
          ? { label: isPro ? 'Retry Daily (Pro)' : 'Watch Ad to Retry Daily', onPress: onRetryDaily }
          : null;
      return {
        modeLabel: label,
        headline: won ? 'PERFECT TIMELINE!' : correct >= 3 ? 'SO CLOSE!' : 'TIME WARP!',
        won,
        stats,
        grid,
        shareText,
        revive,
        primary: {
          label: isArchive ? 'BACK TO TODAY' : 'PLAY ARCADE ▶',
          onPress: () => {
            setModalVisible(false);
            if (isArchive) onBackToToday();
            else onSwitchMode('arcade');
          },
        },
        showNextDaily: !isArchive,
      };
    }
    const isNewHigh = score > highAtStart && score > 0;
    const accuracy = totals.cards > 0 ? `${totals.correct}/${totals.cards}` : '0/0';
    const stats: ResultStat[] = [
      { label: 'SCORE', value: score.toLocaleString() },
      { label: 'HIGH SCORE', value: Math.max(score, arcadeHighScore).toLocaleString() },
      { label: 'BEST COMBO', value: `x${bestCombo}` },
      { label: 'ACCURACY', value: accuracy },
    ];
    const shareText = [
      `⏳ ChronoClash Arcade — ${score.toLocaleString()} pts${isNewHigh ? ' 🏆 NEW HIGH SCORE' : ''}`,
      `Best combo x${bestCombo} · ${arcadeGrid.length} rounds · ${accuracy}`,
      ...arcadeGrid.slice(-5).map(gridToEmoji),
      'Beat my score:',
      PLAY_STORE_URL,
    ].join('\n');
    const revive: ResultAction | null = !revived
      ? { label: isPro ? 'Revive (+1 ❤️) — Pro' : 'Watch Ad to Revive (+1 ❤️)', onPress: onReviveArcade }
      : null;
    return {
      modeLabel: isNewHigh ? 'Arcade · New High Score' : 'Arcade',
      headline: isNewHigh ? 'NEW HIGH SCORE!' : timedOut ? 'OUT OF TIME!' : 'GAME OVER',
      won: isNewHigh,
      stats,
      grid: arcadeGrid,
      shareText,
      revive,
      primary: { label: 'PLAY AGAIN', onPress: onPlayAgain },
      showNextDaily: false,
    };
  }, [
    isDaily,
    dailyResult,
    isArchive,
    daily,
    streak,
    retried,
    isPro,
    onRetryDaily,
    onBackToToday,
    onSwitchMode,
    score,
    highAtStart,
    totals,
    arcadeHighScore,
    bestCombo,
    arcadeGrid,
    revived,
    onReviveArcade,
    timedOut,
    onPlayAgain,
  ]);

  // ---- render -------------------------------------------------------------
  const finished = phase === 'finished';

  return (
    <Animated.View style={[styles.root, shakeStyle]}>
      <HeaderBar
        mode={mode}
        onSwitchMode={handleSwitch}
        dailyLabel={dailyLabel}
        streak={streak}
        hearts={hearts}
        maxHearts={ARCADE_START_HEARTS}
        score={score}
        multiplier={multiplier}
        seconds={timerSeconds}
        timerVisual={timerVisual}
        muted={muted}
        onToggleMute={onToggleMute}
        onOpenArchive={onOpenArchive}
        lifelines={lifelines}
      />

      <View style={styles.axisRow}>
        <Text style={styles.axis}>▲ EARLIER</Text>
        {!isDaily && round > 0 && <Text style={styles.round}>ROUND {round}</Text>}
      </View>

      <View style={styles.boardArea} onLayout={onBoardLayout}>
        {slotHeight > 0 && (
          <View style={{ height: slotHeight * 5 - CARD_GAP }}>
            {cards.map((ev) => (
              <TimelineCard
                key={`${roundKey}-${ev.id}`}
                event={ev}
                positions={positions}
                count={cards.length}
                slotHeight={slotHeight}
                dragEnabled={phase === 'playing' && active}
                status={cardState[ev.id] ?? 'hidden'}
                flipped={cardState[ev.id] !== undefined}
                onGrab={onGrab}
                onSwap={onSwap}
                onDrop={onDrop}
              />
            ))}
          </View>
        )}
        {toast && (
          <Animated.View
            key={toast.key}
            entering={FadeInUp.springify()}
            exiting={FadeOut.duration(250)}
            pointerEvents="none"
            style={[styles.toast, { borderColor: toast.good ? COLORS.emerald : COLORS.coral }]}
          >
            <Text style={[styles.toastText, { color: toast.good ? COLORS.emerald : COLORS.coral }]}>{toast.text}</Text>
          </Animated.View>
        )}
      </View>

      <Text style={[styles.axis, styles.axisBottom]}>▼ LATER</Text>

      <View style={styles.footer}>
        {finished && isDaily ? (
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
            >
              <Text style={styles.ghostText}>VIEW RESULT</Text>
            </Pressable>
            <Pressable
              onPress={() => (isArchive ? onBackToToday() : onSwitchMode('arcade'))}
              style={({ pressed }) => [styles.flex, pressed && styles.pressed]}
            >
              <LinearGradient colors={[COLORS.indigo, '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainBtnSmall}>
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.mainTextSmall}>{isArchive ? 'TODAY' : 'ARCADE'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : finished ? (
          <Pressable
            onPress={() => (modalVisible ? undefined : setModalVisible(true))}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient colors={[COLORS.indigo, '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainBtn}>
              <RotateCcw size={22} color="#FFFFFF" strokeWidth={2.6} />
              <Text style={styles.mainText}>SEE RESULTS</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            disabled={phase !== 'playing'}
            onPress={() => {
              Sound.play('grab');
              haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
              lockIn(false);
            }}
            style={({ pressed }) => [pressed && styles.pressed, phase !== 'playing' && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Lock in order"
          >
            <LinearGradient colors={['#6366F1', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainBtn}>
              <Text style={styles.mainText}>
                {phase === 'revealing' ? 'REVEALING…' : phase === 'between' ? 'NEXT ROUND…' : 'LOCK IN ORDER'}
              </Text>
              {phase === 'playing' && <Lock size={22} color="#E9D5FF" strokeWidth={2.6} />}
            </LinearGradient>
          </Pressable>
        )}
      </View>

      <ConfettiBurst burstKey={active ? confetti : 0} />

      <ResultModal
        visible={modalVisible && active}
        onClose={() => setModalVisible(false)}
        modeLabel={resultContent.modeLabel}
        headline={resultContent.headline}
        won={resultContent.won}
        stats={resultContent.stats}
        grid={resultContent.grid}
        shareText={resultContent.shareText}
        revive={resultContent.revive}
        reviveIsAd={!isPro}
        primary={resultContent.primary}
        showNextDaily={resultContent.showNextDaily}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  axis: { color: COLORS.textLow, fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
  axisBottom: { paddingHorizontal: 20, marginTop: 6 },
  round: { color: COLORS.cyan, fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },
  boardArea: { flex: 1, paddingHorizontal: 16 },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: COLORS.bgDeep,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    zIndex: 200,
    elevation: 30,
  },
  toastText: { fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  footerRow: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 62,
    borderRadius: 18,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#5B21B6',
  },
  mainText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  mainBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 58,
    borderRadius: 18,
    borderBottomWidth: 4,
    borderBottomColor: '#5B21B6',
  },
  mainTextSmall: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  ghostBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: COLORS.textHi, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.7 },
});
