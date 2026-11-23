"""Sound + original music for "You Have a Crush" -> build/mix.wav.
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
def rip(d=.5): x = tt(d); return norm(bp(noise(d), 1500, 7000) * (np.sin(2 * np.pi * np.cumsum(30 + 40 * x / d) / SR) > 0)) * env(d, .01, .1)
def clang(): x = tt(1.0); return norm(sum(a * np.sin(2 * np.pi * f * x) for f, a in ((420, 1), (1130, .6), (2210, .4))) * np.exp(-x * 5) + lp(noise(1.0), 2000) * np.exp(-x * 25) * .5)
def bonk(): d = .3; x = tt(d); return norm(np.sin(2 * np.pi * np.cumsum(220 + 300 * np.exp(-x * 30)) / SR) * np.exp(-x * 14))
def paper(d=.5): return norm(bp(noise(d), 1500, 6000) * (np.sin(2 * np.pi * 11 * tt(d)) > -.2)) * env(d, .03, .25)
def beep(): x = tt(.15); return np.sin(2 * np.pi * 1000 * x) * env(.15, .005, .03)
def sparkle_(): return np.concatenate([marimba(88, .08), marimba(93, .08), marimba(96, .45)])
def flex(): return np.concatenate([marimba(72, .1), marimba(79, .1), marimba(84, .5)])
def crack(): d = .5; return norm(hp(noise(d), 2500)) * np.exp(-tt(d) * 12) + norm(bp(noise(d), 300, 1200)) * np.exp(-tt(d) * 20) * .5
def wahwah():
    o = []
    for k, m in enumerate((58, 57, 56, 55)):
        d = .3 if k < 3 else .85; x = tt(d); f = hz(m) * (1 + (.03 * np.sin(2 * np.pi * 6 * x) if k == 3 else 0)); o.append(lp(2 * ((np.cumsum(f) / SR) % 1) - 1, 1600) * env(d, .03, .1))
    return norm(np.concatenate(o))
put(sfx, flex(), F(6.17), .1)                                                         # abs on his abs
put(sfx, rip(.5), F(17.69), .16)                                                      # mask peels off the eyebrows
put(sfx, clang(), F(23.17), .2); put(sfx, bonk(), F(23.17), .2)                      # bar on the face
put(sfx, paper(.4), F(26.3), .12)                                                     # the flyer
for k in range(3): put(sfx, beep(), F(30.0) + k * .3, .07)                           # surgery monitor
put(sfx, sparkle_(), F(33.5), .12)                                                    # abs and everything
put(sfx, crack(), F(38.23), .2); put(sfx, crack(), F(40.4), .2)                      # dumps him / dumps you
put(sfx, wahwah(), F(43.2), .1)                                                       # she only dates ugly guys

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
WJ = json.load(open('build/words.json')); bw = wave.open('build/beep.wav'); BEEP = np.frombuffer(bw.readframes(bw.getnframes()), dtype=np.int16).astype(float) / 32768; bw.close(); BEEP = BEEP / (np.abs(BEEP).max() + 1e-9)
BLEEPS = []
for i, w in enumerate(WJ):
    if w['w'].lower().startswith('fuck') and i >= 2 and WJ[i - 2]['w'].lower() == 'ugly':
        t0 = F(w['s']) - .03; t1 = max(F(w['e']), t0 + len(BEEP) / SR); BLEEPS.append((t0, t1))
        a_, b_ = int(t0 * SR), int(t1 * SR); fade = int(.01 * SR); v[a_:b_] = 0; v[a_ - fade:a_] *= np.linspace(1, 0, fade)
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
