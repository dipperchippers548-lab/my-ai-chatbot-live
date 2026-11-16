"""Backing track written in code: an original curious documentary bed (about 100 BPM). A plucky science groove for
the explanation with a tense minor pulse when the burn hits, hits on the big moments, muffled inside the body, and a
quiet, serious pad (no drums) for the ending. The number of bars is chosen so the loop is seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(4); BARS = int(round(dur / (4 * 60 / 100))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'hat', 'clap', 'minor', 'major', 'bass', 'pad', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.22); f = 42 + 90 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13)
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7000) * np.exp(-t * 140)
    def clap(): t = tt(.12); return hp(rs.randn(len(t)), 1500) * np.exp(-t * 30)
    def pluck(m, d=.5): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9)) * np.exp(-t * 6) * np.minimum(1, t / .003)
    def bass(m, d): t = tt(d); return np.sin(2 * np.pi * hz(m) * t) * np.minimum(1, t / .005) * np.exp(-t * 2.5)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .003 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4)
    MIN = [[62, 65, 69, 65], [58, 62, 65, 62], [60, 64, 67, 64], [61, 64, 69, 64]]; MINR = [38, 34, 36, 33]
    MAJ = [[72, 76, 79, 76, 84, 79, 76, 79], [69, 72, 76, 72, 81, 76, 72, 76], [65, 69, 72, 69, 77, 72, 69, 72], [67, 71, 74, 71, 79, 74, 71, 74]]; MAJR = [36, 33, 29, 31]
    for b in range(BARS):
        t0 = b * bar; e = beat / 2
        for k in (0, 2): put('kick', kick(), t0 + k * beat)
        put('kick', kick(), t0 + 2.75 * beat, .5); put('clap', clap(), t0 + beat); put('clap', clap(), t0 + 3 * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 else .3)
        for k, m in enumerate(MIN[b % 4]): put('minor', pluck(m, .8), t0 + k * beat)
        put('minor', pad((MINR[b % 4] + 12, MINR[b % 4] + 19), bar), t0, .5)
        for k, m in enumerate(MAJ[b % 4]): put('major', pluck(m), t0 + k * e, .8 if k % 2 == 0 else .5)
        put('bass', bass(MAJR[b % 4], beat * 1.4), t0); put('bass', bass(MAJR[b % 4], beat * .9), t0 + 1.5 * beat); put('bass', bass(MAJR[b % 4] + 7, beat), t0 + 2.5 * beat)
    put('pad', pad((45, 52, 57, 60), tm(53.80) - tm(47.2)), tm(47.2), .6)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.05, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    cutw = np.clip(win(2.4, 8.4, .05, .05) + win(21.35, 27.7, .05, .05) + win(37.0, 44.9, .05, .05), 0, 1); cells = win(5.95, 8.4, .2, .2) + win(14.6, 21.35, .2, .2) + win(29.45, 31.6, .1, .1) + win(33.15, 37.0, .1, .1); weak = win(44.9, 47.2, .2, .2); scar = win(47.2, 53.80, .3, .01)
    for t0 in (1.84, 4.87, 9.47, 13.55, 39.5): put('fx', kick() * 1.4, tm(t0)); put('fx', clap() * .8, tm(t0))
    sci = 1 - cutw
    dry = (stems['kick'] * (1 - scar) * .8 + stems['clap'] * sci * (1 - scar) * .25 + stems['hat'] * (1 - scar) * .22 + stems['minor'] * cutw * .35
           + stems['major'] * sci * (1 - .5 * weak) * (1 - scar) * .3 + stems['bass'] * sci * (1 - scar) * .4 + stems['pad'] * .5 + stems['fx'] * .5)
    mix = dry * (1 - cells) + lp(dry, 600) * cells * 1.4
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
