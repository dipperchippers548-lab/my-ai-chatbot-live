import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const PALETTE = ['#38BDF8', '#F59E0B', '#10B981', '#F472B6', '#A78BFA', '#FDE047', '#F8FAFC'];
const COUNT = 46;
const DURATION = 1900;

interface Particle {
  vx: number;
  vy: number;
  spin: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
  delay: number;
}

function makeParticles(seed: number): Particle[] {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: COUNT }, () => {
    const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 0.95;
    const speed = 520 + rand() * 620;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (rand() - 0.5) * 1440,
      w: 6 + rand() * 6,
      h: 9 + rand() * 9,
      color: PALETTE[Math.floor(rand() * PALETTE.length)],
      round: rand() > 0.7,
      delay: rand() * 0.08,
    };
  });
}

const Piece = memo(function Piece({
  p,
  progress,
  originX,
  originY,
}: {
  p: Particle;
  progress: SharedValue<number>;
  originX: number;
  originY: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = Math.max(0, progress.value - p.delay) * (DURATION / 1000);
    const gravity = 1500;
    const drag = 1 - Math.min(0.55, t * 0.35);
    return {
      opacity: progress.value < 0.75 ? 1 : Math.max(0, 1 - (progress.value - 0.75) / 0.25),
      transform: [
        { translateX: originX + p.vx * t * drag },
        { translateY: originY + p.vy * t * drag + 0.5 * gravity * t * t },
        { rotateZ: `${p.spin * t}deg` },
        { rotateX: `${p.spin * t * 0.6}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: p.w, height: p.round ? p.w : p.h, borderRadius: p.round ? p.w / 2 : 2, backgroundColor: p.color },
        style,
      ]}
    />
  );
});

interface Props {
  /** Increment to fire a new burst; 0 renders nothing. */
  burstKey: number;
}

/** Lightweight particle confetti driven by a single shared progress value. */
export function ConfettiBurst({ burstKey }: Props) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const particles = useMemo(() => makeParticles(burstKey + 1), [burstKey]);

  useEffect(() => {
    if (burstKey <= 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
  }, [burstKey, progress]);

  if (burstKey <= 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <Piece key={`${burstKey}-${i}`} p={p} progress={progress} originX={width / 2} originY={height * 0.62} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', left: 0, top: 0 },
});
