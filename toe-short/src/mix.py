"""Sound + original music for "You Stubbed Your Toe" -> build/mix.wav.
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
def bonk(): d = .35; x = tt(d); return norm(np.sin(2 * np.pi * np.cumsum(220 + 300 * np.exp(-x * 30)) / SR) * np.exp(-x * 14) + lp(noise(d), 800) * np.exp(-x * 30) * .6)
def roll(d=.6): x = tt(d); return norm(bp(noise(d), 2000, 7000) * (.6 + .4 * np.sin(2 * np.pi * 30 * x))) * env(d, .03, .2)
def thud(): x = tt(.5); return np.sin(2 * np.pi * np.cumsum(60 + 70 * np.exp(-x * 18)) / SR) * np.exp(-x * 7)
def swoon(): d = .9; x = tt(d); return np.sin(2 * np.pi * np.cumsum(900 * 2 ** (-2.5 * x / d)) / SR) * env(d, .02, .3) * .6
def beep(): x = tt(.15); return np.sin(2 * np.pi * 1000 * x) * env(.15, .005, .03)
def dingg(): return np.concatenate([marimba(84, .12), marimba(91, .5)])
def wahwah():                       # sad trombone, 4 falling notes
    o = []
    for k, m in enumerate((58, 57, 56, 55)):
        d = .32 if k < 3 else .9; x = tt(d); f = hz(m) * (1 + (.03 * np.sin(2 * np.pi * 6 * x) if k == 3 else 0)); o.append(lp(2 * ((np.cumsum(f) / SR) % 1) - 1, 1400) * env(d, .03, .1))
    return norm(np.concatenate(o))
def thwip(): return whoosh(.12, 1500, 6000) * .8
def bellr(d=1.2): x = tt(d); return norm((np.sin(2 * np.pi * 1300 * x) + np.sin(2 * np.pi * 1950 * x)) * (np.sin(2 * np.pi * 22 * x) > 0)) * env(d, .01, .3)
def laugh(d=1.4):                   # cartoon crowd giggle: pitched noise bursts
    o = np.zeros(int(d * SR))
    for k in range(int(d * 7)): s = bp(noise(.09), 600 + rs.rand() * 900, 2500) * env(.09, .01, .05); i = int((k / 7 + rs.rand() * .05) * SR); o[i:i + len(s)] += s[:len(o) - i]
    return norm(o)
def boing(): d = .6; x = tt(d); return np.sin(2 * np.pi * np.cumsum(240 + 140 * np.sin(2 * np.pi * 10 * x) * np.exp(-x * 4)) / SR) * np.exp(-x * 5)
def splat(): d = .5; return norm(lp(noise(d), 1500) * (np.sin(2 * np.pi * 14 * tt(d)) > -.3)) * env(d, .01, .3)
def clang(): x = tt(1.0); return norm(sum(a * np.sin(2 * np.pi * f * x) for f, a in ((420, 1), (1130, .6), (2210, .4), (3470, .25))) * np.exp(-x * 5) + lp(noise(1.0), 2000) * np.exp(-x * 25) * .5)
def sparkle_(): return np.concatenate([marimba(88, .08), marimba(93, .08), marimba(96, .4)])
put(sfx, bonk(), F(0.02), .3); put(sfx, thud(), F(0.05), .2)                          # the stub
put(sfx, roll(.5), F(13.42), .14)                                                     # pizza cutter, one roll
put(sfx, swoon(), F(14.24), .14); put(sfx, thud(), F(15.4), .26)                    # passes out
for k in range(4): put(sfx, beep(), F(16.42) + k * .45, .08)                         # hospital monitor
put(sfx, dingg(), F(18.22), .1); put(sfx, wahwah(), F(20.62), .12)                   # good news / bad news
for k in range(4): put(sfx, thwip(), F(24.12) + k * .16, .12)                        # stitches
put(sfx, whoosh(.3), F(26.4), .1)                                                     # sock on
put(sfx, bellr(1.0), F(30.4), .08); put(sfx, laugh(1.6), F(31.6), .12)              # school bell, everyone laughs
put(sfx, boing(), F(35.85), .16)                                                      # the toe wiggles
put(sfx, splat(), F(37.6), .2)                                                        # backpack
put(sfx, whoosh(.6, 200, 2000), F(41.6), .12); put(sfx, sparkle_(), F(43.05), .1)    # three months later... perfect bangs
put(sfx, whoosh(.25), F(49.29), .14)                                                  # trip
put(sfx, clang(), F(51.66) + .35, .3); put(sfx, bonk(), F(51.66) + .35, .2)          # forehead toe vs locker

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
