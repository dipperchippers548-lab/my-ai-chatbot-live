import { Archive, Eye, Snowflake, Volume2, VolumeX } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

export type GameMode = 'daily' | 'arcade';
export type TimerVisual = 'running' | 'frozen' | 'paused' | 'done';

export interface LifelineProps {
  revealAvailable: boolean;
  freezeAvailable: boolean;
  disabled: boolean;
  isPro: boolean;
  onReveal: () => void;
  onFreeze: () => void;
}

interface Props {
  mode: GameMode;
  onSwitchMode: (mode: GameMode) => void;
  dailyLabel: string;
  streak: number;
  hearts: number;
  maxHearts: number;
  score: number;
  multiplier: number;
  seconds: number;
  timerVisual: TimerVisual;
  muted: boolean;
  onToggleMute: () => void;
  onOpenArchive: () => void;
  lifelines: LifelineProps;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${r < 10 ? '0' : ''}${r}`;
}

function ModeSwitch({ mode, onSwitch }: { mode: GameMode; onSwitch: (m: GameMode) => void }) {
  const x = useSharedValue(mode === 'daily' ? 0 : 1);
  useEffect(() => {
    x.value = withSpring(mode === 'daily' ? 0 : 1, { damping: 18, stiffness: 220 });
  }, [mode, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 92 }] }));
  return (
    <View style={styles.switch}>
      <Animated.View style={[styles.switchThumb, thumb]} />
      {(['daily', 'arcade'] as const).map((m) => (
        <Pressable
          key={m}
          style={styles.switchItem}
          onPress={() => onSwitch(m)}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === m }}
          hitSlop={6}
        >
          <Text style={[styles.switchText, mode === m && styles.switchTextActive]}>
            {m === 'daily' ? 'DAILY' : 'ARCADE'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function TimerPill({ seconds, visual }: { seconds: number; visual: TimerVisual }) {
  const pulse = useSharedValue(1);
  const urgent = visual === 'running' && seconds <= 10 && seconds > 0;

  useEffect(() => {
    if (urgent) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.12, { duration: 160 }), withTiming(1, { duration: 340 })),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [urgent, pulse]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const color = visual === 'frozen' ? COLORS.ice : urgent ? COLORS.coral : COLORS.amber;

  return (
    <Animated.View
      style={[styles.timer, { borderColor: color, shadowColor: color }, animated]}
      accessibilityLabel={`${seconds} seconds left`}
    >
      {visual === 'frozen' && <Snowflake size={15} color={color} strokeWidth={2.6} />}
      <Text style={[styles.timerText, { color }]}>{formatClock(seconds)}</Text>
    </Animated.View>
  );
}

function LifelineChip({
  icon,
  label,
  available,
  disabled,
  isPro,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  available: boolean;
  disabled: boolean;
  isPro: boolean;
  onPress: () => void;
}) {
  const off = !available || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.chip, off && styles.chipOff, pressed && styles.chipPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={[styles.chipText, off && styles.chipTextOff]}>{label}</Text>
      {available && (
        <View style={[styles.adTag, isPro && styles.proTag]}>
          <Text style={styles.adTagText}>{isPro ? 'PRO' : '▶ AD'}</Text>
        </View>
      )}
      {!available && <Text style={styles.usedText}>USED</Text>}
    </Pressable>
  );
}

function HeaderBarInner(props: Props) {
  const {
    mode,
    onSwitchMode,
    dailyLabel,
    streak,
    hearts,
    maxHearts,
    score,
    multiplier,
    seconds,
    timerVisual,
    muted,
    onToggleMute,
    onOpenArchive,
    lifelines,
  } = props;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable onPress={onOpenArchive} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Open archive">
          <Archive size={20} color={COLORS.textMid} />
        </Pressable>
        <ModeSwitch mode={mode} onSwitch={onSwitchMode} />
        <Pressable
          onPress={onToggleMute}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityLabel={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? <VolumeX size={20} color={COLORS.textLow} /> : <Volume2 size={20} color={COLORS.textMid} />}
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          {mode === 'daily' ? (
            <Text style={styles.dailyLabel}>{dailyLabel}</Text>
          ) : (
            <View>
              <Text style={styles.hearts} accessibilityLabel={`${hearts} lives`}>
                {Array.from({ length: maxHearts }, (_, i) => (i < hearts ? '❤️' : '🖤')).join('')}
              </Text>
              <Text style={styles.score}>{score.toLocaleString()} pts</Text>
            </View>
          )}
        </View>
        <View style={styles.statsCenter}>
          {mode === 'daily' ? (
            <Text style={styles.streak}>🔥 {streak}</Text>
          ) : (
            <View style={[styles.multi, multiplier > 1 && styles.multiHot]}>
              <Text style={[styles.multiText, multiplier > 1 && styles.multiTextHot]}>x{multiplier}</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRight}>
          <TimerPill seconds={seconds} visual={timerVisual} />
        </View>
      </View>

      <View style={styles.lifelines}>
        <LifelineChip
          icon={<Eye size={14} color={COLORS.amberSoft} strokeWidth={2.6} />}
          label="Reveal 1 Year"
          available={lifelines.revealAvailable}
          disabled={lifelines.disabled}
          isPro={lifelines.isPro}
          onPress={lifelines.onReveal}
        />
        <LifelineChip
          icon={<Snowflake size={14} color={COLORS.ice} strokeWidth={2.6} />}
          label="+15s Freeze"
          available={lifelines.freezeAvailable}
          disabled={lifelines.disabled}
          isPro={lifelines.isPro}
          onPress={lifelines.onFreeze}
        />
      </View>
    </View>
  );
}

export const HeaderBar = memo(HeaderBarInner);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 92,
    bottom: 3,
    borderRadius: 999,
    backgroundColor: COLORS.indigo,
    shadowColor: COLORS.violet,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  switchItem: { width: 92, paddingVertical: 7, alignItems: 'center' },
  switchText: { color: COLORS.textMid, fontWeight: '800', fontSize: 12.5, letterSpacing: 1.2 },
  switchTextActive: { color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, minHeight: 46 },
  statsLeft: { flex: 1, alignItems: 'flex-start' },
  statsCenter: { flex: 1, alignItems: 'center' },
  statsRight: { flex: 1, alignItems: 'flex-end' },
  dailyLabel: { color: COLORS.textMid, fontWeight: '800', fontSize: 18, letterSpacing: 0.6 },
  hearts: { fontSize: 17, letterSpacing: 1 },
  score: { color: COLORS.textHi, fontWeight: '800', fontSize: 13, marginTop: 2 },
  streak: { color: COLORS.textHi, fontWeight: '800', fontSize: 22 },
  multi: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiHot: { borderColor: COLORS.cyan, backgroundColor: 'rgba(56,189,248,0.15)' },
  multiText: { color: COLORS.textMid, fontWeight: '900', fontSize: 18 },
  multiTextHot: { color: COLORS.cyan },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(245,158,11,0.08)',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  timerText: { fontSize: 21, fontWeight: '800', fontVariant: ['tabular-nums'] },
  lifelines: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOff: { opacity: 0.45 },
  chipPressed: { transform: [{ scale: 0.96 }], backgroundColor: COLORS.surfaceHi },
  chipText: { color: COLORS.textHi, fontSize: 12, fontWeight: '700' },
  chipTextOff: { color: COLORS.textMid },
  adTag: { backgroundColor: COLORS.amber, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1 },
  proTag: { backgroundColor: COLORS.violet },
  adTagText: { color: COLORS.ink, fontSize: 9, fontWeight: '900' },
  usedText: { color: COLORS.textLow, fontSize: 9, fontWeight: '900' },
});
