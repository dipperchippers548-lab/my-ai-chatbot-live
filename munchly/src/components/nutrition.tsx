import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { MEAL_TYPES } from '@/lib/dates';
import { radius, space, useColors } from '@/lib/theme';
import type { LogEntry, Macros, Targets } from '@/lib/types';

import { Ionicons, T } from './ui';

/** Circular progress ring showing calories eaten vs. goal. */
export function CalorieRing({ eaten, goal, size = 220 }: { eaten: number; goal: number; size?: number }) {
  const c = useColors();
  const stroke = 18;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const over = eaten > goal;
  const left = Math.round(goal - eaten);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.ringTrack} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? c.danger : c.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <T variant="display" accessibilityLabel={over ? `${-left} calories over` : `${left} calories left`}>
        {Math.abs(left).toLocaleString()}
      </T>
      <T variant="muted">{over ? 'kcal over' : 'kcal left'}</T>
    </View>
  );
}

export function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const c = useColors();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.macro}>
      <T variant="small" style={styles.bold}>
        {label}
      </T>
      <View style={[styles.track, { backgroundColor: c.cardAlt }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <T variant="small">
        {Math.round(value)}
        <Text style={{ color: c.textMuted }}> / {goal}g</Text>
      </T>
    </View>
  );
}

export function MacroRow({ totals, targets }: { totals: Macros; targets: Targets }) {
  const c = useColors();
  return (
    <View style={styles.macroRow}>
      <MacroBar label="Protein" value={totals.proteinG} goal={targets.proteinG} color={c.protein} />
      <MacroBar label="Carbs" value={totals.carbsG} goal={targets.carbsG} color={c.carbs} />
      <MacroBar label="Fat" value={totals.fatG} goal={targets.fatG} color={c.fat} />
    </View>
  );
}

/** Small "P 30g · C 40g · F 12g" line. */
export function MacroLine({ m }: { m: Macros }) {
  const c = useColors();
  return (
    <T variant="small">
      <Text style={{ color: c.protein, fontWeight: '700' }}>P</Text> {Math.round(m.proteinG)}g ·{' '}
      <Text style={{ color: c.carbs, fontWeight: '700' }}>C</Text> {Math.round(m.carbsG)}g ·{' '}
      <Text style={{ color: c.fat, fontWeight: '700' }}>F</Text> {Math.round(m.fatG)}g
    </T>
  );
}

export function EntryRow({ entry, onDelete }: { entry: LogEntry; onDelete?: () => void }) {
  const c = useColors();
  const meal = MEAL_TYPES.find((m) => m.id === entry.mealType);
  return (
    <View style={[styles.entry, { borderColor: c.border }]}>
      <View style={[styles.entryIcon, { backgroundColor: c.cardAlt }]}>
        <Text style={styles.entryEmoji}>{meal?.emoji ?? '🍽️'}</Text>
      </View>
      <View style={styles.entryText}>
        <T variant="bodyBold" numberOfLines={1}>
          {entry.name}
        </T>
        <MacroLine m={entry} />
      </View>
      <T variant="bodyBold">{entry.calories}</T>
      <T variant="small"> kcal</T>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${entry.name}`}
          hitSlop={10}
          onPress={onDelete}
          style={styles.delete}>
          <Ionicons name="trash-outline" size={18} color={c.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  macroRow: { flexDirection: 'row', gap: space.md },
  macro: { flex: 1, gap: 6 },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderTopWidth: 1 },
  entryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  entryEmoji: { fontSize: 22 },
  entryText: { flex: 1, gap: 2 },
  delete: { paddingLeft: space.sm },
});
