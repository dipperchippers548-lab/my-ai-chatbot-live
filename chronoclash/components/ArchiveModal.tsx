import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Lock, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { formatDateLabel, getArchiveKeys, getDailyPuzzle, type DateKey } from '../utils/dailySeed';
import type { DailyResult } from '../utils/storage';
import { gridToEmoji } from './ResultModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  isPro: boolean;
  onUnlockPro: () => void;
  todayKey: DateKey;
  results: Record<DateKey, DailyResult>;
  onSelect: (dateKey: DateKey) => void;
}

interface Row {
  key: DateKey;
  number: number;
  theme: string;
  result: DailyResult | undefined;
}

export function ArchiveModal({ visible, onClose, isPro, onUnlockPro, todayKey, results, onSelect }: Props) {
  const rows = useMemo<Row[]>(
    () =>
      getArchiveKeys(todayKey).map((key) => {
        const d = getDailyPuzzle(key);
        return { key, number: d.dailyNumber, theme: d.puzzle.theme, result: results[key] };
      }),
    [todayKey, results],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Archive</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close archive">
            <X size={24} color={COLORS.textHi} />
          </Pressable>
        </View>

        {!isPro && (
          <Pressable onPress={onUnlockPro} style={({ pressed }) => [pressed && styles.pressed]}>
            <LinearGradient
              colors={[COLORS.indigo, '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proBanner}
            >
              <Crown size={26} color="#FDE68A" strokeWidth={2.4} />
              <View style={styles.proBody}>
                <Text style={styles.proTitle}>Unlock ChronoClash Pro</Text>
                <Text style={styles.proSub}>Every past daily · No ads · Free lifelines</Text>
              </View>
            </LinearGradient>
          </Pressable>
        )}

        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Past puzzles appear here from tomorrow.</Text>}
          renderItem={({ item }) => {
            const locked = !isPro;
            return (
              <Pressable
                onPress={() => (locked ? onUnlockPro() : onSelect(item.key))}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Daily ${item.number}${locked ? ', locked' : ''}`}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowNum}>#{item.number}</Text>
                  <View>
                    <Text style={styles.rowTheme}>{item.theme}</Text>
                    <Text style={styles.rowDate}>{formatDateLabel(item.key)}</Text>
                  </View>
                </View>
                {item.result ? (
                  <Text style={styles.rowGrid}>{gridToEmoji(item.result.grid)}</Text>
                ) : locked ? (
                  <View style={styles.lock}>
                    <Lock size={14} color={COLORS.ink} strokeWidth={2.8} />
                    <Text style={styles.lockText}>PRO</Text>
                  </View>
                ) : (
                  <Text style={styles.play}>PLAY</Text>
                )}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  title: { color: COLORS.textHi, fontSize: 24, fontWeight: '900' },
  proBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  proBody: { flex: 1 },
  proTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  proSub: { color: '#E0E7FF', fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  list: { padding: 16, gap: 10 },
  empty: { color: COLORS.textMid, textAlign: 'center', marginTop: 40, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowNum: { color: COLORS.cyan, fontWeight: '900', fontSize: 16, width: 48 },
  rowTheme: { color: COLORS.textHi, fontWeight: '800', fontSize: 15 },
  rowDate: { color: COLORS.textMid, fontSize: 12, marginTop: 2 },
  rowGrid: { fontSize: 12, letterSpacing: 1 },
  lock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amber,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockText: { color: COLORS.ink, fontWeight: '900', fontSize: 11 },
  play: { color: COLORS.emerald, fontWeight: '900', letterSpacing: 1 },
  pressed: { opacity: 0.85 },
});
