import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CalorieRing, EntryRow, MacroRow } from '@/components/nutrition';
import { Button, Card, Row, Screen, T } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { dayKey, MEAL_TYPES } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

export default function TodayScreen() {
  const { profile, entriesFor, totalsFor, removeEntry, streak, isPro, scansLeft } = useStore();
  const c = useColors();
  if (!profile) return null;

  const today = dayKey();
  const entries = entriesFor(today);
  const totals = totalsFor(today);
  const { targets } = profile;

  const onDelete = async (id: string, name: string) => {
    if (await confirm('Delete this food?', `“${name}” will be removed from today.`)) await removeEntry(id);
  };

  return (
    <Screen
      inTabs
      footer={
        <View style={styles.footer}>
          <Button testID="scan-button" title="Scan food" icon="camera" onPress={() => router.push('/scan')} />
          {!isPro ? (
            <T variant="small" style={styles.center}>
              {scansLeft > 0
                ? `${scansLeft} free AI scan${scansLeft === 1 ? '' : 's'} left`
                : 'Free scans used · manual entry is always free'}
            </T>
          ) : null}
        </View>
      }>
      <Row style={styles.header}>
        <View style={styles.flex}>
          <T variant="title">Munchly</T>
          <T variant="muted">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </T>
        </View>
        <View
          style={[styles.streak, { backgroundColor: c.cardAlt }]}
          accessibilityLabel={`${streak} day streak`}>
          <T variant="bodyBold">🔥 {streak}</T>
        </View>
      </Row>

      <Card style={styles.ringCard}>
        <CalorieRing eaten={totals.calories} goal={targets.calories} />
        <Row style={styles.ringStats}>
          <Stat label="Goal" value={targets.calories} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Stat label="Eaten" value={totals.calories} />
        </Row>
      </Card>

      <Card>
        <MacroRow totals={totals} targets={targets} />
      </Card>

      <Card>
        <T variant="heading">Today’s food</T>
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <T style={styles.emptyEmoji}>📸</T>
            <T variant="muted" style={styles.center}>
              Nothing logged yet.{'\n'}Snap your first meal and Munchly does the math.
            </T>
          </View>
        ) : (
          MEAL_TYPES.map((meal) => {
            const list = entries.filter((e) => e.mealType === meal.id);
            if (list.length === 0) return null;
            const kcal = list.reduce((sum, e) => sum + e.calories, 0);
            return (
              <View key={meal.id}>
                <Row style={styles.mealHeader}>
                  <T variant="label">{meal.label}</T>
                  <T variant="label">{kcal} kcal</T>
                </Row>
                {list.map((e) => (
                  <EntryRow key={e.id} entry={e} onDelete={() => onDelete(e.id, e.name)} />
                ))}
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <T variant="label">{label}</T>
      <T variant="heading">{value.toLocaleString()}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: { alignItems: 'flex-start' },
  streak: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill },
  ringCard: { alignItems: 'center', paddingVertical: space.xl },
  ringStats: { gap: space.xl },
  stat: { alignItems: 'center', gap: 2, minWidth: 80 },
  divider: { width: 1, height: 32 },
  mealHeader: { justifyContent: 'space-between', marginTop: space.sm, marginBottom: space.xs },
  empty: { alignItems: 'center', paddingVertical: space.xl, gap: space.sm },
  emptyEmoji: { fontSize: 40, lineHeight: 48 },
  footer: { gap: space.sm },
});
