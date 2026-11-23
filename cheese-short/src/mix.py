"""Sound + original music for "Birthday at Mr. Cheese's" -> build/mix.wav.
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
def arcade(d):                        # restaurant arcade bed: random game bleeps and boops
    o = np.zeros(int(d * SR))
    for k in range(int(d * 5)):
        m = 72 + rs.randint(0, 24); dd = .06 + rs.rand() * .1; x = tt(dd); s_ = np.sign(np.sin(2 * np.pi * hz(m) * x)) * env(dd, .003, .03) * .4; i = int(rs.rand() * (d - .3) * SR); o[i:i + len(s_)] += s_
    return lp(o, 5000)
def kids(d): x = tt(d); return norm(bp(noise(d), 700, 3500) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 3.3 * x))) + bp(noise(d), 1500, 4500) * (np.sin(2 * np.pi * 7 * x) > .5) * .6) * env(d, .2, .3)
def horn(): d = .8; x = tt(d); return norm(lp(np.sign(np.sin(2 * np.pi * np.cumsum(420 + 60 * np.minimum(1, x * 8)) / SR)), 2500)) * env(d, .02, .1) * (1 + .3 * np.sin(2 * np.pi * 30 * x))
def chomp(): d = .18; return norm(lp(noise(d), 1800)) * np.exp(-tt(d) * 25) + norm(bp(noise(d), 2000, 5000)) * np.exp(-tt(d) * 40) * .5
def splat(): d = .5; return norm(lp(noise(d), 1500) * (np.sin(2 * np.pi * 14 * tt(d)) > -.3)) * env(d, .01, .3)
def squeak(): d = .35; x = tt(d); return np.sin(2 * np.pi * np.cumsum(1800 + 1200 * np.sin(2 * np.pi * 5 * x)) / SR) * env(d, .01, .1) * .6
def balls(d=1.2):
    o = np.zeros(int(d * SR))
    for k in range(60): c = bp(noise(.04), 1500 + rs.rand() * 2500, 6000) * np.exp(-tt(.04) * 80); i = int((rs.rand() ** 1.6) * (d - .05) * SR); o[i:i + len(c)] += c * (1 - i / len(o))
    return norm(o)
def thud(): x = tt(.4); return np.sin(2 * np.pi * np.cumsum(60 + 70 * np.exp(-x * 18)) / SR) * np.exp(-x * 8)
def popoff(): d = .25; x = tt(d); return np.sin(2 * np.pi * np.cumsum(300 + 1500 * x / d) / SR) * np.exp(-x * 12) * .7
def dundun():
    o = []
    for m, d in ((43, .3), (42, .3), (38, 1.2)): x = tt(d); o.append(lp(sum(np.sign(np.sin(2 * np.pi * hz(m) * k * x)) / k for k in (1, 2)), 1200) * env(d, .01, .2))
    return norm(np.concatenate(o))
put(sfx, horn(), F(5.29), .1)                                                         # birthday!
put(sfx, arcade(F(26.5) - F(13.2)), F(13.2), .05); put(sfx, arcade(F(57.6) - F(40.7)), F(40.7), .04)   # the restaurant
put(sfx, kids(F(26.5) - F(14.97)), F(14.97), .09)                                    # Mr. Cheese getting jumped
put(sfx, chomp(), F(24.27), .22)                                                      # biting his ankle
put(sfx, splat(), F(27.24), .2)                                                       # drops the cake
put(sfx, whoosh(.3), F(32.6), .14); put(sfx, squeak(), F(33.76), .16); put(sfx, whoosh(.9, 300, 2500), F(35.58), .12)   # sprint, slip, slide
put(sfx, balls(1.4), F(39.35), .22)                                                   # into the ball pit
put(sfx, kids(F(42.8) - F(40.72)), F(40.72), .09); for_ = [put(sfx, thud(), F(40.9) + k * .22, .12) for k in range(5)]
put(sfx, popoff(), F(45.92), .16)                                                     # takes off the head
put(sfx, dundun(), F(47.08), .14)                                                     # it's your dad
put(sfx, horn(), F(53.69), .08)                                                       # happy birthday, son
put(sfx, kids(F(57.8) - F(55.41)), F(55.41), .1); for_ = [put(sfx, thud(), F(56.2) + k * .2, .14) for k in range(5)]

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
BLEEPS = []
json.dump(BLEEPS, open('build/bleeps.json', 'w')); v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-16.5 / 20)
sfx = sfx * 2.2
sfx_b = np.zeros(N)
for t0, t1 in BLEEPS: put(sfx_b, BEEP, t0, .55)
mix = (v + sfx + mus + sfx_b) * .84
fade = np.ones(N); fl = int(.06 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
