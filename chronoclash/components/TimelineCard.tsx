import { GripVertical } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { CATEGORY_COLORS, COLORS } from '../constants/theme';
import type { TimelineEvent } from '../data/puzzles';

export type CardStatus = 'hidden' | 'peek' | 'correct' | 'wrong';

export type Positions = Record<string, number>;

export const CARD_GAP = 10;

const SPRING = { damping: 20, stiffness: 260, mass: 0.7 };

interface Props {
  event: TimelineEvent;
  positions: SharedValue<Positions>;
  count: number;
  slotHeight: number;
  dragEnabled: boolean;
  status: CardStatus;
  /** Whether the `?` badge is flipped to show the year. */
  flipped: boolean;
  onGrab: () => void;
  onSwap: () => void;
  onDrop: (positions: Positions) => void;
}

/** Moves `id` to `to`, shifting the cards in between. */
function moveTo(positions: Positions, id: string, to: number): Positions {
  'worklet';
  const from = positions[id];
  const next: Positions = {};
  for (const key in positions) {
    const p = positions[key];
    if (key === id) next[key] = to;
    else if (from < to && p > from && p <= to) next[key] = p - 1;
    else if (from > to && p < from && p >= to) next[key] = p + 1;
    else next[key] = p;
  }
  return next;
}

function TimelineCardInner({
  event,
  positions,
  count,
  slotHeight,
  dragEnabled,
  status,
  flipped,
  onGrab,
  onSwap,
  onDrop,
}: Props) {
  const top = useSharedValue((positions.value[event.id] ?? 0) * slotHeight);
  const startTop = useSharedValue(0);
  const active = useSharedValue(false);
  const lift = useSharedValue(0);
  const flip = useSharedValue(flipped ? 1 : 0);
  const pop = useSharedValue(1);

  // Re-snap when the slot size changes (rotation / first layout).
  useEffect(() => {
    if (!active.value) top.value = (positions.value[event.id] ?? 0) * slotHeight;
  }, [slotHeight, active, top, positions, event.id]);

  useEffect(() => {
    flip.value = withTiming(flipped ? 1 : 0, { duration: 420 });
    if (flipped && status !== 'hidden') {
      pop.value = withSequence(withTiming(1.035, { duration: 140 }), withSpring(1, SPRING));
    }
  }, [flipped, status, flip, pop]);

  // Neighbours glide into their new slots whenever the order changes.
  useAnimatedReaction(
    () => positions.value[event.id],
    (current, previous) => {
      if (current !== previous && current !== undefined && !active.value) {
        top.value = withSpring(current * slotHeight, SPRING);
      }
    },
    [slotHeight],
  );

  const pan = usePanGesture({
    enabled: dragEnabled,
    minDistance: 2,
    onActivate: () => {
      'worklet';
      active.value = true;
      startTop.value = top.value;
      lift.value = withSpring(1, SPRING);
      scheduleOnRN(onGrab);
    },
    onUpdate: (e) => {
      'worklet';
      const maxTop = (count - 1) * slotHeight;
      const raw = startTop.value + e.translationY;
      // Rubber-band slightly past the ends.
      top.value = raw < 0 ? raw * 0.35 : raw > maxTop ? maxTop + (raw - maxTop) * 0.35 : raw;
      const slot = Math.max(0, Math.min(count - 1, Math.round(top.value / slotHeight)));
      if (slot !== positions.value[event.id]) {
        positions.value = moveTo(positions.value, event.id, slot);
        scheduleOnRN(onSwap);
      }
    },
    onFinalize: () => {
      'worklet';
      if (!active.value) return;
      active.value = false;
      lift.value = withSpring(0, SPRING);
      top.value = withSpring((positions.value[event.id] ?? 0) * slotHeight, SPRING);
      scheduleOnRN(onDrop, positions.value);
    },
  });

  const containerStyle = useAnimatedStyle(() => ({
    top: top.value,
    zIndex: active.value ? 100 : 1,
    shadowOpacity: interpolate(lift.value, [0, 1], [0.45, 0.75]),
    shadowRadius: interpolate(lift.value, [0, 1], [10, 22]),
    shadowColor: interpolateColor(lift.value, [0, 1], ['#000000', COLORS.cyan]),
    elevation: active.value ? 18 : 6,
    transform: [
      { scale: interpolate(lift.value, [0, 1], [1, 1.04]) * pop.value },
      { rotateZ: `${interpolate(lift.value, [0, 1], [0, 2])}deg` },
    ],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(lift.value, [0, 1], ['rgba(56,189,248,0)', COLORS.cyan]),
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${flip.value * 180}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${flip.value * 180 + 180}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const cat = CATEGORY_COLORS[event.category];
  const yearBg =
    status === 'correct'
      ? COLORS.emerald
      : status === 'wrong'
        ? COLORS.coral
        : status === 'peek'
          ? COLORS.amber
          : COLORS.ink;
  const tint =
    status === 'correct' ? '#D1FAE5' : status === 'wrong' ? '#FEE2E2' : COLORS.card;
  const edge =
    status === 'correct' ? COLORS.emerald : status === 'wrong' ? COLORS.coral : COLORS.cardEdge;
  const compact = slotHeight < 96;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, { height: slotHeight - CARD_GAP }, containerStyle]}>
        <View style={[styles.card, { backgroundColor: tint, borderBottomColor: edge }]}>
          <Animated.View pointerEvents="none" style={[styles.glow, borderStyle]} />
          <View style={styles.body}>
            <View style={[styles.pill, { backgroundColor: cat.bg }]}>
              <Text style={[styles.pillText, { color: cat.text }]}>{event.category}</Text>
            </View>
            <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : 2}>
              {event.title}
            </Text>
            <Text style={styles.clue} numberOfLines={1}>
              {event.clue}
            </Text>
          </View>
          <View style={styles.right}>
            <View style={styles.badgeWrap}>
              <Animated.View style={[styles.badge, { backgroundColor: COLORS.ink }, frontStyle]}>
                <Text style={styles.badgeQ}>?</Text>
              </Animated.View>
              <Animated.View style={[styles.badge, styles.badgeBack, { backgroundColor: yearBg }, backStyle]}>
                <Text style={styles.badgeYear}>{event.year}</Text>
              </Animated.View>
            </View>
            <GripVertical size={22} color="#94A3B8" strokeWidth={2.5} />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export const TimelineCard = memo(TimelineCardInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    shadowOffset: { width: 0, height: 10 },
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 8,
    borderBottomWidth: 4,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    borderWidth: 2.5,
  },
  body: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  pillText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: COLORS.cardText, fontSize: 17, fontWeight: '800', lineHeight: 21 },
  titleCompact: { fontSize: 15.5, lineHeight: 19 },
  clue: { color: COLORS.cardClue, fontSize: 13, marginTop: 3 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 6 },
  badgeWrap: { width: 54, height: 38, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    height: 38,
    minWidth: 38,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  badgeBack: { minWidth: 54 },
  badgeQ: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  badgeYear: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
});
