"""Original backing track written in code (times are final seconds via F()):
A  plucky, upbeat groove while he rides (about 112 BPM)            0 .. "But it's way worse"
-  tape-stop
B  tense minor pulse with ticking hats while the wheel nears the crack
C  slow-motion: muffled low drone + slow heartbeat sub, hits on the impact and the slam
D  serious minor pad + soft plucks for the hospital
E  a warm major lift when the helmet lands"""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def make_music(dur, F):
    N = int(dur * SR); t = np.arange(N) / SR; rs = np.random.RandomState(4); out = np.zeros(N)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    def put(sig, at, g=1.0):
        i = int(at * SR)
        if 0 <= i < N: out[i:i + len(sig)] += sig[:N - i] * g
    def win(a, b, e0=.05, e1=.05): return np.clip((t - a) / e0, 0, 1) * np.clip((b - t) / e1, 0, 1)
    def kick(): x = tt(.22); return np.sin(2 * np.pi * np.cumsum(42 + 90 * np.exp(-x * 28)) / SR) * np.exp(-x * 13)
    def hat(): x = tt(.03); return hp(rs.randn(len(x)), 7000) * np.exp(-x * 140)
    def clap(): x = tt(.12); return hp(rs.randn(len(x)), 1500) * np.exp(-x * 30)
    def pluck(m, d=.4): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .35 * np.sin(4 * np.pi * f * x) * np.exp(-x * 9)) * np.exp(-x * 7) * np.minimum(1, x / .003)
    def bass(m, d): x = tt(d); return np.sin(2 * np.pi * hz(m) * x) * np.minimum(1, x / .005) * np.exp(-x * 2.5)
    def pad(ms, d): x = tt(d); return sum(np.sin(2 * np.pi * hz(m) * x * (1 + .003 * k)) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, x / .4) * np.minimum(1, np.maximum(0, d - x) / .4)
    def hit(at, g=1.0): x = tt(1.8); put((np.sin(2 * np.pi * (36 + 70 * np.exp(-x * 9)) * x) * np.exp(-x * 2.2) + hp(rs.randn(len(x)), 3000) * np.exp(-x * 6) * .2) * g, at)
    WORSE, IMP, SLAM, HOSP, HEL = F(8.8), F(16.85), F(35.1), F(37.0), F(44.55)
    # A: groove
    beat = 60 / 112; bar = 4 * beat; A = np.zeros(N); MAJ = [[72, 76, 79, 76, 84, 79, 76, 79], [69, 72, 76, 72, 81, 76, 72, 76], [65, 69, 72, 69, 77, 72, 69, 72], [67, 71, 74, 71, 79, 74, 71, 74]]; ROOT = [36, 33, 29, 31]
    b = 0
    while b * bar < WORSE:
        t0 = b * bar; e = beat / 2
        for k in (0, 2): put(kick(), t0 + k * beat, .8)
        put(clap(), t0 + beat, .3); put(clap(), t0 + 3 * beat, .3)
        for k in range(8): put(hat(), t0 + k * e, .25)
        for k, m in enumerate(MAJ[b % 4]): put(pluck(m), t0 + k * e, .35 if k % 2 == 0 else .22)
        put(bass(ROOT[b % 4], beat * 1.4), t0, .5); put(bass(ROOT[b % 4] + 7, beat), t0 + 2.5 * beat, .4); b += 1
    # tape-stop: the groove pitches down over .45 s
    i0 = int(WORSE * SR); seg = out[max(0, i0 - int(.45 * SR)):i0].copy(); n = len(seg)
    if n: idx = np.cumsum(np.linspace(1, .05, n)); idx = idx / idx[-1] * (n - 1); out[i0 - n:i0] = np.interp(idx, np.arange(n), seg) * np.linspace(1, .2, n)
    out[i0:] = 0
    # B: tense pulse
    beatB = 60 / 120; k = WORSE + .1; i = 0
    while k < IMP:
        put(bass(26, .35), k, .6); put(hat(), k + beatB / 2, .3); put(pluck([62, 65, 61, 65][i % 4] + 12, .3), k, .18); k += beatB; i += 1
    put(pad((50, 53, 57), IMP - WORSE), WORSE, .25)
    # C: slow motion - muffled drone and a slow heartbeat sub
    C = np.zeros(N); d = SLAM - IMP + 1.5
    x = tt(d); drone = (2 * ((x * hz(26)) % 1) - 1 + 2 * ((x * hz(26) * 1.004) % 1) - 1 + .6 * (2 * ((x * hz(33)) % 1) - 1)); drone = lp(drone, 180) * np.minimum(1, x / .3)
    put(drone, IMP, .35)
    k = IMP + .2
    while k < SLAM: put(kick() * .9, k, .6); put(kick() * .6, k + .22, .4); k += 1.1
    hit(IMP, 1.0); hit(SLAM, 1.3)
    # D: hospital, serious
    put(pad((45, 52, 57, 60), HEL - HOSP + .5), HOSP, .45)
    for j, m in enumerate([69, 72, 76, 74, 72, 69, 67, 69, 72, 76, 74, 72]):
        at = HOSP + .3 + j * .55
        if at < HEL - .2: put(pluck(m, .9), at, .2)
    # E: helmet - warm major lift to the end
    put(pad((48, 55, 60, 64, 67), dur - HEL + .2), HEL, .55)
    for j, m in enumerate([72, 76, 79, 84]): put(pluck(m, 1.2), HEL + .05 + j * .09, .3)
    out = lp(out, 9000) * win(0, dur, .02, .4)
    return out / np.abs(out).max()
