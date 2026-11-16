"""Backing track written in code: a calm, plucky kitchen-tutorial groove (about 105 BPM) for the real tips, which
turns into big epic drums and brass when it escalates (press, rocket, space), cuts to silence for the crash, and
lands on a bright major chord when mom opens it. The number of bars is chosen so the loop is seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(4); BARS = max(1, int(round(dur / (4 * 60 / 105)))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'hat', 'snap', 'pluck', 'bass', 'epic', 'brass', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.22); f = 42 + 90 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13)
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7000) * np.exp(-t * 140)
    def snap(): t = tt(.08); return hp(rs.randn(len(t)), 2000) * np.exp(-t * 45)
    def tom(f=90): t = tt(.5); return np.sin(2 * np.pi * np.cumsum(f * (1 + .5 * np.exp(-t * 20))) / SR) * np.exp(-t * 6) + lp(rs.randn(len(t)), 600) * np.exp(-t * 20) * .5
    def pluck(m, d=.4): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 10)) * np.exp(-t * 7) * np.minimum(1, t / .003)
    def bass(m, d): t = tt(d); return np.sin(2 * np.pi * hz(m) * t) * np.minimum(1, t / .005) * np.exp(-t * 3)
    def brass(ms, d): t = tt(d); x = sum(2 * ((hz(m) * t * (1 + .003 * k)) % 1) - 1 for k, m in enumerate(ms)) / len(ms); return lp(x, 2500) * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .2)
    MEL = [[72, 0, 76, 79, 0, 76, 74, 0], [71, 0, 74, 77, 0, 74, 72, 0], [69, 0, 72, 76, 0, 72, 71, 0], [67, 0, 71, 74, 0, 77, 76, 0]]; RT = [48, 43, 45, 43]
    for b in range(BARS):
        t0 = b * bar; e = beat / 2
        put('kick', kick(), t0); put('kick', kick(), t0 + 2.5 * beat, .7); put('snap', snap(), t0 + beat); put('snap', snap(), t0 + 3 * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .45 if k % 2 else .25)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('pluck', pluck(m), t0 + k * e)
        put('bass', bass(RT[b % 4] - 12, beat * 1.5), t0); put('bass', bass(RT[b % 4] - 12, beat), t0 + 2.5 * beat)
        for k in range(4): put('epic', tom(80 if k % 2 else 110), t0 + k * beat, 1.0 if k == 0 else .7)
        for k in (3.5, 3.75): put('epic', tom(140), t0 + k * beat, .5)
        put('brass', brass([RT[b % 4] + 12, RT[b % 4] + 19, RT[b % 4] + 24], bar * .95), t0)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.05, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    tut = win(0, 23.7, .01, .05); epic = win(23.7, 32.27, .02, .02); quiet = win(32.27, 34.73, .01, .01); end = np.clip((t - tm(34.73)) / .02, 0, 1)
    put('fx', brass([60, 64, 67, 72, 76], 1.6), tm(34.73)); put('fx', kick() * 1.5, tm(34.73))
    for t0 in (24.6, 28.21): put('fx', kick() * 1.6, tm(t0))
    mix = (stems['kick'] + stems['snap'] * .3 + stems['hat'] * .25 + stems['pluck'] * .32 + stems['bass'] * .45) * tut + (stems['epic'] * .6 + stems['brass'] * .3 + stems['hat'] * .2) * epic + stems['fx'] * .55 * (1 - quiet) + stems['fx'] * 0 * end
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
