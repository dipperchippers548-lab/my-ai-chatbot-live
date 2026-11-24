"""Sound + original music for "Your Haircut" -> build/mix.wav.
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
def tweet(): d = .25; x = tt(d); return np.sin(2 * np.pi * np.cumsum(3000 + 1200 * np.sin(2 * np.pi * 18 * x)) / SR) * env(d, .01, .08) * .5
def kaching(): return np.concatenate([norm(bp(noise(.08), 2000, 6000)) * .5, marimba(96, .1) + marimba(100, .1), marimba(103, .5)])
def bell(): x = tt(1.0); return (np.sin(2 * np.pi * 1760 * x) + .6 * np.sin(2 * np.pi * 2640 * x)) * np.exp(-x * 5)
def buzz(d): x = tt(d); return norm(lp(np.sign(np.sin(2 * np.pi * 120 * x)) + .3 * np.sign(np.sin(2 * np.pi * 240 * x)), 3000)) * env(d, .03, .1) * (1 + .2 * np.sin(2 * np.pi * 8 * x))
def tick(): return norm(hp(noise(.01), 3000)) * np.exp(-tt(.01) * 300)
def spin(): return whoosh(.6, 400, 3000)
def sting():
    o = []
    for m, d in ((43, .25), (42, .25), (38, 1.1)): x = tt(d); o.append(lp(sum(np.sign(np.sin(2 * np.pi * hz(m) * k * x)) / k for k in (1, 2)), 1200) * env(d, .01, .2))
    return norm(np.concatenate(o))
def cluck(): d = .3; x = tt(d); return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(420 + 300 * np.exp(-x * 15)) / SR)), 400, 2500)) * env(d, .01, .12)
def wind(d): x = tt(d); return norm(bp(noise(d), 300, 1500) * (.6 + .4 * np.sin(2 * np.pi * .9 * x))) * env(d, .2, .3)
def coo(): d = .5; x = tt(d); return np.sin(2 * np.pi * np.cumsum(420 + 80 * np.sin(2 * np.pi * 5 * x)) / SR) * env(d, .05, .2) * .5
def flap(n=6):
    o = np.zeros(int(SR * (n * .09 + .2)))
    for k in range(n): s = norm(bp(noise(.06), 500, 2500)) * np.exp(-tt(.06) * 40); i = int(k * .09 * SR); o[i:i + len(s)] += s
    return o
def steps(n=8, gap=.15):
    o = np.zeros(int(SR * (n * gap + .3)))
    for k in range(n): s = norm(lp(noise(.08), 900)) * np.exp(-tt(.08) * 40); i = int(k * gap * SR); o[i:i + len(s)] += s
    return o
def lock(): return np.concatenate([norm(hp(noise(.02), 2500)) * np.exp(-tt(.02) * 200), np.zeros(int(.06 * SR)), norm(bp(noise(.05), 1500, 5000)) * np.exp(-tt(.05) * 80)])
def knock():
    o = np.zeros(int(SR * .9))
    for k in range(3): s = norm(lp(noise(.12), 700)) * np.exp(-tt(.12) * 30); i = int(k * .22 * SR); o[i:i + len(s)] += s
    return o
def engine(d): x = tt(d); return norm(lp(noise(d), 300) + .5 * np.sin(2 * np.pi * 36 * x)) * env(d, .2, .3)
def drive(): x = tt(.4); return np.sin(2 * np.pi * 1000 * x) * env(.4, .01, .05) * .6
put(sfx, tweet(), F(7.84), .14); put(sfx, tweet(), F(8.6), .12)                      # a bird in it
put(sfx, kaching(), F(14.68), .1)                                                     # five dollars
put(sfx, bell(), F(18.95), .08)                                                       # shop door bell
put(sfx, buzz(.8), F(25.01), .1)                                                      # handshake... with clippers
put(sfx, buzz(F(32.5) - F(31.28)), F(31.28), .08); for_ = [put(sfx, tick(), F(31.3) + k * .15, .06) for k in range(8)]   # one hour later
put(sfx, spin(), F(32.63), .16); put(sfx, sting(), F(34.3), .14)                     # the spin... the reveal
put(sfx, marimba(84, .5), F(38.16), .1); put(sfx, cluck(), F(40.11), .2)            # golden M ... chicken
put(sfx, wind(1.2), F(45.22), .12); put(sfx, coo(), F(46.73), .12); put(sfx, flap(8), F(49.0), .16)   # hat gone, pigeon attacks
put(sfx, steps(8), F(50.33), .12); put(sfx, lock(), F(51.6), .2)
put(sfx, knock(), F(54.57), .22); put(sfx, engine(F(62.5) - F(57.49)), F(57.49), .06); put(sfx, drive(), F(61.4), .08)

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
WJ = json.load(open('build/words.json')); bw = wave.open('build/beep.wav'); BEEP = np.frombuffer(bw.readframes(bw.getnframes()), dtype=np.int16).astype(float) / 32768; bw.close(); BEEP = BEEP / (np.abs(BEEP).max() + 1e-9)
BLEEPS = []
for i, w in enumerate(WJ):    
    if w['w'].lower().startswith('fucked') and i >= 1 and WJ[i - 1]['w'].lower() == 'he':     # "He [BEEP] your shit up"
        t0 = F(w['s']) - .02; t1 = max(F(w['e']), t0 + len(BEEP) / SR); BLEEPS.append((t0, t1))
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
