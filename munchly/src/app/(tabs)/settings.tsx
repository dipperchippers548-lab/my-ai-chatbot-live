import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Row, Screen, Segmented, T } from '@/components/ui';
import { FREE_SCANS } from '@/lib/config';
import { confirm } from '@/lib/confirm';
import { ACTIVITY_LEVELS, formatHeight, formatWeight, GOALS } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { useColors } from '@/lib/theme';
import type { Units } from '@/lib/types';

export default function SettingsScreen() {
  const { profile, saveProfile, isPro, scansLeft, resetAll } = useStore();
  const c = useColors();
  if (!profile) return null;

  const goal = GOALS.find((g) => g.id === profile.goal);
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activity);
  const { targets } = profile;

  const onReset = async () => {
    if (await confirm('Erase everything?', 'This deletes your profile and every meal you logged on this phone.', 'Erase')) {
      await resetAll();
      router.replace('/onboarding');
    }
  };

  return (
    <Screen inTabs>
      <T variant="title">Me</T>

      <Card>
        <Row>
          <T style={styles.goalEmoji}>{goal?.emoji}</T>
          <View style={styles.flex}>
            <T variant="heading">{goal?.label}</T>
            <T variant="muted">
              {profile.age} yrs · {formatHeight(profile.heightCm, profile.units)} ·{' '}
              {formatWeight(profile.weightKg, profile.units)}
            </T>
            <T variant="small">{activity?.label}</T>
          </View>
        </Row>
        <Button title="Edit my details" variant="secondary" icon="pencil" onPress={() => router.push('/onboarding?edit=1')} />
      </Card>

      <Card>
        <T variant="label">Daily targets</T>
        <Row style={styles.targets}>
          <Target label="Calories" value={targets.calories.toLocaleString()} color={c.primary} />
          <Target label="Protein" value={`${targets.proteinG}g`} color={c.protein} />
          <Target label="Carbs" value={`${targets.carbsG}g`} color={c.carbs} />
          <Target label="Fat" value={`${targets.fatG}g`} color={c.fat} />
        </Row>
      </Card>

      <Card>
        <T variant="label">Units</T>
        <Segmented<Units>
          options={[
            { value: 'imperial', label: 'ft / lb' },
            { value: 'metric', label: 'cm / kg' },
          ]}
          value={profile.units}
          onChange={(units) => saveProfile({ ...profile, units })}
        />
      </Card>

      <Card>
        <T variant="label">Plan</T>
        {isPro ? (
          <T variant="bodyBold">⭐ Munchly Pro: unlimited scans</T>
        ) : (
          <>
            <T variant="bodyBold">
              Free · {scansLeft} of {FREE_SCANS} AI scans left
            </T>
            <Button title="Go unlimited" icon="sparkles" onPress={() => router.push('/paywall')} />
          </>
        )}
      </Card>

      <Card>
        <T variant="label">Good to know</T>
        <T variant="small">
          Munchly’s numbers are AI estimates to help you track, not medical or nutrition advice. If you have a health
          condition, are pregnant, or are under 18, check with a doctor before changing how you eat.
        </T>
        <T variant="small">
          Photos and descriptions you scan are sent to an AI service to estimate nutrition. Munchly doesn’t save them.
          Your profile and food log stay on this phone.
        </T>
      </Card>

      <Button title="Erase all my data" variant="danger" icon="trash" onPress={onReset} />
      <T variant="small" style={styles.center}>
        Munchly v1.0.0
      </T>
    </Screen>
  );
}

function Target({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.target}>
      <T variant="heading" color={color}>
        {value}
      </T>
      <T variant="small">{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  goalEmoji: { fontSize: 36, lineHeight: 44 },
  targets: { justifyContent: 'space-between' },
  target: { alignItems: 'center', gap: 2 },
});
