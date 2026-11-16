"""Backing track written in code: an original light, bouncy sea-shanty-flavoured groove (6/8 feel, about 120 BPM)
with a plucked melody, accordion-like chords, a soft kick and a tambourine. It turns quiet and moody for the burial
at sea and the deep, comes back for the treasure, and swells warmly at the end. The loop length is chosen to be seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(4); BARS = max(1, int(round(dur / (6 * 60 / 240)))); bar = dur / BARS; e = bar / 6
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'tamb', 'pluck', 'acc', 'bass', 'pad', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.2); f = 45 + 80 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    def tamb(): t = tt(.08); return hp(rs.randn(len(t)), 6000) * np.exp(-t * 40) * (1 + .5 * np.sin(2 * np.pi * 60 * t))
    def pluck(m, d=.45): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t) * np.exp(-t * 10)) * np.exp(-t * 6) * np.minimum(1, t / .003)
    def acc(ms, d): t = tt(d); x = sum((2 * ((hz(m) * t * (1 + .004 * k)) % 1) - 1) for k, m in enumerate(ms)) / len(ms); return lp(x, 1800) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .04) * (1 + .15 * np.sin(2 * np.pi * 5 * t))
    def bass(m, d): t = tt(d); return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 3) * np.minimum(1, t / .005)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .5) * np.minimum(1, (d - t) / .5)
    CH = [(50, (62, 65, 69)), (48, (60, 64, 67)), (46, (58, 62, 65)), (45, (61, 64, 69))]   # Dm | C | Bb | A
    MEL = [[74, 0, 72, 74, 0, 77], [76, 0, 74, 72, 0, 0], [70, 0, 72, 74, 0, 70], [69, 0, 0, 73, 0, 76]]
    for b in range(BARS):
        t0 = b * bar; root, ch = CH[b % 4]
        put('kick', kick(), t0); put('kick', kick(), t0 + 3 * e, .7); put('tamb', tamb(), t0 + 1.5 * e, .6); put('tamb', tamb(), t0 + 4.5 * e, .6)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('pluck', pluck(m), t0 + k * e)
        put('acc', acc(ch, e * 1.8), t0 + e); put('acc', acc(ch, e * 1.8), t0 + 4 * e); put('bass', bass(root - 12, e * 2.5), t0); put('bass', bass(root - 5, e * 2.5), t0 + 3 * e)
    put('pad', pad((38, 45, 50, 53), tm(10.2) - tm(2.7)), tm(2.7), .6); put('pad', pad((50, 57, 62, 66), tm(34.62) - tm(29.95)), tm(29.95), .5)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.05, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    sad = win(2.7, 10.2, .1, .1); deep = win(7.72, 10.2, .05, .1); hmm = win(21.76, 25.25, .1, .1)
    for t0 in (13.86, 18.68, 28.2): put('fx', kick() * 1.3, tm(t0))
    full = 1 - sad
    mix = (stems['kick'] * full * (1 - .5 * hmm) * .7 + stems['tamb'] * full * (1 - hmm) * .3 + stems['pluck'] * (1 - .6 * sad) * .32 + stems['acc'] * full * .22 + stems['bass'] * full * .45 + stems['pad'] * .5 + stems['fx'] * .5)
    mix = mix * (1 - deep) + lp(mix, 500) * deep * 1.3
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
