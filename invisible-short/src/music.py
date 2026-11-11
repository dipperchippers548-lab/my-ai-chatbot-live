"""Backing track written in code: a 14-bar loop that exactly fills the video, with layers that follow the scenes."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9)
    BARS = 14; beat = dur / (BARS * 4); bar = beat * 4          # tempo chosen so the loop is seamless
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('drums', 'bass', 'pluck', 'lead', 'pad')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def pluck(m, d=.32): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 30)) * np.exp(-t * 11) * np.minimum(1, t / .003)
    def bass(m, d): t = tt(d); f = hz(m); x = np.sign(np.sin(2 * np.pi * f * t)) * .6 + np.sin(2 * np.pi * f * t); return lp(x, 500) * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .03)
    def lead(m, d): t = tt(d); f = hz(m) * (1 + .006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .15)); ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sin(ph) + .33 * np.sin(3 * ph) + .2 * np.sin(5 * ph); return x * np.minimum(1, t / .012) * np.minimum(1, (d - t) / .05)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .25) * np.minimum(1, (d - t) / .3)
    def kick(): t = tt(.16); f = 45 + 85 * np.exp(-t * 32); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 20)
    def snare(): t = tt(.12); return (hp(rs.randn(len(t)), 1500) * .6 + np.sin(2 * np.pi * 190 * t) * .5) * np.exp(-t * 32)
    def hat(): t = tt(.035); return hp(rs.randn(len(t)), 7000) * np.exp(-t * 120)
    # A minor: Am | F | Dm | E  (root, chord tones, 4-bar melody in eighths; 0 = rest)
    CH = [(45, (57, 60, 64)), (41, (53, 57, 60)), (50, (57, 62, 65)), (40, (56, 59, 64))]
    MEL = [[76, 0, 72, 69, 0, 72, 76, 0], [72, 0, 69, 65, 0, 69, 72, 0], [74, 0, 77, 74, 0, 72, 69, 0], [71, 0, 68, 71, 76, 0, 80, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2
        for k in (0, 2): put('drums', kick(), t0 + k * beat, .9)
        for k in (1, 3): put('drums', snare(), t0 + k * beat, .35)
        for k in range(8): put('drums', hat(), t0 + k * e, .16 if k % 2 else .28)
        for k, (st, o) in enumerate(((0, 0), (1.5, 0), (2, 0), (3, 12), (3.5, 7))): put('bass', bass(root + o, beat * .42), t0 + st * beat, .8)
        for k in range(8): put('pluck', pluck(tones[(0, 1, 2, 1, 0, 2, 1, 2)[k]] + 12), t0 + k * e, .5)
        if b % 4 >= 2 or b >= 8:
            for k, m in enumerate(MEL[b % 4]):
                if m: put('lead', lead(m, e * (1.9 if k + 1 < 8 and MEL[b % 4][k + 1] == 0 else .95)), t0 + k * e, .42)
    t = np.arange(N + SR) / SR
    def win(a, b, edge=.12): return np.clip((t - a) / edge, 0, 1) * np.clip((b - t) / edge, 0, 1)
    dark = win(tm(14.72), tm(16.41) - .05); thermal = win(tm(29.8), tm(36.5)); sorry = win(tm(36.55), tm(37.85), .08)
    put('pad', pad((33, 40, 45), tm(16.41) - tm(14.72) + .3), tm(14.72) - .1, .4)       # low drone in the dark
    put('pad', pad((50, 57, 62, 65), tm(37.87) - tm(36.55) + .2), tm(36.55) - .05, .7)  # sad chord on "sorry"
    for k, m in enumerate((64, 62, 60, 57)): put('pad', lead(m, .22), tm(36.6) + k * .26, .22)
    g = {'drums': (1 - dark) * (1 - sorry) * (1 - .45 * thermal), 'bass': (1 - dark) * (1 - sorry), 'pluck': (1 - dark) * (1 - sorry) * (1 - .7 * thermal),
         'lead': (1 - dark) * (1 - sorry) * (1 - thermal), 'pad': 1}
    mix = stems['drums'] * g['drums'] * .8 + stems['bass'] * g['bass'] * .55 + stems['pluck'] * g['pluck'] * .5 + stems['lead'] * g['lead'] * .5 + stems['pad'] * .6
    mix = lp(mix, 7000)[:N]
    return mix / np.abs(mix).max()
