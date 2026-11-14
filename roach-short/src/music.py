"""Backing track written in code: an original creepy, curious documentary-style bed in D minor (about 96 BPM) -
a low drone, a plucked music-box arpeggio, a ticking-clock hat and a soft heartbeat kick. It hits on "Big mistake",
goes muffled inside the ear, holds its breath when the oil goes in, and resolves to D major at the hospital.
The number of bars is chosen so the loop is seamless."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(4); BARS = int(round(dur / (4 * 60 / 96))); beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'tick', 'pluck', 'drone', 'major', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.25); f = 40 + 70 * np.exp(-t * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)
    def tick(): t = tt(.03); return hp(rs.randn(len(t)), 5000) * np.exp(-t * 150)
    def pluck(m, d=.6): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 8) + .15 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)) * np.exp(-t * 4.5) * np.minimum(1, t / .003)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .003 * k)) + .3 * np.sin(4 * np.pi * hz(m) * t) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4)
    ARP = [[62, 65, 69, 74, 69, 65, 62, 65], [58, 62, 65, 70, 65, 62, 58, 62], [60, 64, 67, 72, 67, 64, 60, 64], [61, 64, 69, 73, 69, 64, 61, 64]]   # Dm | Bb | C | A
    ROOT = [38, 34, 36, 33]
    for b in range(BARS):
        t0 = b * bar; e = beat / 2
        put('kick', kick(), t0); put('kick', kick(), t0 + .28 * beat, .6); put('kick', kick(), t0 + 2 * beat); put('kick', kick(), t0 + 2.28 * beat, .6)   # heartbeat
        for k in range(4): put('tick', tick(), t0 + k * beat, .6 if k % 2 == 0 else .35)
        for k, m in enumerate(ARP[b % 4]): put('pluck', pluck(m + 12), t0 + k * e, .8 if k == 0 else .5)
        put('drone', pad((ROOT[b % 4], ROOT[b % 4] + 12, ROOT[b % 4] + 19), bar + .3), t0)
        for k, m in enumerate((62, 66, 69, 74, 69, 66, 62, 66)): put('major', pluck(m + 12), t0 + k * e, .6)
    put('major', pad((50, 57, 62, 66), tm(55.39) - tm(47.88)), tm(47.88), .5)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.05, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    inside = win(10.82, 12.83) + win(23.36, 29.73) + win(34.71, 37.07) + win(44.87, 47.88); hold = win(41.58, 47.88, .1, .05); relief = win(47.88, 53.05, .3, .1); flash = win(12.83, 18.54, .2, .2)
    for t0 in (22.35, 26.65, 29.79, 30.7): put('fx', kick() * 1.6, tm(t0)); put('fx', lp(rs.randn(int(1.2 * SR)), 300) * np.exp(-tt(1.2) * 3) * .8, tm(t0))
    RD = tm(22.3) - tm(18.54); r = tt(RD); put('fx', np.sin(2 * np.pi * np.cumsum(110 * 4 ** (r / RD)) / SR) * (r / RD) ** 2 * .35, tm(18.54))
    minor = 1 - np.clip(relief, 0, 1)
    dry = (stems['kick'] * (1 - hold) * (.7 + .3 * inside) + stems['tick'] * (1 - inside) * (1 - hold) * .25 + stems['pluck'] * (1 - .5 * hold) * (1 - .3 * flash) * .32) * minor + stems['drone'] * minor * .3 + stems['major'] * relief * .3 + stems['fx'] * .5
    muff = lp(dry, 500); mix = dry * (1 - np.clip(inside, 0, 1)) + muff * np.clip(inside, 0, 1) * 1.4
    mix = lp(mix, 8000)[:N]; return mix / np.abs(mix).max()
