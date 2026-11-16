"""Backing track written in code: an original low, tense documentary underscore (about 90 BPM, D minor) that never
goes silent - a soft pulse, a low drone, sparse plucks and a ticking hat, swelling a little at each strike and
warming up at the end. The number of bars is chosen so the loop is seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(4); BARS = max(1, int(round(dur / (4 * 60 / 90)))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    st = {k: np.zeros(N + SR) for k in ('kick', 'tick', 'pluck', 'drone', 'warm', 'fx')}
    def put(k, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: st[k][i:i + len(sig)] += sig[:len(st[k]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.3); f = 40 + 60 * np.exp(-t * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
    def tick(): t = tt(.03); return hp(rs.randn(len(t)), 6000) * np.exp(-t * 140)
    def pluck(m, d=.9): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 8)) * np.exp(-t * 4) * np.minimum(1, t / .003)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .003 * k)) + .25 * np.sin(4 * np.pi * hz(m) * t) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .5) * np.minimum(1, (d - t) / .5)
    ROOT = [38, 34, 36, 33]; ARP = [[62, 65, 69, 65], [58, 62, 65, 62], [60, 64, 67, 64], [57, 61, 64, 61]]
    for b in range(BARS):
        t0 = b * bar; r = ROOT[b % 4]
        put('kick', kick(), t0); put('kick', kick(), t0 + 2 * beat, .7)
        for k in range(8): put('tick', tick(), t0 + k * beat / 2, .5 if k % 2 == 0 else .25)
        for k, m in enumerate(ARP[b % 4]): put('pluck', pluck(m + 12), t0 + k * beat, .8 if k == 0 else .5)
        put('drone', pad((r, r + 7, r + 12), bar + .4), t0)
    put('warm', pad((50, 57, 62, 66), tm(34.51) - tm(29.95)), tm(29.95), .7)
    for s in (2.62, 10.09, 13.53, 16.29, 21.77, 23.21, 25.7): put('fx', kick() * 1.5, tm(s)); put('fx', lp(rs.randn(int(1.4 * SR)), 200) * np.exp(-tt(1.4) * 2.5) * .8, tm(s))
    t = np.arange(N + SR) / SR; end = np.clip((t - tm(29.95)) / .5, 0, 1)
    mix = (st['kick'] * .7 + st['tick'] * .2 + st['pluck'] * .28 * (1 - .5 * end) + st['drone'] * .32 * (1 - end) + st['warm'] * .45 + st['fx'] * .5)
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
