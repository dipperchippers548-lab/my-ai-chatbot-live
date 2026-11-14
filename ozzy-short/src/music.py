"""Backing track written in code: an original chugging heavy-rock riff in E minor (about 140 BPM) - distorted power
chords, palm-muted eighths, kick/snare and bass. It cuts out for "He bit it.", goes creepy while he realizes, drops to a
thin pulse in the hospital, and comes back for the tour. The number of bars is chosen so the loop is seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = int(round(dur / (4 * 60 / 140))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'snare', 'hat', 'bass', 'gtr', 'pad', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.2); f = 45 + 110 * np.exp(-t * 32); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    def snare(): t = tt(.18); return (hp(rs.randn(len(t)), 1500) * .8 + np.sin(2 * np.pi * 190 * t) * .5) * np.exp(-t * 22)
    def hat(): t = tt(.04); return hp(rs.randn(len(t)), 7000) * np.exp(-t * 110)
    def chord(m, d, mute=False):   # distorted power chord: root, fifth, octave
        t = tt(d); x = sum(2 * ((hz(n) * t * (1 + .003 * k)) % 1) - 1 for k, n in enumerate((m, m + 7, m + 12))) / 3
        x = np.tanh(x * 6) * (np.exp(-t * 18) if mute else np.minimum(1, (d - t) / .03)) * np.minimum(1, t / .003)
        return lp(x, 1400 if mute else 2600)
    def bass(m, d): t = tt(d); return np.tanh(np.sin(2 * np.pi * hz(m) * t) * 2) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .02)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)
    RIFF = [(40, 'm'), (40, 'm'), (43, 'c'), (40, 'm'), (45, 'c'), (40, 'm'), (46, 'c'), (45, 'c')]   # E E G E A E Bb A
    for b in range(BARS):
        t0 = b * bar; e = beat / 2
        for k in (0, 2.5): put('kick', kick(), t0 + k * beat)
        if b % 2: put('kick', kick(), t0 + 3.5 * beat, .7)
        for k in (1, 3): put('snare', snare(), t0 + k * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 == 0 else .3)
        tr = 2 if b % 4 == 3 else 0
        for k, (m, kind) in enumerate(RIFF):
            put('gtr', chord(m + tr, e * (.95 if kind == 'c' else .6), kind == 'm'), t0 + k * e, .9 if kind == 'c' else .7)
            put('bass', bass(m + tr - 12, e * .9), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.05, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    bite = win(25.2, 26.53, .02, .02); creepy = win(26.53, 29.8, .02, .02); calm = win(9.55, 12.95) + win(35.15, 40.9); thin = win(15.39, 22.35, .05, .05); crazy = win(43.53, 48.02)
    put('pad', pad((40, 46, 52), tm(29.8) - tm(26.53)), tm(26.53), .5); put('pad', pad((45, 48, 52), tm(40.9) - tm(37.25)), tm(37.25), .35); put('pad', pad((47, 50, 54), tm(48.02) - tm(43.53)), tm(43.53), .3)
    for t0 in (25.62, 28.59, 29.8, 41.0, 53.15): put('fx', kick() * 1.5, tm(t0)); put('fx', chord(28, .9) * .6, tm(t0))
    full = 1 - np.clip(bite + creepy, 0, 1)
    mix = (stems['kick'] * full * (1 - .7 * calm) * .9 + stems['snare'] * full * (1 - calm) * (1 - .6 * thin) * .4 + stems['hat'] * full * (1 - .5 * calm) * .22
           + stems['bass'] * full * (1 - .5 * calm) * .5 + stems['gtr'] * full * (1 - .85 * calm) * (1 - .5 * thin) * (1 - .4 * crazy) * .42 + stems['pad'] * .5 + stems['fx'] * .5)
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
