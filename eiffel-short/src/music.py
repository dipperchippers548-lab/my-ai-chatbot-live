"""Backing track written in code: a brisk Paris-cafe waltz in A minor (3/4, about 162 BPM) with an accordion-style lead
and oom-pah-pah bass. 24 bars exactly fill the video so it loops; layers follow the con."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = 24; bar = dur / BARS; beat = bar / 3
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('bass', 'chord', 'lead', 'perc', 'pad')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def reed(m, d, det=.006):   # accordion-ish: two detuned reeds
        t = tt(d); f = hz(m); x = sum(2 * ((f * (1 + k * det) * t) % 1) - 1 for k in (-1, 0, 1)) / 3 + .5 * np.sign(np.sin(2 * np.pi * f * t))
        return lp(x, 3200) * np.minimum(1, t / .025) * np.minimum(1, (d - t) / .05) * (1 + .12 * np.sin(2 * np.pi * 5.5 * t))
    def bass(m, d): t = tt(d); f = hz(m); return lp(np.sin(2 * np.pi * f * t) + .4 * (2 * ((f * t) % 1) - 1), 500) * np.minimum(1, t / .005) * np.exp(-t * 5)
    def pizz(m, d=.22): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 18) * np.minimum(1, t / .002)
    def brush(): t = tt(.05); return hp(rs.randn(len(t)), 4000) * np.exp(-t * 70)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .15) * np.minimum(1, (d - t) / .3)
    Am, Dm, E7, C, G, F = (45, (57, 60, 64)), (50, (57, 62, 65)), (40, (56, 59, 62)), (48, (55, 60, 64)), (43, (55, 59, 62)), (41, (57, 60, 65))
    CH = [Am, Dm, E7, Am, Am, Dm, E7, Am, C, G, E7, Am, F, Dm, E7, Am, Am, Dm, E7, Am, C, G, E7, E7]
    MEL = [[76, 72, 69], [77, 74, 69], [76, 71, 68], [69, 72, 76], [81, 76, 72], [77, 81, 74], [80, 76, 71], [69, 0, 0],
           [79, 76, 72], [74, 79, 71], [80, 76, 71], [72, 69, 0], [77, 81, 84], [81, 77, 74], [76, 80, 83], [81, 0, 0]]
    for b in range(BARS):
        root, tones = CH[b]; t0 = b * bar
        put('bass', bass(root, beat * 1.2), t0); put('perc', brush(), t0, .5)
        for k in (1, 2):
            for m in tones: put('chord', pizz(m + 12), t0 + k * beat, .5)
            put('perc', brush(), t0 + k * beat, .25)
        mel = MEL[b % 16] if b < 22 else ([83, 80, 76] if b == 22 else [71, 76, 80])
        for k, m in enumerate(mel):
            if m: put('lead', reed(m, beat * (.95 if (k < 2 and mel[k + 1]) else (3 - k) * .95)), t0 + k * beat)
    t = np.arange(N + SR) / SR
    def win(a, b, edge=.08): return np.clip((t - a) / edge, 0, 1) * np.clip((b - t) / edge, 0, 1)
    secret = win(tm(19.1), tm(20.55), .05); shame = win(tm(25.2), tm(28.05)); cops = win(tm(32.8), tm(34.6)); escape = win(tm(34.6), tm(36.9))
    put('pad', pad((33, 40, 45), tm(20.55) - tm(19.1)), tm(19.1), .5)                              # hush for "in secret"
    put('pad', pad((45, 52, 57, 60), tm(28.05) - tm(25.2)), tm(25.2), .35)                          # the embarrassed dealer
    RD = tm(34.6) - tm(32.8); r = tt(RD)
    for k in range(int(RD / .09)): put('perc', brush(), tm(32.8) + k * .09, .35 * (k * .09 / RD + .3))   # snare-style roll as the police arrive
    put('pad', pad((48, 55, 60, 64, 67), tm(36.9) - tm(34.6)), tm(34.6), .4)                        # bright C major for the escape
    mix = (stems['bass'] * (1 - secret) * .7 + stems['chord'] * (1 - .6 * secret) * (1 - .5 * shame) * .32
           + stems['lead'] * (1 - secret) * (1 - shame) * (1 - cops) * (1 - .5 * escape) * .3 + stems['perc'] * (1 - secret) * .45 + stems['pad'] * .5)
    mix = lp(mix, 7000)[:N]; return mix / np.abs(mix).max()
