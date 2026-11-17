"""Synth helpers shared with the cold open (noise, filters, sweeps, plucks...)."""
import numpy as np, wave
from scipy.signal import butter, lfilter
SR = 44100; rs = np.random.RandomState(5)
def tt(d): return np.arange(int(d * SR)) / SR
def _put_unused(sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    sig = sig[:N - i]; out[i:i + len(sig)] += sig * g
def env(d, a=.005, r=None): t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rs.randn(int(d * SR))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def sweep(f0, f1, d): t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def whoosh(d=.4, lo=300, hi=2500): return norm(bp(noise(d), lo, hi) * np.sin(np.pi * tt(d) / d) ** 2)
def beep(f, d=.12): return np.sign(np.sin(2 * np.pi * f * tt(d))) * .5 * env(d, .003, .02)
def thud(f=70, d=.3): return norm((sweep(f * 1.8, f, d) + .5 * lp(noise(d), 400)) * np.exp(-tt(d) * 16))
def verb(x, g=.4):
    y = x.copy()
    for k, dl in enumerate((.029, .043, .061, .083, .113, .149, .197)):
        n = int(dl * SR); y[n:] += x[:-n] * g * (.72 ** k)
    return y
def blip(f0=400, f1=1800, d=.12): return sweep(f0, f1, d) * np.exp(-tt(d) * 14)
def crackle(d): x = hp(noise(d), 2500) * (rs.rand(int(d * SR)) > .992); return norm(lp(np.convolve(x, np.exp(-np.arange(200) / 30), 'same'), 7000))
def bitcrush(d, f=220): t = tt(d); x = np.sign(np.sin(2 * np.pi * f * t * (1 + .5 * np.sin(2 * np.pi * 7 * t)))) * .5 + hp(noise(d), 3000) * .4; return np.round(x * 4) / 4 * env(d, .005, .03)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, d=.35, bright=.35): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + bright * np.sin(4 * np.pi * f * x) * np.exp(-x * 9)) * np.exp(-x * 7) * np.minimum(1, x / .003)
def sq(m, d): x = tt(d); return np.sign(np.sin(2 * np.pi * hz(m) * x)) * env(d, .003, .04)
