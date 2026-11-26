import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import {
  PLACEMENT_COPY,
  registerSimulatedAdPresenter,
  type RewardedPlacement,
  type SimulatedAdRequest,
} from '../services/ads';

/**
 * Renders the mock ad used by `SimulatedAdProvider`, so rewarded flows can be
 * exercised without an AdMob account. Mount once at the app root.
 */
export function SimulatedAdOverlay() {
  const [request, setRequest] = useState<SimulatedAdRequest | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const progress = useSharedValue(0);
  const doneRef = useRef(false);

  useEffect(() => {
    registerSimulatedAdPresenter((req) => {
      doneRef.current = false;
      setRequest(req);
    });
    return () => registerSimulatedAdPresenter(null);
  }, []);

  useEffect(() => {
    if (!request) return undefined;
    progress.value = 0;
    progress.value = withTiming(1, { duration: request.durationMs, easing: Easing.linear });
    const end = Date.now() + request.durationMs;
    setSecondsLeft(Math.ceil(request.durationMs / 1000));
    const id = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      setSecondsLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(id);
        finish(true);
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const finish = (watched: boolean) => {
    if (doneRef.current || !request) return;
    doneRef.current = true;
    const req = request;
    setRequest(null);
    req.complete(watched);
  };

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const isRewarded = request?.kind === 'rewarded';
  const copy = isRewarded ? PLACEMENT_COPY[request.placement as RewardedPlacement] : null;

  return (
    <Modal visible={request !== null} transparent animationType="fade" onRequestClose={() => finish(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.tag}>SIMULATED {isRewarded ? 'REWARDED' : 'INTERSTITIAL'} AD</Text>
          <Text style={styles.brand}>⏳ Your Ad Here</Text>
          <Text style={styles.body}>
            {copy ? `Watch to unlock: ${copy.title}\n${copy.reward}` : 'Thanks for supporting ChronoClash!'}
          </Text>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, bar]} />
          </View>
          <Text style={styles.timer}>{secondsLeft > 0 ? `Reward in ${secondsLeft}s` : 'Reward granted!'}</Text>
          <Pressable onPress={() => finish(false)} hitSlop={10} style={styles.skip}>
            <Text style={styles.skipText}>{isRewarded ? 'Close (no reward)' : 'Skip'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  tag: { color: COLORS.textLow, fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  brand: { color: COLORS.ink, fontWeight: '900', fontSize: 28, marginTop: 14 },
  body: { color: COLORS.cardClue, textAlign: 'center', marginTop: 10, fontSize: 15, lineHeight: 21 },
  track: { width: '100%', height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, marginTop: 20, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: COLORS.amber },
  timer: { color: COLORS.ink, fontWeight: '800', marginTop: 10 },
  skip: { marginTop: 14 },
  skipText: { color: COLORS.textLow, fontWeight: '700', textDecorationLine: 'underline' },
});
