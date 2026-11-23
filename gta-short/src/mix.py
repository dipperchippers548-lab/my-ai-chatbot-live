"""Sound + original music for "GTA 6 Came Out and You're Broke" -> build/mix.wav.
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
def clink(): return np.concatenate([marimba(96, .06), marimba(91, .3)]) * .6
def sizzle(d): return norm(hp(noise(d), 3000) * (.7 + .3 * np.sin(2 * np.pi * 13 * tt(d)))) * env(d, .1, .2)
def crash(): d = .6; s = norm(lp(noise(d), 1500)) * np.exp(-tt(d) * 9); return s + norm(hp(noise(d), 3000)) * np.exp(-tt(d) * 14) * .5
def thud(): x = tt(.5); return np.sin(2 * np.pi * np.cumsum(60 + 70 * np.exp(-x * 18)) / SR) * np.exp(-x * 7)
def slam(): d = .4; return norm(lp(noise(d), 500)) * np.exp(-tt(d) * 14) + np.sin(2 * np.pi * 80 * tt(d)) * np.exp(-tt(d) * 10) * .6
def wind(d): x = tt(d); return norm(bp(noise(d), 300, 1500) * (.6 + .4 * np.sin(2 * np.pi * .7 * x))) * env(d, .3, .5)
def kaching(): return np.concatenate([norm(bp(noise(.08), 2000, 6000)) * .5, marimba(96, .1) + marimba(100, .1), marimba(103, .5)])
def wahwah():
    o = []
    for k, m in enumerate((58, 57, 56, 55)):
        d = .3 if k < 3 else .85; x = tt(d); f = hz(m) * (1 + (.03 * np.sin(2 * np.pi * 6 * x) if k == 3 else 0)); o.append(lp(2 * ((np.cumsum(f) / SR) % 1) - 1, 1600) * env(d, .03, .1))
    return norm(np.concatenate(o))
def siren(d): x = tt(d); return np.sin(2 * np.pi * np.cumsum(700 + 250 * np.sign(np.sin(2 * np.pi * 1.2 * x))) / SR) * env(d, .1, .3) * .5
def squeak(d): x = tt(d); return norm(bp(noise(d), 2500, 5000) * (np.sin(2 * np.pi * 3 * x) > .7)) * env(d, .05, .1)
def gavel(): x = tt(.4); return norm(lp(noise(.4), 1200)) * np.exp(-x * 18) + np.sin(2 * np.pi * 180 * x) * np.exp(-x * 14) * .6
def cell(): x = tt(1.0); return norm(sum(a * np.sin(2 * np.pi * f * x) for f, a in ((300, 1), (760, .5), (1530, .3))) * np.exp(-x * 5) + lp(noise(1.0), 1500) * np.exp(-x * 20) * .5)
def startup(): return np.concatenate([marimba(72, .12), marimba(79, .12), marimba(84, .12), marimba(91, .6)])
put(sfx, crash() * .3 + thud() [:int(.6 * SR)] if False else thud(), .05, .1)
for k in range(2): put(sfx, clink(), F(8.6) + k * .35, .1)                          # four dollars and a token
put(sfx, sizzle(F(16.9) - F(14.9)), F(14.9), .06)                                     # the Burger Barn grill
put(sfx, crash(), F(17.07), .16); put(sfx, crash(), F(18.40), .18); put(sfx, thud(), F(20.17) + .2, .3); put(sfx, crash(), F(20.17) + .25, .2)   # drop, drop, the MANAGER
put(sfx, slam(), F(22.12), .22)                                                       # Fired.
put(sfx, wind(F(27.4) - F(23.3)), F(23.3), .1)                                       # lemonade in November
put(sfx, kaching(), F(28.2), .12)                                                     # sold the PlayStation
put(sfx, wahwah(), F(32.6), .12)                                                      # nothing to play it on
put(sfx, squeak(F(44.7) - F(38.9)), F(38.9), .08); put(sfx, siren(F(44.7) - F(40.8)), F(40.8), .1)   # the slowest police chase in history
put(sfx, thud(), F(45.6), .24)                                                        # caught
put(sfx, gavel(), F(48.4), .28); put(sfx, gavel(), F(50.6), .28)                     # Grand Theft Shopping Cart. Six months.
put(sfx, cell(), F(52.2), .22)                                                        # prison door
put(sfx, startup(), F(54.5), .12)                                                     # the PlayStation boots up

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
WJ = json.load(open('build/words.json')); bw = wave.open('build/beep.wav'); BEEP = np.frombuffer(bw.readframes(bw.getnframes()), dtype=np.int16).astype(float) / 32768; bw.close(); BEEP = BEEP / (np.abs(BEEP).max() + 1e-9)
BLEEPS = []
for i, w in enumerate(WJ):    # "broke as SH-[BEEP]": let the "sh" through, bleep the rest
    if w['w'].lower().startswith('shit') and i >= 2 and WJ[i - 2]['w'].lower() == 'broke':
        t0 = F(w['s']) + .085; t1 = max(F(w['e']), t0 + len(BEEP) / SR); BLEEPS.append((t0, t1))
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
