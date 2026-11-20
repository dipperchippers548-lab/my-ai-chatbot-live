"""Sound + original music for "You Get Hiccups During the Biggest Test of Your Life" -> build/mix.wav.
Times are final (edited) seconds; F(t) maps a voiceover-clock time, exactly like main.js."""
import numpy as np, wave, json
from scipy.signal import butter, lfilter
SR = 44100; C = json.load(open('build/cuts.json'))
def F(t): return (t - sum(min(t, b) - a for a, b in C['cuts'] if t > a)) / C['speed']
DUR = C['duration']; N = int(DUR * SR); rs = np.random.RandomState(4)
sfx = np.zeros(N); mus = np.zeros(N)
def tt(d): return np.arange(int(d * SR)) / SR
def put(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    sig = sig[:N - i]; buf[i:i + len(sig)] += sig * g
def env(d, a=.005, r=None): t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rs.randn(int(d * SR))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def sweep(f0, f1, d): t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, d=.3, br=.4): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + br * np.sin(4 * np.pi * f * x) * np.exp(-x * 10)) * np.exp(-x * 9) * np.minimum(1, x / .003)
def marimba(m, d=.35): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .3 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x * 30)) * np.exp(-x * 7)
def bass(m, d): x = tt(d); return np.sin(2 * np.pi * hz(m) * x) * np.minimum(1, x / .005) * np.exp(-x * 3)
def kick(): x = tt(.2); return np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-x * 30)) / SR) * np.exp(-x * 14)
def snap(): x = tt(.08); return hp(noise(.08), 2000) * np.exp(-x * 50)
def shaker(): x = tt(.05); return hp(noise(.05), 6000) * np.exp(-x * 80)
def whoosh(d=.35, lo=300, hi=3000): return norm(bp(noise(d), lo, hi) * np.sin(np.pi * tt(d) / d) ** 2)
def popsnd(): d = .09; return sweep(300, 1400, d) * np.exp(-tt(d) * 30)
def ding(): x = tt(.8); return (np.sin(2 * np.pi * 2093 * x) + .5 * np.sin(2 * np.pi * 3136 * x)) * np.exp(-x * 6)

# ================= MUSIC (original) =================

# ===== no music (this format runs on voice + sfx) =====
# ===== SOUND EFFECTS =====
def hic():                     # cartoon hiccup: a squeaky up-blip + a deep body thump
    d = .35; x = tt(d); up = np.sin(2 * np.pi * np.cumsum(500 + 1400 * np.minimum(1, x / .06)) / SR) * np.exp(-x * 18)
    th = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-x * 25)) / SR) * np.exp(-x * 9); return norm(up * .6 + th)
def boing(): d = .6; x = tt(d); return np.sin(2 * np.pi * np.cumsum(180 + 120 * np.sin(2 * np.pi * 9 * x) * np.exp(-x * 4)) / SR) * np.exp(-x * 5)
def clatter(): d = .5; return norm(bp(noise(d), 600, 4000)) * np.exp(-tt(d) * 9) * (1 + (np.sin(2 * np.pi * 23 * tt(d)) > .6))
def glug(n=4):
    o = np.zeros(int(SR * (n * .16 + .3)))
    for k in range(n): x = tt(.14); g = np.sin(2 * np.pi * np.cumsum(160 + 260 * x / .14) / SR) * env(.14, .01, .08); i = int(k * .16 * SR); o[i:i + len(g)] += g
    return o
def splutter(): d = .5; return norm(bp(noise(d), 300, 2500) * (np.sin(2 * np.pi * 16 * tt(d)) > 0)) * env(d, .01, .25)
def rustle(): d = .8; return norm(bp(noise(d), 1500, 6000)) * env(d, .1, .4)
def crash(): d = .9; s = norm(lp(noise(d), 1200)) * np.exp(-tt(d) * 6); return s + norm(hp(noise(d), 3000)) * np.exp(-tt(d) * 10) * .5
def wind(d): x = tt(d); return norm(bp(noise(d), 300, 1500) * (.6 + .4 * np.sin(2 * np.pi * .7 * x))) * env(d, .3, .6)
def sting(): return np.concatenate([marimba(84, .12), marimba(88, .12), marimba(91, .5)])
for tw in (9.49, 15.23, 22.13, 27.34, 31.79): put(sfx, hic(), F(tw), .32)          # every HIC
put(sfx, clatter(), F(16.37), .14)                                                    # desk jumps
put(sfx, glug(5), F(18.81), .12); put(sfx, splutter(), F(20.74), .16)                # water... up your nose
put(sfx, rustle(), F(23.4), .14)                                                      # the whole class turns
put(sfx, boing(), F(27.5), .14); put(sfx, crash(), F(28.65), .24)                    # straight through the ceiling
put(sfx, whoosh(.5), F(31.95), .14)                                                   # principal comes with you
put(sfx, wind(F(37.2) - F(33.6)), F(33.6), .12)                                      # rising through the sky
sil0 = int(F(38.0) * SR); sfx[sil0:] *= 0                                             # space: dead silence (except the sting)
put(sfx, sting(), F(50.68), .1)                                                        # fucking genius

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-16.5 / 20)
sfx = sfx * 2.2
mix = (v + sfx + mus) * .84
fade = np.ones(N); fl = int(.06 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
