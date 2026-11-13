import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MacroLine } from '@/components/nutrition';
import { Button, Card, Chip, Ionicons, type IconName, Row, Screen, T, tap } from '@/components/ui';
import { requestAnalysis } from '@/lib/api';
import { MEAL_TYPES, mealTypeForNow } from '@/lib/dates';
import { pickFoodImage, type PreparedImage } from '@/lib/image';
import { scaleMacros, sumMacros } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';
import type { Analysis, FoodItem, MealType } from '@/lib/types';

type Mode = 'choose' | 'describe' | 'manual' | 'loading' | 'result' | 'error';

const PORTIONS = [
  { factor: 0.5, label: '½×' },
  { factor: 1, label: '1×' },
  { factor: 1.5, label: '1½×' },
  { factor: 2, label: '2×' },
];

const LOADING_LINES = ['Finding the food…', 'Sizing up portions…', 'Counting calories…', 'Almost done…'];

export default function ScanScreen() {
  const { canScan, isPro, scansLeft, recordScan, addEntry } = useStore();
  const c = useColors();

  const [mode, setMode] = useState<Mode>('choose');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealName, setMealName] = useState('');
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState<MealType>(mealTypeForNow());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const runAnalysis = async (input: { image?: PreparedImage; description?: string }) => {
    setMode('loading');
    try {
      const result = await requestAnalysis({
        imageBase64: input.image?.base64,
        mediaType: input.image?.mediaType,
        description: input.description,
      });
      if (!result.demo) await recordScan();
      setAnalysis(result);
      setItems(result.items);
      setMealName(result.mealName);
      setPortion(1);
      setMode('result');
      tap('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setMode('error');
    }
  };

  const startPhoto = async (source: 'camera' | 'library') => {
    if (!canScan) return router.push('/paywall');
    try {
      const picked = await pickFoodImage(source);
      if (!picked) return;
      setImage(picked);
      setDescription('');
      await runAnalysis({ image: picked });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t open the camera.');
      setMode('error');
    }
  };

  const startDescribe = () => {
    if (!canScan) return router.push('/paywall');
    setImage(null);
    setMode('describe');
  };

  const total = useMemo(() => scaleMacros(sumMacros(items), portion), [items, portion]);

  const save = async () => {
    setSaving(true);
    await addEntry({
      name: mealName.trim() || 'Meal',
      mealType,
      source: image ? 'photo' : 'text',
      items: items.map((it) => scaleMacros(it, portion)),
      ...total,
    });
    tap('success');
    close();
  };

  return (
    <Screen
      footer={
        mode === 'result' && analysis?.isFood ? (
          <Button
            testID="add-to-log"
            title={`Add ${total.calories} kcal to ${MEAL_TYPES.find((m) => m.id === mealType)?.label.toLowerCase()}`}
            icon="checkmark-circle"
            onPress={save}
            loading={saving}
            disabled={items.length === 0}
          />
        ) : mode === 'describe' ? (
          <Button
            testID="analyze-description"
            title="Count my calories"
            icon="sparkles"
            disabled={description.trim().length < 3}
            onPress={() => runAnalysis({ description })}
          />
        ) : undefined
      }>
      <Row style={styles.topBar}>
        <T variant="heading" style={styles.flex}>
          {mode === 'result' ? 'Review & log' : mode === 'manual' ? 'Add manually' : 'Log food'}
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={close}>
          <Ionicons name="close-circle" size={30} color={c.textMuted} />
        </Pressable>
      </Row>

      {mode === 'choose' && (
        <>
          <ChoiceCard
            testID="choose-camera"
            icon="camera"
            title="Take a photo"
            detail="Point at your plate. AI does the rest."
            onPress={() => startPhoto('camera')}
            highlight
          />
          <ChoiceCard
            testID="choose-library"
            icon="images"
            title="Choose from gallery"
            detail="Use a photo you already took"
            onPress={() => startPhoto('library')}
          />
          <ChoiceCard
            testID="choose-describe"
            icon="chatbubble-ellipses"
            title="Describe it"
            detail="“2 eggs, toast with butter, latte”"
            onPress={startDescribe}
          />
          <ChoiceCard
            testID="choose-manual"
            icon="create"
            title="Enter manually"
            detail="Type the calories yourself · always free"
            onPress={() => setMode('manual')}
          />
          {!isPro ? (
            <T variant="small" style={styles.center}>
              {scansLeft > 0
                ? `${scansLeft} free AI scan${scansLeft === 1 ? '' : 's'} left. `
                : 'You’ve used your free AI scans. '}
              <T variant="small" color={c.primary} style={styles.bold} onPress={() => router.push('/paywall')}>
                Go unlimited
              </T>
            </T>
          ) : null}
        </>
      )}

      {mode === 'describe' && (
        <Card>
          <T variant="bodyBold">What did you eat?</T>
          <TextInput
            testID="describe-input"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Chipotle bowl with chicken, rice, beans and guac"
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={300}
            autoFocus
            style={[styles.input, styles.multiline, { color: c.text, backgroundColor: c.cardAlt }]}
          />
          <T variant="small">Add amounts if you know them, like “2 slices” or “large”.</T>
        </Card>
      )}

      {mode === 'manual' && <ManualEntry onDone={close} />}

      {mode === 'loading' && <Loading image={image} />}

      {mode === 'error' && (
        <Card style={styles.centerCard}>
          <T style={styles.bigEmoji}>😵‍💫</T>
          <T variant="bodyBold" style={styles.center}>
            {error}
          </T>
          <Button title="Try again" icon="refresh" onPress={() => setMode('choose')} />
        </Card>
      )}

      {mode === 'result' && analysis && !analysis.isFood && (
        <Card style={styles.centerCard}>
          {image ? <Image source={{ uri: image.uri }} style={styles.thumb} contentFit="cover" /> : null}
          <T style={styles.bigEmoji}>🤔</T>
          <T variant="bodyBold" style={styles.center}>
            Hmm, that doesn’t look like food.
          </T>
          <T variant="muted" style={styles.center}>
            {analysis.note}
          </T>
          <Button title="Try another" icon="camera" onPress={() => setMode('choose')} />
        </Card>
      )}

      {mode === 'result' && analysis?.isFood && (
        <>
          {image ? <Image source={{ uri: image.uri }} style={styles.photo} contentFit="cover" /> : null}

          {analysis.demo ? (
            <Card style={{ backgroundColor: c.cardAlt }}>
              <T variant="small">
                🧪 Demo result. The server has no AI key yet, so this is sample data. See the README to switch on real
                scans.
              </T>
            </Card>
          ) : null}

          <Card>
            <TextInput
              testID="meal-name"
              value={mealName}
              onChangeText={setMealName}
              maxLength={60}
              style={[styles.nameInput, { color: c.text }]}
              accessibilityLabel="Meal name"
            />
            <Row style={styles.totalRow}>
              <T variant="display">{total.calories}</T>
              <T variant="muted">kcal</T>
              <View style={styles.flex} />
              <ConfidenceBadge level={analysis.confidence} />
            </Row>
            <MacroLine m={total} />
            {analysis.note ? <T variant="small">💡 {analysis.note}</T> : null}
          </Card>

          <Card>
            <T variant="label">Portion</T>
            <Row style={styles.wrap}>
              {PORTIONS.map((p) => (
                <Chip key={p.factor} label={p.label} selected={portion === p.factor} onPress={() => setPortion(p.factor)} />
              ))}
            </Row>
            <T variant="label">Meal</T>
            <Row style={styles.wrap}>
              {MEAL_TYPES.map((m) => (
                <Chip
                  key={m.id}
                  label={`${m.emoji} ${m.label}`}
                  selected={mealType === m.id}
                  onPress={() => setMealType(m.id)}
                />
              ))}
            </Row>
          </Card>

          <Card>
            <T variant="label">What we found</T>
            {items.length === 0 ? <T variant="muted">You removed everything. Retake or add manually.</T> : null}
            {items.map((it, i) => {
              const scaled = scaleMacros(it, portion);
              return (
                <Row key={`${it.name}-${i}`} style={[styles.item, { borderColor: c.border }]}>
                  <View style={styles.flex}>
                    <T variant="bodyBold">{it.name}</T>
                    <T variant="small">{it.portion}</T>
                  </View>
                  <T variant="bodyBold">{scaled.calories}</T>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${it.name}`}
                    hitSlop={10}
                    onPress={() => setItems(items.filter((_, j) => j !== i))}>
                    <Ionicons name="close" size={20} color={c.textMuted} />
                  </Pressable>
                </Row>
              );
            })}
          </Card>

          <Button title="Start over" variant="ghost" icon="refresh" onPress={() => setMode('choose')} />
        </>
      )}
    </Screen>
  );
}

function ChoiceCard({
  icon,
  title,
  detail,
  onPress,
  highlight,
  testID,
}: {
  icon: IconName;
  title: string;
  detail: string;
  onPress: () => void;
  highlight?: boolean;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: highlight ? c.primary : c.card,
          borderColor: highlight ? c.primary : c.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.choiceIcon, { backgroundColor: highlight ? 'rgba(255,255,255,0.22)' : c.cardAlt }]}>
        <Ionicons name={icon} size={26} color={highlight ? c.onPrimary : c.primary} />
      </View>
      <View style={styles.flex}>
        <T variant="bodyBold" color={highlight ? c.onPrimary : undefined}>
          {title}
        </T>
        <T variant="small" color={highlight ? c.onPrimary : undefined} style={highlight ? styles.soft : undefined}>
          {detail}
        </T>
      </View>
      <Ionicons name="chevron-forward" size={20} color={highlight ? c.onPrimary : c.textMuted} />
    </Pressable>
  );
}

function Loading({ image }: { image: PreparedImage | null }) {
  const c = useColors();
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((l) => Math.min(l + 1, LOADING_LINES.length - 1)), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.loading}>
      {image ? <Image source={{ uri: image.uri }} style={styles.photo} contentFit="cover" /> : null}
      <ActivityIndicator size="large" color={c.primary} />
      <T variant="heading" style={styles.center}>
        {LOADING_LINES[line]}
      </T>
    </View>
  );
}

function ConfidenceBadge({ level }: { level: Analysis['confidence'] }) {
  const c = useColors();
  const label = { high: 'Confident', medium: 'Good guess', low: 'Rough guess' }[level];
  const color = { high: c.success, medium: c.carbs, low: c.danger }[level];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <T variant="small" color={color} style={styles.bold}>
        {label}
      </T>
    </View>
  );
}

function ManualEntry({ onDone }: { onDone: () => void }) {
  const { addEntry } = useStore();
  const c = useColors();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<MealType>(mealTypeForNow());

  const num = (s: string) => {
    const n = parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const valid = name.trim().length > 0 && num(kcal) > 0;
  const inputStyle = [styles.input, { color: c.text, backgroundColor: c.cardAlt }];

  return (
    <>
      <Card>
        <T variant="label">Food</T>
        <TextInput
          testID="manual-name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Protein bar"
          placeholderTextColor={c.textMuted}
          maxLength={60}
          style={inputStyle}
        />
        <T variant="label">Calories</T>
        <TextInput
          testID="manual-kcal"
          value={kcal}
          onChangeText={setKcal}
          placeholder="kcal"
          placeholderTextColor={c.textMuted}
          keyboardType="numeric"
          maxLength={5}
          style={inputStyle}
        />
        <Row>
          {[
            { label: 'Protein g', value: protein, set: setProtein },
            { label: 'Carbs g', value: carbs, set: setCarbs },
            { label: 'Fat g', value: fat, set: setFat },
          ].map((f) => (
            <View key={f.label} style={styles.flex}>
              <T variant="small">{f.label}</T>
              <TextInput
                value={f.value}
                onChangeText={f.set}
                placeholder="0"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                maxLength={4}
                style={inputStyle}
              />
            </View>
          ))}
        </Row>
        <T variant="label">Meal</T>
        <Row style={styles.wrap}>
          {MEAL_TYPES.map((m) => (
            <Chip key={m.id} label={`${m.emoji} ${m.label}`} selected={mealType === m.id} onPress={() => setMealType(m.id)} />
          ))}
        </Row>
      </Card>
      <Button
        testID="manual-add"
        title="Add to log"
        icon="checkmark-circle"
        disabled={!valid}
        onPress={async () => {
          await addEntry({
            name: name.trim(),
            mealType,
            source: 'manual',
            calories: Math.round(num(kcal)),
            proteinG: num(protein),
            carbsG: num(carbs),
            fatG: num(fat),
          });
          tap('success');
          onDone();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  bold: { fontWeight: '700' },
  soft: { opacity: 0.85 },
  topBar: { marginBottom: space.xs },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1 },
  choiceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  loading: { alignItems: 'center', gap: space.lg, paddingTop: space.lg },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg },
  thumb: { width: 120, height: 120, borderRadius: radius.md },
  centerCard: { alignItems: 'center', paddingVertical: space.xl },
  bigEmoji: { fontSize: 44, lineHeight: 54 },
  nameInput: { fontSize: 22, fontWeight: '800', padding: 0 },
  totalRow: { alignItems: 'baseline', gap: space.xs },
  badge: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  wrap: { flexWrap: 'wrap', gap: space.sm },
  item: { borderTopWidth: 1, paddingTop: space.md },
});
