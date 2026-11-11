"""Backing track written in code: a bright, bouncy adventure tune (C major, about 126 BPM).
14 bars exactly fill the video (C G Am F x3, then F G so the loop resolves back to C); layers follow the flight."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = 14; beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'snare', 'hat', 'bass', 'pluck', 'lead', 'pad')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.16); f = 46 + 90 * np.exp(-t * 32); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 20)
    def snare(): t = tt(.12); return (hp(rs.randn(len(t)), 1400) * .7 + np.sin(2 * np.pi * 200 * t) * .4) * np.exp(-t * 30)
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7500) * np.exp(-t * 130)
    def bass(m, d): t = tt(d); f = hz(m); return lp(np.sin(2 * np.pi * f * t) + .5 * (2 * ((f * t) % 1) - 1), 550) * np.minimum(1, t / .004) * np.exp(-t * 6)
    def pluck(m, d=.24): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t) + .2 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 15) * np.minimum(1, t / .002)
    def lead(m, d): t = tt(d); f = hz(m) * (1 + .007 * np.sin(2 * np.pi * 6 * t) * np.minimum(1, t / .1)); ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) + .3 * np.sin(2 * ph) + .12 * np.sin(3 * ph)) * np.minimum(1, t / .012) * np.minimum(1, (d - t) / .05)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .15) * np.minimum(1, (d - t) / .3)
    C_, G_, A_, F_ = (36, (60, 64, 67)), (43, (59, 62, 67)), (45, (60, 64, 69)), (41, (60, 65, 69))
    CH = [C_, G_, A_, F_] * 3 + [F_, G_]
    M = {id(C_): [76, 0, 79, 0, 84, 0, 79, 76], id(G_): [74, 0, 79, 0, 83, 0, 79, 0], id(A_): [76, 0, 81, 0, 84, 81, 76, 0], id(F_): [77, 0, 81, 0, 84, 0, 81, 77]}
    for b in range(BARS):
        root, tones = CH[b]; t0 = b * bar; e = beat / 2
        for k in (0, 2): put('kick', kick(), t0 + k * beat); put('kick', kick(), t0 + 1.5 * beat, .45)
        for k in (1, 3): put('snare', snare(), t0 + k * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 else .25)
        for k, (st, o) in enumerate(((0, 0), (1, 12), (1.5, 7), (2, 0), (3, 12), (3.5, 7))): put('bass', bass(root + o, beat * .45), t0 + st * beat)
        for k in range(8): put('pluck', pluck(tones[(0, 1, 2, 1, 2, 1, 0, 2)[k]] + 12), t0 + k * e, .8 if k % 2 == 0 else .5)
        mel = M[id(CH[b])] if b < 12 else ([81, 0, 84, 0, 86, 0, 84, 0] if b == 12 else [83, 0, 86, 0, 88, 86, 84, 83])
        for k, m in enumerate(mel):
            if m: put('lead', lead(m, e * (1.9 if k + 1 < 8 and mel[k + 1] == 0 else .95)), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, edge=.08): return np.clip((t - a) / edge, 0, 1) * np.clip((b - t) / edge, 0, 1)
    prep = win(tm(5.85), tm(17.55)); uhoh = win(tm(22.6), tm(26.1)); lost = win(tm(29.26), tm(30.5), .04); fine = win(tm(33.7), tm(35.5), .04)
    RD = tm(17.9) - tm(16.4); r = tt(RD); put('pad', np.sin(2 * np.pi * np.cumsum(260 * 3 ** (r / RD)) / SR) * (r / RD) ** 2, tm(16.4), .45)   # riser into take-off
    put('pad', pad((38, 45, 50, 53), tm(26.1) - tm(22.6)), tm(22.6), .4)                              # suspense while the pilots stare
    for k, m in enumerate((79, 76, 72, 67, 64)): put('pad', lead(m, .17), tm(29.3) + k * .15, .22)     # the gun falls
    put('pad', pad((45, 52, 57, 60), tm(35.5) - tm(33.7)), tm(33.7), .6)                               # the fine
    off = (1 - lost) * (1 - fine)
    mix = (stems['kick'] * (1 - .55 * prep) * (1 - uhoh) * .9 + stems['snare'] * (1 - prep) * (1 - uhoh) * .3 + stems['hat'] * (.22 + .1 * uhoh)
           + stems['bass'] * (1 - .3 * prep) * (1 - .5 * uhoh) * .55 + stems['pluck'] * (1 - uhoh) * .32 + stems['lead'] * (1 - prep) * (1 - uhoh) * .3) * off + stems['pad'] * .5
    mix = lp(mix, 7500)[:N]; return mix / np.abs(mix).max()
