"""Backing track written in code: a soft, bouncy lullaby in C major (about 100 BPM) - music box, plucks and a light
kick - that tiptoes along with the town. It stops dead when the town freezes and ends on a suspense chord."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = int(round(dur / (4 * 60 / 100))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    st = {k: np.zeros(N + SR) for k in ('kick', 'tick', 'bass', 'box', 'pluck', 'pad')}
    def put(k, s, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: st[k][i:i + len(s)] += s[:len(st[k]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.15); return np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-t * 35)) / SR) * np.exp(-t * 20)
    def tick(): t = tt(.03); return hp(rs.randn(len(t)), 6000) * np.exp(-t * 140)
    def bass(m, d): t = tt(d); return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 3) * np.minimum(1, t / .01)
    def mbox(m, d=.8): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 4.2 * t) * np.exp(-t * 12)) * np.exp(-t * 4) * np.minimum(1, t / .002)
    def pluck(m, d=.3): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 12)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)
    CH = [(36, (60, 64, 67)), (41, (60, 65, 69)), (43, (59, 62, 67)), (36, (60, 64, 67))]
    MEL = [[76, 0, 79, 0, 76, 74, 72, 0], [77, 0, 81, 0, 79, 77, 76, 0], [74, 0, 79, 0, 77, 76, 74, 0], [72, 0, 76, 79, 84, 0, 0, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2
        for k in (0, 2): put('kick', kick(), t0 + k * beat)
        for k in range(8): put('tick', tick(), t0 + k * e, .5 if k % 2 else .25)
        put('bass', bass(root, beat * 1.8), t0); put('bass', bass(root + 7, beat * 1.8), t0 + 2 * beat)
        for k in range(8): put('pluck', pluck(tones[(0, 1, 2, 1, 0, 2, 1, 2)[k]]), t0 + k * e, .6)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('box', mbox(m + 12), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, e=.05): return np.clip((t - tm(a)) / e, 0, 1) * np.clip((tm(b) - t) / e, 0, 1)
    rules = win(8.03, 11.74); roll = win(11.74, 14.28); night = win(21.77, 23.38); froze = win(23.38, 25.6, .02); scratch = win(25.6, 29.01); end = win(34.66, 40, .02)
    put('pad', pad((48, 55, 60, 63), tm(14.28) - tm(11.74)), tm(11.74), .4); put('pad', pad((45, 52, 57, 60), tm(29.01) - tm(25.6)), tm(25.6), .4)
    put('pad', pad((47, 53, 56, 62), dur - tm(34.66) + .2), tm(34.66), .7)
    off = (1 - froze) * (1 - end) * (1 - roll)
    mix = (st['kick'] * (1 - .6 * rules) * (1 - night) * (1 - scratch) * .7 + st['tick'] * (1 - night) * .18 + st['bass'] * (1 - .6 * night) * .45
           + st['pluck'] * (1 - .5 * night) * (1 - scratch) * .3 + st['box'] * (1 - .4 * rules) * (1 - scratch) * .3) * off + st['pad'] * .5
    mix = lp(mix, 7500)[:N]; return mix / np.abs(mix).max()
