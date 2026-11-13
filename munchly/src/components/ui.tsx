import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, useColors } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export { Ionicons };

export function tap(style: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else
    Haptics.impactAsync(style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(
      () => {},
    );
}

/** Full-height page with safe-area padding and the app background. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  footer,
  contentStyle,
  inTabs = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Tab screens sit above the tab bar, which already handles the bottom safe area. */
  inTabs?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottom = inTabs ? 0 : insets.bottom;
  const pad: ViewStyle = {
    paddingTop: insets.top + space.md,
    paddingHorizontal: padded ? space.lg : 0,
    paddingBottom: footer ? space.lg : bottom + space.xl,
  };
  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.page, pad, contentStyle]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.page, pad, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: bottom + space.md, backgroundColor: c.bg }]}>{footer}</View>
      ) : null}
    </View>
  );
}

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyBold' | 'muted' | 'small' | 'label';

export function T({ variant = 'body', style, color, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  const c = useColors();
  const base = textStyles[variant];
  const tint = color ?? (variant === 'muted' || variant === 'small' || variant === 'label' ? c.textMuted : c.text);
  return <Text {...rest} style={[base, { color: tint }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const c = useColors();
  const bg = { primary: c.primary, secondary: c.cardAlt, ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: c.onPrimary, secondary: c.text, ghost: c.primary, danger: c.danger }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed && variant === 'primary' ? c.primaryPressed : bg, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Text style={[textStyles.bodyBold, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Big tappable option used in onboarding and pickers. */
export function OptionCard({
  title,
  detail,
  emoji,
  selected,
  onPress,
}: {
  title: string;
  detail?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.option,
        { backgroundColor: selected ? c.cardAlt : c.card, borderColor: selected ? c.primary : c.border },
      ]}>
      {emoji ? <Text style={styles.optionEmoji}>{emoji}</Text> : null}
      <View style={styles.flex}>
        <T variant="bodyBold">{title}</T>
        {detail ? <T variant="small">{detail}</T> : null}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? c.primary : c.textMuted} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.chip,
        { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border },
      ]}>
      <Text style={[textStyles.small, { color: selected ? c.onPrimary : c.text, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

/** Horizontal two-or-more-way toggle (e.g. kg / lb). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.segmented, { backgroundColor: c.cardAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segment, active && { backgroundColor: c.card }]}>
            <Text style={[textStyles.small, { color: active ? c.text : c.textMuted, fontWeight: '700' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** − value + stepper for numbers like age, height and weight. */
export function Stepper({
  label,
  value,
  unit,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const c = useColors();
  const change = (delta: number) => {
    tap();
    onChange(Math.min(max, Math.max(min, value + delta)));
  };
  return (
    <View style={[styles.stepper, { backgroundColor: c.card, borderColor: c.border }]}>
      <T variant="label">{label}</T>
      <View style={styles.stepperRow}>
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => change(-step)}
          style={[styles.stepBtn, { backgroundColor: c.cardAlt }]}>
          <Ionicons name="remove" size={22} color={c.text} />
        </Pressable>
        <View style={styles.stepValue}>
          <T variant="title">{value}</T>
          {unit ? <T variant="muted"> {unit}</T> : null}
        </View>
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          onPress={() => change(step)}
          style={[styles.stepBtn, { backgroundColor: c.cardAlt }]}>
          <Ionicons name="add" size={22} color={c.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const textStyles = StyleSheet.create({
  display: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  muted: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: space.lg },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg, gap: space.md },
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  optionEmoji: { fontSize: 28 },
  chip: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, borderWidth: 1 },
  segmented: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, alignSelf: 'flex-start' },
  segment: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill },
  stepper: { borderRadius: radius.md, borderWidth: 1, padding: space.lg, gap: space.sm },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flexDirection: 'row', alignItems: 'baseline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
