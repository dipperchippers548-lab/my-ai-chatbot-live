"""Backing track written in code: an original 80s-style synth-pop groove (A minor, 110 BPM): gated snare, octave
synth bass and brass stabs. 12 bars exactly fill the video so it loops; layers follow the story."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = 12; beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'snare', 'hat', 'bass', 'stab', 'lead', 'pad')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.18); f = 42 + 100 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    def snare(): t = tt(.2); return (hp(rs.randn(len(t)), 900) * .8 + np.sin(2 * np.pi * 185 * t) * .5) * (t < .15) * np.minimum(1, (.15 - t).clip(0) / .01) * (.5 + .5 * np.exp(-t * 12))   # gated
    def hat(): t = tt(.035); return hp(rs.randn(len(t)), 7000) * np.exp(-t * 110)
    def bass(m, d): t = tt(d); f = hz(m); x = (2 * ((f * t) % 1) - 1) + .6 * np.sign(np.sin(2 * np.pi * f * t)); return lp(x, 600) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .02)
    def brass(ms, d): t = tt(d); x = sum(2 * ((hz(m) * t * (1 + .003 * k)) % 1) - 1 for k, m in enumerate(ms)) / len(ms); return lp(x, 2600) * np.minimum(1, t / .015) * np.exp(-t * 4) * np.minimum(1, (d - t) / .03)
    def lead(m, d): t = tt(d); f = hz(m) * (1 + .007 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .12)); ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) + .5 * np.sign(np.sin(ph)) * .4) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .05)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3)
    CH = [(45, (57, 60, 64)), (41, (57, 60, 65)), (43, (55, 59, 62)), (40, (56, 59, 64))]      # Am | F | G | E
    MEL = [[69, 0, 72, 0, 76, 74, 72, 0], [72, 0, 77, 0, 76, 0, 72, 0], [74, 0, 71, 0, 74, 79, 0, 0], [76, 0, 80, 0, 83, 0, 0, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2
        for k in (0, 2): put('kick', kick(), t0 + k * beat); put('kick', kick(), t0 + 2.5 * beat, .5)
        for k in (1, 3): put('snare', snare(), t0 + k * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 else .25)
        for k in range(8): put('bass', bass(root + (12 if k % 2 else 0), e * .8), t0 + k * e)
        for st in (0, 1.5, 3): put('stab', brass([m + 12 for m in tones], beat * .7), t0 + st * beat)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('lead', lead(m, e * (1.9 if k + 1 < 8 and MEL[b % 4][k + 1] == 0 else .95)), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, edge=.08): return np.clip((t - a) / edge, 0, 1) * np.clip((b - t) / edge, 0, 1)
    plan = win(tm(10.4), tm(13.6)); omen = win(tm(16.0), tm(19.7), .05); panic = win(tm(19.7), tm(24.05)); hush = win(tm(24.05), tm(28.9), .05); gift = win(tm(32.4), tm(35.2))
    put('pad', pad((33, 40, 45, 48), tm(19.7) - tm(16.0)), tm(16.0), .6)                           # ominous drone as the sparks fall
    put('pad', pad((45, 52, 57, 60), tm(28.9) - tm(24.3)), tm(24.3), .55)                           # quiet A minor in the hospital
    put('pad', pad((48, 55, 60, 64, 67), tm(35.2) - tm(32.4)), tm(32.4), .45)                       # warm C major for the gift
    mix = (stems['kick'] * (1 - .6 * plan) * (1 - omen) * (1 - hush) * .9 + stems['snare'] * (1 - plan) * (1 - omen) * (1 - hush) * .32
           + stems['hat'] * (1 - omen) * (1 - hush) * (.22 + .2 * panic) + stems['bass'] * (1 - .4 * plan) * (1 - omen) * (1 - hush) * .5
           + stems['stab'] * (1 - plan) * (1 - omen) * (1 - hush) * (1 - .5 * panic) * .3 + stems['lead'] * (1 - plan) * (1 - omen) * (1 - panic) * (1 - hush) * (1 - .4 * gift) * .3) + stems['pad'] * .5
    mix = lp(mix, 7500)[:N]; return mix / np.abs(mix).max()
