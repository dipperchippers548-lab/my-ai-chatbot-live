import { LinearGradient } from 'expo-linear-gradient';
import { Play, RotateCcw, Share2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { msUntilNextDaily } from '../utils/dailySeed';

export interface ResultStat {
  label: string;
  value: string;
}

export interface ResultAction {
  label: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  modeLabel: string;
  headline: string;
  won: boolean;
  stats: ResultStat[];
  /** One row of 5 per round (spoiler-free). */
  grid: boolean[][];
  shareText: string;
  revive: ResultAction | null;
  reviveIsAd: boolean;
  primary: ResultAction;
  showNextDaily: boolean;
}

export function gridToEmoji(row: boolean[]): string {
  return row.map((ok) => (ok ? '🟩' : '🟥')).join('');
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function NextDailyCountdown() {
  const [ms, setMs] = useState(msUntilNextDaily());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextDaily()), 1000);
    return () => clearInterval(id);
  }, []);
  return <Text style={styles.next}>Next daily in {formatCountdown(ms)}</Text>;
}

export function ResultModal({
  visible,
  onClose,
  modeLabel,
  headline,
  won,
  stats,
  grid,
  shareText,
  revive,
  reviveIsAd,
  primary,
  showNextDaily,
}: Props) {
  const onShare = async () => {
    try {
      await Share.share({ message: shareText });
    } catch {
      // User cancelled or no share target.
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify().damping(16)} style={styles.sheet}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Close results">
            <X size={20} color={COLORS.textMid} />
          </Pressable>
          <ScrollView contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
            <Text style={styles.mode}>{modeLabel.toUpperCase()}</Text>
            <Text style={[styles.headline, { color: won ? COLORS.emerald : COLORS.amber }]}>{headline}</Text>

            <View style={styles.gridBox}>
              {grid.length === 0 ? (
                <Text style={styles.gridEmpty}>No rounds locked in</Text>
              ) : (
                grid.slice(-5).map((row, i) => (
                  <Animated.Text key={i} entering={FadeIn.delay(120 + i * 90)} style={styles.gridRow}>
                    {gridToEmoji(row)}
                  </Animated.Text>
                ))
              )}
            </View>

            <View style={styles.stats}>
              {stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={[styles.statValue, s.value.length > 9 && styles.statValueLong]} numberOfLines={2}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Pressable onPress={onShare} style={({ pressed }) => [pressed && styles.pressed]} accessibilityRole="button">
              <LinearGradient
                colors={[COLORS.emerald, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareBtn}
              >
                <Share2 size={20} color="#FFFFFF" strokeWidth={2.6} />
                <Text style={styles.shareText}>SHARE RESULT</Text>
              </LinearGradient>
            </Pressable>

            {revive && (
              <Pressable
                onPress={revive.onPress}
                style={({ pressed }) => [styles.reviveBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                {reviveIsAd ? (
                  <Play size={16} color={COLORS.ink} fill={COLORS.ink} />
                ) : (
                  <RotateCcw size={16} color={COLORS.ink} strokeWidth={2.6} />
                )}
                <Text style={styles.reviveText}>{revive.label}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={primary.onPress}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{primary.label}</Text>
            </Pressable>

            {showNextDaily && <NextDailyCountdown />}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 24,
  },
  close: { position: 'absolute', top: 14, right: 14, zIndex: 2, padding: 4 },
  content: { padding: 22, paddingTop: 26, alignItems: 'stretch' },
  mode: { color: COLORS.textMid, fontWeight: '800', letterSpacing: 2, fontSize: 13, textAlign: 'center' },
  headline: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 6 },
  gridBox: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    gap: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  gridRow: { fontSize: 26, letterSpacing: 4 },
  gridEmpty: { color: COLORS.textLow, fontWeight: '700' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 18, rowGap: 10 },
  stat: {
    width: '48.5%',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { color: COLORS.textHi, fontSize: 20, fontWeight: '900', textAlign: 'center', paddingHorizontal: 6 },
  statValueLong: { fontSize: 14 },
  statLabel: { color: COLORS.textMid, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  shareBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shareText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  reviveBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.amber,
  },
  reviveText: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  secondaryBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.indigo,
  },
  secondaryText: { color: '#C7D2FE', fontSize: 15, fontWeight: '900', letterSpacing: 0.6 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  next: { color: COLORS.textMid, textAlign: 'center', marginTop: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
