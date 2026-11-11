"""Backing track written in code: an urgent, driving E-minor groove (134 BPM) that builds as the bladder fills,
cuts out at the release, and loops cleanly (16 bars exactly fill the video)."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = 16; beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'clap', 'hat', 'hat2', 'bass', 'arp', 'lead', 'pad')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.16); f = 45 + 95 * np.exp(-t * 34); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 19)
    def clap(): t = tt(.11); return hp(rs.randn(len(t)), 1200) * np.exp(-t * 34) * (1 + .6 * (np.sin(2 * np.pi * 70 * t) > 0))
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7500) * np.exp(-t * 130)
    def bass(m, d): t = tt(d); f = hz(m); x = 2 * ((f * t) % 1) - 1; return lp(x, 700) * np.minimum(1, t / .004) * np.exp(-t * 7)
    def pluck(m, d=.2): t = tt(d); f = hz(m); return (np.sign(np.sin(2 * np.pi * f * t)) * .35 + np.sin(2 * np.pi * f * t)) * np.exp(-t * 20) * np.minimum(1, t / .002)
    def lead(m, d): t = tt(d); f = hz(m) * (1 + .006 * np.sin(2 * np.pi * 6 * t) * np.minimum(1, t / .1)); ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph)) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .04)
    def pad(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / .15) * np.minimum(1, (d - t) / .3)
    CH = [(40, (64, 67, 71)), (36, (64, 67, 72)), (45, (64, 69, 72)), (47, (63, 66, 71))]      # Em | C | Am | B
    MEL = [[76, 0, 79, 76, 0, 74, 76, 0], [79, 0, 76, 72, 0, 76, 79, 0], [81, 0, 76, 72, 0, 76, 81, 0], [78, 0, 75, 78, 83, 0, 87, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2; s = beat / 4
        for k in range(4): put('kick', kick(), t0 + k * beat)
        for k in (1, 3): put('clap', clap(), t0 + k * beat)
        for k in range(4): put('hat', hat(), t0 + k * beat + e)
        for k in range(16): put('hat2', hat(), t0 + k * s, .5 if k % 4 else .2)
        for k in range(8): put('bass', bass(root + (12 if k in (3, 6) else 0), e * .9), t0 + k * e)
        for k in range(8): put('arp', pluck(tones[(0, 1, 2, 1, 2, 0, 1, 2)[k]] + (12 if k % 4 == 2 else 0)), t0 + k * e, .8 if k % 2 == 0 else .55)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('lead', lead(m, e * (1.9 if k + 1 < 8 and MEL[b % 4][k + 1] == 0 else .95)), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, edge=.08): return np.clip((t - a) / edge, 0, 1) * np.clip((b - t) / edge, 0, 1)
    explain = win(tm(5.05), tm(14.0)); sneak = win(tm(17.35), tm(20.0)); dark = win(tm(20.0), tm(22.9)); alarm = win(tm(22.9), tm(33.68), .05)
    relief = win(tm(33.68), tm(35.5), .03); sorry = win(tm(39.24), tm(40.5), .05); off = (1 - relief) * (1 - sorry)
    build = np.clip((t - tm(22.9)) / (tm(33.68) - tm(22.9)), 0, 1) * alarm                         # 0 -> 1 as the pressure rises
    RD = tm(33.68) - tm(29.9); r = tt(RD); riser = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (r / RD)) / SR) * (r / RD) ** 2; put('pad', riser, tm(29.9), .5)
    put('pad', pad((28, 35, 40), tm(22.9) - tm(20.0)), tm(20.0), .55)                               # low drone for the muscle you don't control
    put('pad', pad((52, 56, 59, 64), tm(35.5) - tm(33.68)), tm(33.68) + .05, .7)                    # relieved E major
    put('pad', pad((45, 52, 57, 60), tm(40.53) - tm(39.24) + .1), tm(39.24), .7)                    # sad chord on "sorry"
    for k, m in enumerate((64, 60, 57, 52)): put('pad', lead(m, .2), tm(39.3) + k * .2, .2)
    mix = (stems['kick'] * (1 - .5 * explain) * (1 - sneak) * (1 - dark) * .9 + stems['clap'] * (1 - explain) * (1 - sneak) * (1 - dark) * .3
           + stems['hat'] * (1 - dark) * .22 + stems['hat2'] * build * .22
           + stems['bass'] * (1 - .35 * explain) * (1 - .6 * dark) * (.5 + .2 * build)
           + stems['arp'] * (1 - sneak) * (1 - dark) * .32 + stems['lead'] * (1 - explain) * (1 - sneak) * (1 - dark) * (1 - .5 * alarm) * .3) * off + stems['pad'] * .5
    mix = lp(mix, 7500)[:N]; return mix / np.abs(mix).max()
