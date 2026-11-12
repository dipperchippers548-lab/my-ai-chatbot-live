"""Backing track written in code: a curious, plucky documentary groove in D minor (about 104 BPM) - pizzicato,
light percussion, soft bass - that turns tense for the break-ups and the tank, and resolves to D major at the end."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = int(round(dur / (4 * 60 / 104))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    st = {k: np.zeros(N + SR) for k in ('kick', 'hat', 'bass', 'pizz', 'bell', 'pad')}
    def put(k, s, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: st[k][i:i + len(s)] += s[:len(st[k]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.15); return np.sin(2 * np.pi * np.cumsum(48 + 80 * np.exp(-t * 34)) / SR) * np.exp(-t * 20)
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7000) * np.exp(-t * 130)
    def bass(m, d): t = tt(d); return lp(np.sin(2 * np.pi * hz(m) * t) + .3 * np.sign(np.sin(2 * np.pi * hz(m) * t)), 600) * np.exp(-t * 4) * np.minimum(1, t / .005)
    def pizz(m, d=.25): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t) * np.exp(-t * 20)) * np.exp(-t * 14) * np.minimum(1, t / .002)
    def bell(m, d=.6): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 8)) * np.exp(-t * 5)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)
    CH = [(38, (62, 65, 69)), (34, (62, 65, 70)), (36, (60, 64, 67)), (33, (61, 64, 69))]
    MEL = [[74, 0, 77, 76, 74, 0, 69, 0], [74, 0, 77, 79, 77, 0, 74, 0], [76, 0, 79, 77, 76, 0, 72, 0], [73, 0, 76, 0, 81, 0, 0, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2
        for k in (0, 2.5): put('kick', kick(), t0 + k * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 else .25)
        for k in (0, 2): put('bass', bass(root, beat * 1.6), t0 + k * beat)
        for k in range(8): put('pizz', pizz(tones[(0, 2, 1, 2, 0, 2, 1, 2)[k]]), t0 + k * e, .7 if k % 2 == 0 else .45)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('bell', bell(m + 12), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, e=.06): return np.clip((t - tm(a)) / e, 0, 1) * np.clip((tm(b) - t) / e, 0, 1)
    crash1 = win(4.9, 6.87); crash2 = win(18.1, 21.29); tank = win(21.29, 31.87); finale = win(42.1, 60)
    put('pad', pad((38, 45, 50, 53), tm(6.87) - tm(4.9)), tm(4.9), .5); put('pad', pad((38, 44, 50, 53), tm(21.29) - tm(18.1)), tm(18.1), .5)
    put('pad', pad((38, 45, 50, 53, 57), tm(31.87) - tm(21.29)), tm(21.29), .25); put('pad', pad((50, 54, 57, 62, 66), dur - tm(42.1) + .2), tm(42.1), .4)
    off = (1 - crash1) * (1 - crash2)
    mix = (st['kick'] * (1 - .5 * tank) * .7 + st['hat'] * .2 + st['bass'] * .5 + st['pizz'] * (1 - .3 * tank) * .3 + st['bell'] * (1 - tank) * (1 - .5 * finale) * .25) * off + st['pad'] * .5
    mix = lp(mix, 7500)[:N]; return mix / np.abs(mix).max()
