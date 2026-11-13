import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntryRow, MacroLine } from '@/components/nutrition';
import { Card, Ionicons, Row, Screen, T } from '@/components/ui';
import { friendlyDay, lastDays, parseDayKey } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

const CHART_HEIGHT = 140;

export default function HistoryScreen() {
  const { profile, entries, totalsFor, entriesFor, streak } = useStore();
  const c = useColors();
  const [open, setOpen] = useState<string | null>(null);
  if (!profile) return null;

  const goal = profile.targets.calories;
  const week = lastDays(7);
  const weekTotals = week.map((d) => totalsFor(d).calories);
  const loggedWeek = weekTotals.filter((k) => k > 0);
  const average = loggedWeek.length ? Math.round(loggedWeek.reduce((a, b) => a + b, 0) / loggedWeek.length) : 0;
  const scaleMax = Math.max(goal * 1.25, ...weekTotals);

  const days = Array.from(new Set(entries.map((e) => e.day)))
    .sort()
    .reverse()
    .slice(0, 60);

  return (
    <Screen inTabs>
      <T variant="title">History</T>

      <Row>
        <Card style={styles.statCard}>
          <T variant="label">7-day average</T>
          <T variant="title">{average ? average.toLocaleString() : '—'}</T>
          <T variant="small">kcal / day</T>
        </Card>
        <Card style={styles.statCard}>
          <T variant="label">Streak</T>
          <T variant="title">🔥 {streak}</T>
          <T variant="small">{streak === 1 ? 'day' : 'days'} in a row</T>
        </Card>
      </Row>

      <Card>
        <T variant="heading">This week</T>
        <View style={[styles.chart, { height: CHART_HEIGHT }]}>
          <View
            style={[styles.goalLine, { bottom: (goal / scaleMax) * CHART_HEIGHT, borderColor: c.textMuted }]}
            accessibilityLabel={`Goal ${goal} kcal`}
          />
          {week.map((d, i) => {
            const kcal = weekTotals[i];
            const over = kcal > goal;
            return (
              <View key={d} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(kcal > 0 ? 6 : 2, (kcal / scaleMax) * CHART_HEIGHT),
                      backgroundColor: kcal === 0 ? c.cardAlt : over ? c.danger : c.primary,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <Row style={styles.labels}>
          {week.map((d) => (
            <T key={d} variant="small" style={styles.dayLabel}>
              {parseDayKey(d).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </T>
          ))}
        </Row>
        <T variant="small">Dashed line = your goal of {goal.toLocaleString()} kcal</T>
      </Card>

      {days.length === 0 ? (
        <Card style={styles.empty}>
          <T style={styles.emptyEmoji}>🗓️</T>
          <T variant="muted" style={styles.center}>
            Your logged days will show up here.
          </T>
        </Card>
      ) : (
        days.map((d) => {
          const totals = totalsFor(d);
          const expanded = open === d;
          return (
            <Card key={d}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : d)}>
                <Row>
                  <View style={styles.flex}>
                    <T variant="bodyBold">{friendlyDay(d)}</T>
                    <MacroLine m={totals} />
                  </View>
                  <T variant="bodyBold" color={totals.calories > goal ? c.danger : c.text}>
                    {totals.calories.toLocaleString()}
                  </T>
                  <T variant="small">/ {goal.toLocaleString()}</T>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
                </Row>
              </Pressable>
              {expanded ? entriesFor(d).map((e) => <EntryRow key={e.id} entry={e} />) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  statCard: { flex: 1, gap: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginTop: space.sm },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '70%', borderRadius: radius.sm },
  labels: { gap: space.sm },
  dayLabel: { flex: 1, textAlign: 'center', fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: space.xl },
  emptyEmoji: { fontSize: 36, lineHeight: 44 },
});
