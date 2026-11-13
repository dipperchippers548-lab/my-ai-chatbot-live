import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Ionicons, Row, Screen, T, tap } from '@/components/ui';
import { PLANS, PREVIEW_MODE } from '@/lib/config';
import { notify } from '@/lib/confirm';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

const PERKS = [
  { icon: 'camera', text: 'Unlimited AI photo scans' },
  { icon: 'chatbubble-ellipses', text: 'Describe meals in your own words' },
  { icon: 'bar-chart', text: 'Full history, streaks and weekly trends' },
  { icon: 'heart', text: 'Support a small indie app' },
] as const;

export default function Paywall() {
  const { isPro, setPro } = useStore();
  const c = useColors();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('yearly');
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const purchase = () => {
    // TODO(billing): replace with RevenueCat / Google Play Billing. See README → "Turn on payments".
    notify(
      'Payments aren’t connected yet',
      'This is where Google Play billing goes. Follow the README to connect RevenueCat before publishing.',
    );
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button testID="paywall-cta" title={plan === 'yearly' ? 'Start 3-day free trial' : 'Continue'} onPress={purchase} />
          <T variant="small" style={styles.center}>
            Auto-renews until canceled. Cancel anytime in Google Play.
          </T>
          {__DEV__ || PREVIEW_MODE ? (
            <Button
              title={isPro ? 'Test: turn Pro off' : 'Test: unlock Pro (test builds only)'}
              variant="ghost"
              onPress={async () => {
                await setPro(!isPro);
                close();
              }}
            />
          ) : null}
        </View>
      }>
      <Row style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={close}>
          <Ionicons name="close-circle" size={30} color={c.textMuted} />
        </Pressable>
      </Row>

      <View style={styles.hero}>
        <T style={styles.heroEmoji}>🍕📸✨</T>
        <T variant="title" style={styles.center}>
          Snap every meal.{'\n'}No limits.
        </T>
        <T variant="muted" style={styles.center}>
          Munchly Pro turns your camera into a calorie counter.
        </T>
      </View>

      <View style={styles.perks}>
        {PERKS.map((p) => (
          <Row key={p.text}>
            <View style={[styles.perkIcon, { backgroundColor: c.cardAlt }]}>
              <Ionicons name={p.icon} size={18} color={c.primary} />
            </View>
            <T variant="bodyBold">{p.text}</T>
          </Row>
        ))}
      </View>

      {PLANS.map((p) => {
        const selected = plan === p.id;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              setPlan(p.id);
            }}
            style={[
              styles.plan,
              { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.cardAlt : c.card },
            ]}>
            <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? c.primary : c.textMuted} />
            <View style={styles.flex}>
              <Row style={styles.planTitle}>
                <T variant="bodyBold">{p.label}</T>
                {p.best ? (
                  <View style={[styles.best, { backgroundColor: c.primary }]}>
                    <T variant="small" color={c.onPrimary} style={styles.bold}>
                      BEST VALUE
                    </T>
                  </View>
                ) : null}
              </Row>
              <T variant="small">{p.note}</T>
            </View>
            <T variant="bodyBold">
              {p.price}
              <T variant="small">{p.per}</T>
            </T>
          </Pressable>
        );
      })}

      <Pressable onPress={purchase} accessibilityRole="button">
        <T variant="small" style={styles.center} color={c.primary}>
          Restore purchases
        </T>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  bold: { fontWeight: '700' },
  top: { justifyContent: 'flex-end' },
  hero: { alignItems: 'center', gap: space.sm },
  heroEmoji: { fontSize: 48, lineHeight: 60 },
  perks: { gap: space.md, paddingHorizontal: space.sm },
  perkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 2 },
  planTitle: { gap: space.sm },
  best: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
  footer: { gap: space.sm },
});
