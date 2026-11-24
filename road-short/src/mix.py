"""Sound + original music for "Green Light Road Rage" -> build/mix.wav.
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
def horn(d=1.1): x = tt(d); return norm(lp(np.sign(np.sin(2 * np.pi * 415 * x)) + np.sign(np.sin(2 * np.pi * 520 * x)), 2400)) * env(d, .01, .05)
def engine(d): x = tt(d); return norm(lp(noise(d), 300) + .5 * np.sin(2 * np.pi * 38 * x) * (1 + .2 * np.sin(2 * np.pi * 6 * x))) * env(d, .3, .3)
def door(): d = .4; return norm(lp(noise(d), 600)) * np.exp(-tt(d) * 14) + norm(bp(noise(.1), 1500, 4000)) [:int(.4 * SR)] * 0 if False else norm(lp(noise(.4), 600)) * np.exp(-tt(.4) * 14)
def creak(): d = .5; x = tt(d); return norm(bp(noise(d), 600, 2500) * (np.sin(2 * np.pi * np.cumsum(10 + 10 * x) / SR) > .6)) * env(d, .03, .1)
def punch(): d = .22; x = tt(d); return norm(lp(noise(d), 900)) * np.exp(-x * 25) + np.sin(2 * np.pi * np.cumsum(140 * np.exp(-x * 10) + 50) / SR) * np.exp(-x * 18) * .7
def poof(): d = .6; x = tt(d); return norm(bp(noise(d), 200, 2500)) * np.exp(-x * 7) + np.sin(2 * np.pi * np.cumsum(90 * np.exp(-x * 6) + 40) / SR) * np.exp(-x * 6)
def thud(): x = tt(.5); return np.sin(2 * np.pi * np.cumsum(60 + 70 * np.exp(-x * 18)) / SR) * np.exp(-x * 7)
def quack(): d = .22; x = tt(d); return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(500 - 250 * x / d) / SR)), 600, 2500)) * env(d, .01, .08)
def peep(): d = .09; x = tt(d); return np.sin(2 * np.pi * np.cumsum(2600 + 800 * x / d) / SR) * env(d, .005, .03) * .5
def click(): return norm(hp(noise(.02), 3000)) * np.exp(-tt(.02) * 200)
def news(): return np.concatenate([marimba(76, .15), marimba(83, .15), marimba(88, .5)])
def ding(): return np.concatenate([marimba(91, .08), marimba(96, .25)])
put(sfx, engine(F(9.8) - F(0.0)), F(0.0), .05)                                        # idling at the light
put(sfx, horn(1.0), F(12.24), .2)                                                     # lay on the horn
put(sfx, creak(), F(15.68), .1)                                                       # slooow head turn
put(sfx, door(), F(21.97), .2); put(sfx, door(), F(23.39), .22)                       # out of the car, yank his door
for k in range(9): put(sfx, punch(), F(24.76) + k * .17, .14)                         # windmill
put(sfx, punch(), F(28.22), .2); put(sfx, poof(), F(29.62), .26); put(sfx, thud(), F(31.25), .3)   # wheel, airbag, airbag hits back
put(sfx, quack(), F(37.92), .16)
for k in range(11): put(sfx, peep(), F(39.4) + k * .24, .12)                         # eleven babies
for k in range(6): put(sfx, click(), F(44.17) + k * .2, .1)                          # phones filming
put(sfx, news(), F(47.3), .12)
for k in range(8): put(sfx, ding(), F(50.27) + k * .12, .05)                         # views counter
put(sfx, quack(), F(55.04), .14)                                                      # the ducks saw it
for k in range(4): put(sfx, peep(), F(59.11) + k * .25, .1)
put(sfx, horn(.9), F(62.59), .2)                                                      # the car behind honks
put(sfx, creak(), F(64.61), .1)

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
WJ = json.load(open('build/words.json')); bw = wave.open('build/beep.wav'); BEEP = np.frombuffer(bw.readframes(bw.getnframes()), dtype=np.int16).astype(float) / 32768; bw.close(); BEEP = BEEP / (np.abs(BEEP).max() + 1e-9)
BLEEPS = []
for i, w in enumerate(WJ):    
    if w['w'].lower().startswith('shit') and i >= 2 and WJ[i - 2]['w'].lower() == 'loud':     # "loud as SHI-[BEEP]": the beep lands on the T
        t0 = F(w['s']) + .09; t1 = max(F(w['e']), t0 + len(BEEP) / SR); BLEEPS.append((t0, t1))
        a_, b_ = int(t0 * SR), int(t1 * SR); fade = int(.008 * SR); v[a_:b_] = 0; v[a_ - fade:a_] *= np.linspace(1, 0, fade)
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
