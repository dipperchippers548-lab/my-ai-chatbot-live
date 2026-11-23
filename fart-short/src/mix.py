"""Sound + original music for "You Farted in the Elevator" -> build/mix.wav.
Times are final (edited) seconds; F(t) maps a voiceover-clock time, exactly like main.js."""
import numpy as np, wave, json
from scipy.signal import butter, lfilter
SR = 44100; C = json.load(open('build/cuts.json'))
def F(t): return (t - sum(min(t, b) - a for a, b in C['cuts'] if t > a)) / C['speed'] + C.get('offset', 0)
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
def fart(d=1.1, f0=70, seed=0):     # wet "trombone" fart: jittery low buzz with pitch wobble + sputter + wet noise
    r = np.random.RandomState(seed); x = tt(d); n = len(x)
    pitch = f0 * (1 + .35 * np.sin(2 * np.pi * 2.3 * x + 1) + .15 * np.sin(2 * np.pi * 7.1 * x)) * (1 + .4 * x / d)
    ph = np.cumsum(pitch * (1 + .08 * r.randn(n).cumsum() / np.sqrt(np.arange(1, n + 1)))) / SR
    buzz = np.tanh(3 * np.sign(np.sin(2 * np.pi * ph)) * (np.sin(2 * np.pi * ph) ** 2) + .3 * r.randn(n))
    flutter = .6 + .4 * (np.sin(2 * np.pi * (9 + 6 * x / d) * x) > -.2)
    wet = bp(r.randn(n), 300, 2200) * (r.rand(n) > .992).astype(float); wet = np.convolve(wet, np.hanning(300), 'same')
    s = lp(buzz, 900) * flutter + wet * .5
    return norm(s * env(d, .02, .25) * (1 + .5 * np.exp(-x * 4)))
def ding(): x = tt(1.0); return (np.sin(2 * np.pi * 1318 * x) + .6 * np.sin(2 * np.pi * 1046 * x) * (x > .25)) * np.exp(-x * 4)
def tick(): return norm(hp(noise(.01), 3000)) * np.exp(-tt(.01) * 300)
def spray(): d = .22; return norm(bp(noise(d), 3000, 9000)) * env(d, .01, .08)
def cough(): d = .25; return norm(bp(noise(d), 400, 2500)) * env(d, .01, .15) * (1 + .5 * np.sin(2 * np.pi * 18 * tt(d)))
def wah(d=1.2): x = tt(d); return lp(2 * ((np.cumsum(500 * (1 + .2 * np.sin(2 * np.pi * 3 * x))) / SR) % 1) - 1, 2500) * env(d, .05, .3) * (1 + .4 * np.sin(2 * np.pi * 6 * x))
def clunk(): x = tt(.6); return norm(lp(noise(.6), 300)) * np.exp(-x * 9) + np.sin(2 * np.pi * 55 * x) * np.exp(-x * 6)
def powerdown(d=1.2): x = tt(d); return np.sin(2 * np.pi * np.cumsum(240 * (1 - .85 * x / d)) / SR) * env(d, .01, .3) * .6
def hum(d): x = tt(d); return np.sin(2 * np.pi * 60 * x) * .3 + bp(noise(d), 100, 400) * .2
def creak(d=.8): x = tt(d); return norm(bp(noise(d), 800, 3000) * (np.sin(2 * np.pi * np.cumsum(8 + 6 * x) / SR) > .5)) * env(d, .05, .2)
def splat(): d = .5; return norm(lp(noise(d), 1500) * (np.sin(2 * np.pi * 14 * tt(d)) > -.3)) * env(d, .01, .3)
def news(): return np.concatenate([marimba(76, .15), marimba(83, .15), marimba(88, .5)])
def steps(n=8, gap=.18):
    o = np.zeros(int(SR * (n * gap + .3)))
    for k in range(n): s = norm(lp(noise(.08), 900)) * np.exp(-tt(.08) * 40); i = int(k * gap * SR); o[i:i + len(s)] += s[:len(o) - i]
    return o
put(sfx, fart(1.25, 68, 1), 0.08, .5)                                                # COLD OPEN: the fart
put(sfx, whoosh(.25), 0.95, .12)                                                     # heads snap round
put(sfx, ding(), F(0.0) - .05, .12)                                                  # elevator ding as the story starts
for k in range(6): put(sfx, tick(), F(1.57) + k * .25, .05)                          # floor counter
put(sfx, fart(.9, 64, 2), F(12.3), .45)                                              # "it is not slow" - the trombone
put(sfx, whoosh(.3), F(15.71), .12)                                                  # everyone turns
for k in range(12): put(sfx, spray(), F(25.45) + k * .085, .12)                      # twelve sprays
put(sfx, cough(), F(31.7), .2); put(sfx, cough(), F(31.95), .14); put(sfx, wah(1.1), F(33.3), .1)   # coughs, crying kid
put(sfx, clunk(), F(38.22), .3); put(sfx, powerdown(1.0), F(40.6), .2); put(sfx, hum(F(45.4) - F(41.0)), F(41.0), .08)   # stops, power out
for k in range(8): put(sfx, tick(), F(41.9) + k * .2, .08)                           # three hours
put(sfx, creak(.9), F(48.29), .2); put(sfx, splat(), F(51.9), .25)                  # doors pried open, boots
put(sfx, news(), F(54.0), .12)                                                        # BREAKING NEWS
put(sfx, steps(10), F(60.2), .14)                                                     # everyone takes the stairs
put(sfx, ding(), F(62.2), .12)                                                        # alone in the elevator

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
