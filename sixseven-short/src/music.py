"""Backing track written in code: an original bouncy half-time trap beat in F minor (about 143 BPM) with a playful
bell melody and an 808. It stops for "Six." and "Seven.", thins out to explain, scratches to a halt on "banned",
turns into a cheesy organ-and-kazoo version while the teacher tries to be cool, and gets a fanfare for word of the
year. The number of bars is chosen so the loop is seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = int(round(dur / (4 * 60 / 143))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'clap', 'hat', 'bass', 'bell', 'pad', 'corny', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
    def kick(): t = tt(.2); f = 42 + 100 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    def clap(): t = tt(.16); x = hp(rs.randn(len(t)), 1100); e = np.exp(-t * 28) + .6 * np.exp(-np.maximum(0, t - .012) * 40) * (t > .012) + .5 * np.exp(-np.maximum(0, t - .024) * 40) * (t > .024); return x * e
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7500) * np.exp(-t * 130)
    def b808(m0, d, m1=None): t = tt(d); f0 = hz(m0); f1 = hz(m1) if m1 else f0; f = f0 + (f1 - f0) * np.clip(t / .12, 0, 1); x = np.sin(2 * np.pi * np.cumsum(f) / SR); return np.tanh(x * 1.6) * np.minimum(1, t / .004) * np.exp(-t * 1.6) * np.minimum(1, (d - t) / .03)
    def bellv(m, d=.5): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 16)) * np.exp(-t * 5) * np.minimum(1, t / .002)
    def organ(m, d): t = tt(d); f = hz(m); x = sum(np.sign(np.sin(2 * np.pi * f * k * t)) / k for k in (1, 2, 4)); return lp(x, 2500) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .03)
    def kazoo(m, d): t = tt(d); f = hz(m) * (1 + .02 * np.sin(2 * np.pi * 6 * t)); x = 2 * ((np.cumsum(f) / SR) % 1) - 1; return bp(x, 400, 2200) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .04)
    def brass(ms, d): t = tt(d); x = sum(2 * ((hz(m) * t * (1 + .004 * k)) % 1) - 1 for k, m in enumerate(ms)) / len(ms); return lp(x, 3000) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .15)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3)
    CH = [(41, (65, 68, 72)), (37, (65, 68, 73)), (39, (67, 70, 75)), (36, (64, 67, 72))]      # Fm | Db | Eb | C
    MEL = [[77, 0, 80, 77, 0, 72, 75, 77], [80, 0, 77, 0, 73, 0, 72, 0], [79, 0, 82, 79, 0, 75, 77, 79], [76, 0, 79, 0, 84, 0, 0, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2; s = beat / 4
        for st in (0, 1.5, 2.75): put('kick', kick(), t0 + st * beat)
        put('clap', clap(), t0 + 2 * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 else .3)
        if b % 2: [put('hat', hat(), t0 + 3 * beat + k * s / 2, .35) for k in range(8)]                 # rolls
        put('bass', b808(root - 12, beat * 1.45), t0); put('bass', b808(root - 12, beat * .95, root - 5 if b % 4 == 3 else None), t0 + 1.5 * beat); put('bass', b808(root - 12, beat * 1.2), t0 + 2.75 * beat)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('bell', bellv(m), t0 + k * e)
        # the cheesy version, used only while the teacher tries to be cool
        maj = {41: (65, 69, 72), 37: (65, 70, 74), 39: (67, 70, 74), 36: (64, 67, 72)}[root]
        for k in range(4): put('corny', organ(root - (0 if k % 2 else 12) + 12, beat * .45), t0 + k * beat, .5) if k % 2 == 0 else [put('corny', organ(m, beat * .4), t0 + k * beat, .25) for m in maj]
        for k, m in enumerate(MEL[b % 4]):
            if m: put('corny', kazoo(m + (1 if (m - 41) % 12 in (3, 8) else 0), e * .9), t0 + k * e, .45)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.05, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    digits = win(5.16, 7.63, .02); explain = win(7.63, 10.07) + win(29.71, 32.06); vinyl = win(10.07, 16.96); drop = win(27.0, 28.13, .02, .01)
    tense = win(33.77, 37.77, .05, .01); page = win(39.93, 41.8, .02); banned = win(43.09, 44.96, .01); corny = win(44.96, 48.9, .02); roll = win(48.9, 50.55, .05, .01); nodef = win(52.54, 55.14)
    for t0 in (5.16, 6.41): put('fx', np.tanh(np.sin(2 * np.pi * np.cumsum(hz(29) + 60 * np.exp(-tt(1.1) * 9)) / SR) * 2) * np.exp(-tt(1.1) * 2.5), tm(t0), .9); put('fx', kick() * 1.3, tm(t0))
    put('pad', pad((53, 56, 60), tm(10.07) - tm(7.63)), tm(7.63), .35); put('pad', pad((53, 56, 60, 65), tm(37.77) - tm(33.77)), tm(33.77), .3)
    put('fx', kick() * 1.4, tm(28.13)); put('fx', kick() * 1.4, tm(37.77)); put('fx', kick() * 1.4, tm(41.8))
    for k, m in enumerate((77, 80, 84, 89)): put('fx', bellv(m, .6), tm(40.45) + k * .06, .7)
    RD = tm(33.2) - tm(32.06); r = tt(RD); put('fx', np.sin(2 * np.pi * np.cumsum(220 * 4 ** (r / RD)) / SR) * (r / RD) ** 2 * .6, tm(32.06))
    put('fx', brass((65, 69, 72, 77), 1.4), tm(50.55), .8); put('fx', brass((60, 65, 69), .25), tm(50.38), .5)
    put('pad', pad((53, 56, 60), tm(55.14) - tm(52.54)), tm(52.54), .3); put('pad', pad((41, 48, 53), tm(44.96) - tm(43.2)), tm(43.2), .35)
    full = 1 - np.clip(digits + explain * .0 + banned + corny + nodef, 0, 1)
    vinylF = lp(stems['bell'], 1800)
    mix = (stems['kick'] * full * (1 - explain) * (1 - drop) * (1 - .8 * tense) * (1 - roll) * (1 - page) * .9
           + stems['clap'] * full * (1 - explain) * (1 - drop) * (1 - tense) * (1 - roll) * (1 - page) * .38
           + stems['hat'] * full * (1 - drop) * (1 - .5 * explain) * (1 - roll) * (.24 + .1 * tense)
           + stems['bass'] * full * (1 - .5 * explain) * (1 - drop) * (1 - .4 * tense) * (1 - roll) * .55
           + (stems['bell'] * (1 - vinyl) + vinylF * vinyl) * full * (1 - drop) * (1 - tense) * (1 - roll) * .28
           + stems['corny'] * corny * .32 + stems['pad'] * .45 + stems['fx'] * .55)
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
