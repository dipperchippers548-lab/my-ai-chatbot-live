import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Ionicons, OptionCard, Row, Screen, Segmented, Stepper, T } from '@/components/ui';
import {
  ACTIVITY_LEVELS,
  ADULT_AGE,
  calculateTargets,
  cmToFeetInches,
  feetInchesToCm,
  GOALS,
  kgToLb,
  lbToKg,
  MIN_AGE,
} from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';
import type { ActivityLevel, Goal, Sex, Units } from '@/lib/types';

const STEPS = ['welcome', 'goal', 'about', 'body', 'activity', 'plan'] as const;

export default function Onboarding() {
  const { profile, saveProfile } = useStore();
  const editing = useLocalSearchParams<{ edit?: string }>().edit === '1' && !!profile;
  const c = useColors();

  const [step, setStep] = useState(editing ? 1 : 0);
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'lose');
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'female');
  const [age, setAge] = useState(profile?.age ?? 25);
  const [units, setUnits] = useState<Units>(profile?.units ?? 'imperial');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ?? 170);
  const [weightKg, setWeightKg] = useState(profile?.weightKg ?? 70);
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity ?? 'light');

  const name = STEPS[step];
  const firstStep = editing ? 1 : 0;
  const targets = calculateTargets({ sex, age, heightCm, weightKg, activity, goal });

  const next = async () => {
    if (name !== 'plan') return setStep(step + 1);
    await saveProfile({ goal, sex, age, heightCm, weightKg, activity, units, targets });
    if (editing) router.back();
    else router.replace('/');
  };

  const { feet, inches } = cmToFeetInches(heightCm);
  const lb = Math.round(kgToLb(weightKg));

  return (
    <Screen
      footer={
        <Button
          testID="onboarding-next"
          title={name === 'welcome' ? 'Get started' : name === 'plan' ? (editing ? 'Save my plan' : 'Start tracking') : 'Continue'}
          onPress={next}
        />
      }>
      {name !== 'welcome' ? (
        <Row>
          {step > firstStep || editing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              onPress={() => (step > firstStep ? setStep(step - 1) : router.back())}>
              <Ionicons name="chevron-back" size={26} color={c.text} />
            </Pressable>
          ) : null}
          <View style={[styles.progress, { backgroundColor: c.cardAlt }]}>
            <View
              style={[styles.progressFill, { backgroundColor: c.primary, width: `${(step / (STEPS.length - 1)) * 100}%` }]}
            />
          </View>
        </Row>
      ) : null}

      {name === 'welcome' && (
        <View style={styles.welcome}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} accessibilityLabel="Munchly logo" />
          <T variant="display" style={styles.center}>
            Munchly
          </T>
          <T variant="heading" style={styles.center}>
            Snap your food.{'\n'}Know your calories.
          </T>
          <T variant="muted" style={styles.center}>
            Take a photo of any meal and Munchly estimates the calories, protein, carbs and fat in seconds.
          </T>
        </View>
      )}

      {name === 'goal' && (
        <>
          <Header title="What’s your goal?" subtitle="We’ll build your daily calorie target around it." />
          {GOALS.map((g) => (
            <OptionCard
              key={g.id}
              title={g.label}
              detail={g.detail}
              emoji={g.emoji}
              selected={goal === g.id}
              onPress={() => setGoal(g.id)}
            />
          ))}
        </>
      )}

      {name === 'about' && (
        <>
          <Header title="About you" subtitle="Your body’s energy needs depend on these." />
          <Card>
            <T variant="label">Sex used in the calorie formula</T>
            <Segmented
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ]}
              value={sex}
              onChange={setSex}
            />
          </Card>
          <Stepper label="Age" value={age} unit="years" min={MIN_AGE} max={100} onChange={setAge} />
          {age < ADULT_AGE ? (
            <Card style={{ backgroundColor: c.cardAlt }}>
              <T variant="small">
                🌱 Growing bodies need plenty of fuel, so Munchly keeps targets gentle for under-18s. Talk to a doctor or
                parent before starting a diet.
              </T>
            </Card>
          ) : null}
        </>
      )}

      {name === 'body' && (
        <>
          <Header title="Height & weight" subtitle="Only stored on your phone." />
          <Segmented
            options={[
              { value: 'imperial', label: 'ft / lb' },
              { value: 'metric', label: 'cm / kg' },
            ]}
            value={units}
            onChange={setUnits}
          />
          {units === 'metric' ? (
            <>
              <Stepper label="Height" value={Math.round(heightCm)} unit="cm" min={120} max={230} onChange={setHeightCm} />
              <Stepper label="Weight" value={Math.round(weightKg)} unit="kg" min={30} max={300} onChange={setWeightKg} />
            </>
          ) : (
            <>
              <Row>
                <View style={styles.flex}>
                  <Stepper
                    label="Height"
                    value={feet}
                    unit="ft"
                    min={4}
                    max={7}
                    onChange={(f) => setHeightCm(feetInchesToCm(f, inches))}
                  />
                </View>
                <View style={styles.flex}>
                  <Stepper
                    label="Inches"
                    value={inches}
                    unit="in"
                    min={0}
                    max={11}
                    onChange={(i) => setHeightCm(feetInchesToCm(feet, i))}
                  />
                </View>
              </Row>
              <Stepper label="Weight" value={lb} unit="lb" min={66} max={660} onChange={(v) => setWeightKg(lbToKg(v))} />
            </>
          )}
        </>
      )}

      {name === 'activity' && (
        <>
          <Header title="How active are you?" subtitle="Count your job, walking and workouts." />
          {ACTIVITY_LEVELS.map((a) => (
            <OptionCard
              key={a.id}
              title={a.label}
              detail={a.detail}
              selected={activity === a.id}
              onPress={() => setActivity(a.id)}
            />
          ))}
        </>
      )}

      {name === 'plan' && (
        <>
          <Header title="Your daily plan" subtitle="You can change this anytime in Me." />
          <Card style={styles.planCard}>
            <T variant="label">Calories per day</T>
            <T variant="display" testID="plan-calories">
              {targets.calories.toLocaleString()}
            </T>
            <Row style={styles.planMacros}>
              <PlanMacro label="Protein" grams={targets.proteinG} color={c.protein} />
              <PlanMacro label="Carbs" grams={targets.carbsG} color={c.carbs} />
              <PlanMacro label="Fat" grams={targets.fatG} color={c.fat} />
            </Row>
          </Card>
          <T variant="small" style={styles.center}>
            Calculated with the Mifflin–St Jeor formula. These are estimates to guide you, not medical advice.
          </T>
        </>
      )}
    </Screen>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <T variant="title">{title}</T>
      <T variant="muted">{subtitle}</T>
    </View>
  );
}

function PlanMacro({ label, grams, color }: { label: string; grams: number; color: string }) {
  const c = useColors();
  return (
    <View style={[styles.planMacro, { backgroundColor: c.cardAlt }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <T variant="heading">{grams}g</T>
      <T variant="small">{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: { gap: space.xs, marginBottom: space.sm },
  progress: { flex: 1, height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
  welcome: { alignItems: 'center', gap: space.lg, paddingTop: space.xxl * 2 },
  logo: { width: 120, height: 120, borderRadius: 36 },
  planCard: { alignItems: 'center', paddingVertical: space.xl },
  planMacros: { gap: space.sm, marginTop: space.sm },
  planMacro: { flex: 1, alignItems: 'center', padding: space.md, borderRadius: radius.md, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
});
