"""Sound + original music for "How a Fake Town Caught Map Thieves" -> build/mix.wav.
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

# ===== MUSIC: soft suspense strings (user's pick) - legato string section + soft pizzicato, sneaky documentary feel, no drums, never stops =====
from scipy.signal import fftconvolve
def saw(f, d, ph=0): x = tt(d); return 2 * (((f * x) + ph) % 1) - .5 * 2
def strings(m, d, att=.5, rel=.6):          # ensemble: 4 slightly detuned, vibrato'd saws, warm low-pass
    x = tt(d); f = hz(m); out_ = np.zeros(len(x))
    for k, det in enumerate((-.006, -.002, .003, .007)):
        vib = 1 + .0035 * np.sin(2 * np.pi * (5.2 + k * .3) * x + k); out_ += 2 * ((np.cumsum(f * (1 + det) * vib) / SR + k * .25) % 1) - 1
    return lp(lp(out_ / 4, 2200), 2600) * env(d, att, rel)
def pizz(m, d=.35): x = tt(d); f = hz(m); return lp((np.sin(2 * np.pi * f * x) + .5 * np.sin(4 * np.pi * f * x) * np.exp(-x * 20) + .2 * np.sin(6 * np.pi * f * x) * np.exp(-x * 30)) * np.exp(-x * 11) * np.minimum(1, x / .002), 3000)
def trem(m, d): x = tt(d); return strings(m, d, .3, .4) * (.65 + .35 * np.sin(2 * np.pi * 9 * x))
END = DUR
BPM = 92; b = 60 / BPM; BAR = 4 * b
PROG = [(38, [50, 53, 57]), (34, [50, 53, 58]), (31, [50, 55, 58]), (33, [49, 52, 57])]     # Dm  Bb  Gm  A
OST = [62, 65, 69, 65, 62, 65, 69, 70]                                                       # pizzicato figure (8ths)
T_LAW, T_REVEAL, T_STORE, T_REAL = F(48.06), F(60.23), F(67.98), F(83.31)
t = 0.0; bar = 0
while t < END - .5:
    root, ch = PROG[bar % 4]; tense = T_LAW <= t < T_REVEAL
    put(mus, strings(root, BAR + .4, .6, .7), t, .5); put(mus, sum(strings(m, BAR + .4, .7, .7) for m in ch) / 3, t, .55)   # cellos/basses + violas/violins pad
    shift = [0, -3, -7, -5][bar % 4]
    for k, m in enumerate(OST): put(mus, pizz(m + shift, .4), t + k * b / 2, .32 if k % 2 == 0 else .22)
    if tense: put(mus, trem(ch[2] + 12, BAR), t, .22)                                         # nervous high tremolo for the lawyer showdown
    t += BAR; bar += 1
for tw in (15.24, 36.6, 48.06, 60.23, 70.78): put(mus, strings(62, 1.6, 1.4, .2) * .6, F(tw) - 1.5, .5)   # gentle swells into each turn
for m in (38, 50, 54, 57, 62, 66): put(mus, strings(m, 4.2, .4, 1.8), T_REAL, .45)                        # resolve to D MAJOR on "became real"
ir_t = np.arange(int(1.4 * SR)) / SR; ir = rs.randn(len(ir_t)) * np.exp(-ir_t * 3.5); ir = lp(ir, 3000); ir[0] = 7.0
mus = fftconvolve(mus, ir / np.abs(ir).sum() * 8)[:N]
fo = int(1.2 * SR); mus[-fo:] *= np.linspace(1, 0, fo)

# ===== SOUND EFFECTS =====
def scratch(d=1.2): x = tt(d); return norm(bp(noise(d), 2500, 7000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 5 * x)))) * env(d, .05, .2)
def engine(d): x = tt(d); return norm(lp(noise(d), 450) + .4 * np.sin(2 * np.pi * 48 * x) * (1 + .3 * np.sin(2 * np.pi * 7 * x))) * env(d, .4, .6)
def clickw(): return norm(hp(noise(.015), 3000)) * np.exp(-tt(.015) * 250)
def press(d=1.6): x = tt(d); return norm(bp(noise(d), 300, 2500) * (np.sin(2 * np.pi * 4 * x) > .3)) * env(d, .1, .3)
def door(): d = .4; return norm(lp(noise(d), 400)) * np.exp(-tt(d) * 14) + np.sin(2 * np.pi * 90 * tt(d)) * np.exp(-tt(d) * 10) * .6
def bell(): x = tt(1.4); return (np.sin(2 * np.pi * 1760 * x) + .6 * np.sin(2 * np.pi * 2640 * x) + .3 * np.sin(2 * np.pi * 4100 * x)) * np.exp(-x * 4)
def gravel(d): return norm(bp(noise(d), 400, 3000) * (rs.rand(int(d * SR)) > .7)) * env(d, .2, .3)
put(sfx, scratch(1.3), F(0.3), .07)                                                   # the pen draws the dot
put(sfx, scratch(.6), F(7.4), .06)                                                    # writing "AGLOE"
put(sfx, engine(2.4), F(21.9), .12)                                                   # driving every road
for k in range(6): put(sfx, clickw(), F(24.79) + k * .16, .1)                         # measuring wheel clicks
put(sfx, press(1.6), F(40.6), .1)                                                     # the rival prints their map
put(sfx, whoosh(.4), F(43.0), .08)                                                    # magnifying glass slides over
put(sfx, door(), F(50.83), .2)                                                        # storm in
put(sfx, engine(1.6), F(60.2), .1); put(sfx, gravel(1.4), F(61.3), .08)              # drive out to the dirt road
put(sfx, bell(), F(67.98), .09)                                                        # shop door bell on the sign

def rustle(d=.5): return norm(bp(noise(d), 1500, 6000) * (np.sin(2 * np.pi * 11 * tt(d)) > -.2)) * env(d, .03, .25)
def stamp(): d = .25; return norm(lp(noise(d), 900)) * np.exp(-tt(d) * 25) + np.sin(2 * np.pi * 110 * tt(d)) * np.exp(-tt(d) * 20) * .5
put(sfx, rustle(.6), F(9.26), .1)                                                     # partner leans over the map
put(sfx, whoosh(.35), F(15.0), .1); put(sfx, stamp(), F(16.59), .16)                  # "it's called a paper town" - stamp
put(sfx, whoosh(.35), F(36.6), .1)                                                    # years go by
put(sfx, stamp(), F(48.06), .2)                                                       # Caught.
put(sfx, rustle(.5), F(52.17), .1)                                                    # slapping the map down
put(sfx, whoosh(.4), F(70.6), .1)                                                     # someone saw Agloe

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-26.5 / 20)
sfx = sfx * 5.5
mix = (v * 1.12 + sfx + mus) * .88
fade = np.ones(N); fl = int(.8 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
