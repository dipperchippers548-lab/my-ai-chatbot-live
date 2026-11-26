/**
 * Procedural arcade sound engine.
 *
 * Every sound is synthesised in code as 16-bit mono PCM, wrapped in a WAV
 * header, written once to the cache directory and played through
 * `expo-audio` players. No audio assets ship with the app.
 *
 * (`expo-av` was removed from the Expo SDK; `expo-audio` is its official
 * replacement and is what this module uses.)
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const SAMPLE_RATE = 22050;

export type SoundName =
  | 'grab'
  | 'swap'
  | 'drop'
  | 'flip'
  | 'chime0'
  | 'chime1'
  | 'chime2'
  | 'chime3'
  | 'chime4'
  | 'buzzer'
  | 'fanfare'
  | 'tick'
  | 'powerup'
  | 'gameover';

// C5 → D5 → E5 → G5 → C6
const CHIME_FREQS = [523.25, 587.33, 659.25, 783.99, 1046.5] as const;

// ---------------------------------------------------------------------------
// Synthesis primitives
// ---------------------------------------------------------------------------

type Wave = 'sine' | 'square' | 'triangle' | 'saw' | 'noise';

interface ToneSpec {
  freq: number;
  /** Optional end frequency for a linear pitch sweep. */
  freqEnd?: number;
  start: number; // seconds
  duration: number; // seconds
  wave: Wave;
  gain: number;
  attack?: number;
  /** Exponential decay rate; higher = snappier. 0 disables. */
  decay?: number;
  release?: number;
}

function osc(wave: Wave, phase: number, noiseState: { v: number }): number {
  const p = phase - Math.floor(phase);
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'triangle':
      return 1 - 4 * Math.abs(p - 0.5);
    case 'saw':
      return 2 * p - 1;
    case 'noise':
      // Deterministic LCG noise so every build sounds identical.
      noiseState.v = (noiseState.v * 1664525 + 1013904223) >>> 0;
      return noiseState.v / 2147483648 - 1;
  }
}

function render(totalSeconds: number, tones: ToneSpec[]): Float32Array {
  const total = Math.ceil(totalSeconds * SAMPLE_RATE);
  const buf = new Float32Array(total);
  const noiseState = { v: 12345 };
  for (const t of tones) {
    const startIdx = Math.floor(t.start * SAMPLE_RATE);
    const len = Math.floor(t.duration * SAMPLE_RATE);
    const attack = Math.max(1, Math.floor((t.attack ?? 0.004) * SAMPLE_RATE));
    const release = Math.max(1, Math.floor((t.release ?? 0.02) * SAMPLE_RATE));
    let phase = 0;
    for (let i = 0; i < len && startIdx + i < total; i++) {
      const progress = i / len;
      const f = t.freqEnd !== undefined ? t.freq + (t.freqEnd - t.freq) * progress : t.freq;
      phase += f / SAMPLE_RATE;
      let env = 1;
      if (i < attack) env = i / attack;
      if (t.decay) env *= Math.exp((-t.decay * i) / SAMPLE_RATE);
      if (i > len - release) env *= (len - i) / release;
      buf[startIdx + i] += osc(t.wave, phase, noiseState) * env * t.gain;
    }
  }
  // Soft clip to keep stacked tones clean.
  for (let i = 0; i < total; i++) buf[i] = Math.tanh(buf[i] * 1.2) * 0.9;
  return buf;
}

function bell(freq: number, start: number, gain: number, duration = 0.45): ToneSpec[] {
  return [
    { freq, start, duration, wave: 'sine', gain, decay: 7 },
    { freq: freq * 2, start, duration: duration * 0.7, wave: 'sine', gain: gain * 0.35, decay: 11 },
    { freq: freq * 3.01, start, duration: duration * 0.4, wave: 'sine', gain: gain * 0.12, decay: 16 },
  ];
}

const RECIPES: Record<SoundName, () => Float32Array> = {
  grab: () =>
    render(0.07, [
      { freq: 900, freqEnd: 1400, start: 0, duration: 0.05, wave: 'sine', gain: 0.5, decay: 40 },
      { freq: 1, start: 0, duration: 0.012, wave: 'noise', gain: 0.25, decay: 120 },
    ]),
  swap: () =>
    render(0.06, [{ freq: 620, freqEnd: 940, start: 0, duration: 0.05, wave: 'triangle', gain: 0.55, decay: 45 }]),
  drop: () =>
    render(0.09, [
      { freq: 520, freqEnd: 300, start: 0, duration: 0.07, wave: 'sine', gain: 0.6, decay: 35 },
      { freq: 1, start: 0, duration: 0.015, wave: 'noise', gain: 0.2, decay: 150 },
    ]),
  flip: () =>
    render(0.12, [{ freq: 1, start: 0, duration: 0.1, wave: 'noise', gain: 0.18, attack: 0.03, decay: 25 }]),
  chime0: () => render(0.5, bell(CHIME_FREQS[0], 0, 0.55)),
  chime1: () => render(0.5, bell(CHIME_FREQS[1], 0, 0.55)),
  chime2: () => render(0.5, bell(CHIME_FREQS[2], 0, 0.55)),
  chime3: () => render(0.5, bell(CHIME_FREQS[3], 0, 0.55)),
  chime4: () => render(0.6, bell(CHIME_FREQS[4], 0, 0.55, 0.55)),
  buzzer: () =>
    render(0.42, [
      { freq: 110, start: 0, duration: 0.4, wave: 'square', gain: 0.32, attack: 0.005, release: 0.06 },
      { freq: 116.5, start: 0, duration: 0.4, wave: 'saw', gain: 0.28, attack: 0.005, release: 0.06 },
      { freq: 55, start: 0, duration: 0.4, wave: 'sine', gain: 0.35, release: 0.06 },
    ]),
  fanfare: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const tones: ToneSpec[] = [];
    notes.forEach((f, i) => {
      tones.push({ freq: f, start: i * 0.11, duration: 0.16, wave: 'square', gain: 0.16, release: 0.04 });
      tones.push(...bell(f, i * 0.11, 0.3, 0.3));
    });
    // Held major chord with a little shimmer.
    for (const f of [523.25, 659.25, 783.99, 1046.5]) {
      tones.push({ freq: f, start: 0.46, duration: 0.85, wave: 'triangle', gain: 0.18, attack: 0.02, decay: 2.4 });
      tones.push({ freq: f * 1.004, start: 0.46, duration: 0.85, wave: 'square', gain: 0.05, attack: 0.02, decay: 3 });
    }
    tones.push(...bell(2093, 0.46, 0.18, 0.7));
    return render(1.35, tones);
  },
  tick: () => render(0.05, [{ freq: 1800, start: 0, duration: 0.03, wave: 'sine', gain: 0.35, decay: 90 }]),
  powerup: () =>
    render(0.4, [
      { freq: 400, freqEnd: 1600, start: 0, duration: 0.3, wave: 'triangle', gain: 0.35, decay: 4 },
      { freq: 800, freqEnd: 3200, start: 0.05, duration: 0.3, wave: 'sine', gain: 0.18, decay: 6 },
    ]),
  gameover: () =>
    render(1.0, [
      { freq: 392, start: 0, duration: 0.25, wave: 'triangle', gain: 0.4, release: 0.05 },
      { freq: 349.23, start: 0.24, duration: 0.25, wave: 'triangle', gain: 0.4, release: 0.05 },
      { freq: 311.13, start: 0.48, duration: 0.5, wave: 'triangle', gain: 0.4, decay: 2.5 },
      { freq: 155.56, start: 0.48, duration: 0.5, wave: 'square', gain: 0.12, decay: 3 },
    ]),
};

// ---------------------------------------------------------------------------
// WAV encoding
// ---------------------------------------------------------------------------

function encodeWav(samples: Float32Array): Uint8Array {
  const dataLen = samples.length * 2;
  const bytes = new Uint8Array(44 + dataLen);
  const view = new DataView(bytes.buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[offset + i] = s.charCodeAt(i);
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return bytes;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return out;
}

// ---------------------------------------------------------------------------
// Player pool
// ---------------------------------------------------------------------------

/** Rapid-fire sounds get several voices so they can overlap. */
const VOICES: Partial<Record<SoundName, number>> = { swap: 3, grab: 2, tick: 2, flip: 2 };
const VOLUME: Partial<Record<SoundName, number>> = { swap: 0.55, grab: 0.6, tick: 0.45, flip: 0.5 };

const pool = new Map<SoundName, { players: AudioPlayer[]; next: number }>();
let muted = false;
let initPromise: Promise<void> | null = null;
const muteListeners = new Set<(m: boolean) => void>();

async function sourceFor(name: SoundName): Promise<string> {
  const wav = encodeWav(RECIPES[name]());
  if (Platform.OS === 'web') return `data:audio/wav;base64,${toBase64(wav)}`;
  const file = new File(Paths.cache, `chronoclash-sfx-v1-${name}.wav`);
  if (!file.exists) await file.write(wav);
  return file.uri;
}

async function initInternal(): Promise<void> {
  try {
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
  } catch {
    // Audio session config is best-effort.
  }
  const names = Object.keys(RECIPES) as SoundName[];
  for (const name of names) {
    try {
      const uri = await sourceFor(name);
      const voices = VOICES[name] ?? 1;
      const players: AudioPlayer[] = [];
      for (let v = 0; v < voices; v++) {
        const player = createAudioPlayer({ uri });
        player.volume = VOLUME[name] ?? 0.85;
        players.push(player);
      }
      pool.set(name, { players, next: 0 });
    } catch {
      // A single failed sound must never break the game.
    }
  }
}

export const Sound = {
  /** Synthesises + loads every effect. Safe to call repeatedly. */
  init(): Promise<void> {
    if (!initPromise) initPromise = initInternal();
    return initPromise;
  },

  play(name: SoundName): void {
    if (muted) return;
    const entry = pool.get(name);
    if (!entry) return;
    const player = entry.players[entry.next];
    entry.next = (entry.next + 1) % entry.players.length;
    try {
      player.seekTo(0).catch(() => undefined);
      player.play();
    } catch {
      // Ignore transient playback errors (e.g. audio focus lost).
    }
  },

  /** Rising C5 → D5 → E5 → G5 → C6 chime for the n-th consecutive correct card. */
  playChime(step: number): void {
    const idx = Math.max(0, Math.min(4, step));
    Sound.play(`chime${idx}` as SoundName);
  },

  setMuted(value: boolean): void {
    muted = value;
    muteListeners.forEach((l) => l(value));
  },

  isMuted(): boolean {
    return muted;
  },

  subscribeMuted(listener: (m: boolean) => void): () => void {
    muteListeners.add(listener);
    return () => {
      muteListeners.delete(listener);
    };
  },

  release(): void {
    pool.forEach((entry) => entry.players.forEach((p) => p.remove()));
    pool.clear();
    initPromise = null;
  },
};
