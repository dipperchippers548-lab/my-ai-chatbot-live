"""Backing track written in code: a bouncy farm tune (G major, boom-chick bass, banjo-style plucks, whistle lead).
12 bars exactly fill the video so it loops; layers follow the scenes."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = 12; beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('drums', 'bass', 'pluck', 'lead', 'pad')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def banjo(m, d=.26): t = tt(d); f = hz(m); x = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3, 4, 5)); return x * np.exp(-t * 16) * np.minimum(1, t / .002)
    def bass(m, d): t = tt(d); f = hz(m); return lp(np.sin(2 * np.pi * f * t) + .5 * np.sign(np.sin(2 * np.pi * f * t)), 450) * np.minimum(1, t / .005) * np.exp(-t * 5)
    def whistle(m, d): t = tt(d); f = hz(m) * (1 + .008 * np.sin(2 * np.pi * 6 * t) * np.minimum(1, t / .12)); ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) + .12 * np.sin(2 * ph)) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .05)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3)
    def kick(): t = tt(.15); f = 48 + 80 * np.exp(-t * 34); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    def brush(): t = tt(.07); return hp(rs.randn(len(t)), 3000) * np.exp(-t * 55)
    CH = [(43, (55, 59, 62)), (48, (55, 60, 64)), (50, (57, 62, 66)), (43, (55, 59, 62))]   # G | C | D | G
    MEL = [[79, 0, 76, 74, 71, 0, 74, 0], [76, 0, 72, 76, 79, 0, 76, 0], [78, 0, 74, 78, 81, 0, 78, 74], [79, 0, 74, 71, 67, 0, 0, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2
        for k in (0, 2): put('drums', kick(), t0 + k * beat, .8); put('bass', bass(root + (7 if k else 0), beat * .9), t0 + k * beat, .9)
        for k in (1, 3): put('drums', brush(), t0 + k * beat, .5)
        for k in range(8): put('drums', brush(), t0 + k * e, .1); put('pluck', banjo(tones[(0, 2, 1, 2, 0, 2, 1, 2)[k]] + 12), t0 + k * e, .5 if k % 2 else .32)
        if b % 4 >= 2 or b >= 4:
            for k, m in enumerate(MEL[b % 4]):
                if m: put('lead', whistle(m, e * (1.9 if k + 1 < 8 and MEL[b % 4][k + 1] == 0 else .95)), t0 + k * e, .4)
    t = np.arange(N + SR) / SR
    def win(a, b, edge=.1): return np.clip((t - a) / edge, 0, 1) * np.clip((b - t) / edge, 0, 1)
    think = win(tm(8.3), tm(13.85)); night = win(tm(28.5), tm(31.84) - .03, .08); sorry = win(tm(31.84), tm(33.1), .06)
    put('pad', pad((43, 50, 58), tm(31.5) - tm(28.5)), tm(28.5), .5)                      # uneasy G minor at the motel
    put('pad', pad((45, 52, 57, 60), tm(33.14) - tm(31.84) + .15), tm(31.84) - .03, .7)   # sad chord on "sorry"
    for k, m in enumerate((67, 64, 60, 57)): put('pad', whistle(m, .2), tm(31.9) + k * .22, .2)
    off = (1 - night) * (1 - sorry)
    mix = stems['drums'] * off * (1 - .7 * think) * .8 + stems['bass'] * off * (1 - .3 * think) * .6 + stems['pluck'] * off * .5 + stems['lead'] * off * (1 - think) * .45 + stems['pad'] * .6
    mix = lp(mix, 7000)[:N]; return mix / np.abs(mix).max()
