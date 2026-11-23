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

# ===== MUSIC (matched to Ricks' measured profile): D minor ~104 BPM, plucked/pizzicato strings + soft piano + woodblock/shaker,
#       warm low-mids, almost no kick or sub-bass, soft highs, never stops =====
def ks(m, d=.6, bright=.5, decay=.996):        # Karplus-Strong plucked string (pizzicato / upright bass)
    f = hz(m); n = int(d * SR); P = max(2, int(SR / f)); buf = (rs.rand(P) * 2 - 1); out_ = np.zeros(n)
    buf = lp(buf, 1500 + bright * 6000) if P > 8 else buf
    for i in range(n): v = buf[i % P]; out_[i] = v; buf[i % P] = decay * .5 * (v + buf[(i + 1) % P])
    return out_ * np.minimum(1, tt(d) / .002)
KS = {}
def pz(m, d=.5, g=1.0):
    k = (m, round(d, 2))
    if k not in KS: KS[k] = norm(ks(m, d, .35, .994 if m > 55 else .997))
    return KS[k] * g
def piano(m, d=1.6): x = tt(d); f = hz(m); return sum(a * np.sin(2 * np.pi * f * k * x) * np.exp(-x * (1.8 + k * 1.2)) for k, a in ((1, 1), (2, .35), (3, .12), (4, .05))) * np.minimum(1, x / .003)
def cello(m, d): x = tt(d); f = hz(m); v = 1 + .004 * np.sin(2 * np.pi * 5.5 * x); return lp(sum(np.sin(2 * np.pi * f * k * np.cumsum(v) / SR) / k for k in range(1, 6)), 900) * env(d, .25, .3)
def wood(): d = .06; x = tt(d); return (np.sin(2 * np.pi * 1250 * x) + .5 * np.sin(2 * np.pi * 2100 * x)) * np.exp(-x * 70)
def shk(): return norm(bp(noise(.05), 5000, 9000)) * np.exp(-tt(.05) * 60)
def brushs(): d = .18; return norm(bp(noise(d), 1500, 5000)) * env(d, .02, .14)
def glk(m, d=1.0): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .25 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 10)) * np.exp(-x * 3.5)
def swell(d=1.4): x = tt(d); return norm(lp(noise(d), 2200)) * (x / d) ** 2.5
END = DUR
BPM = 104; b = 60 / BPM; BAR = 4 * b
PROG = [(38, [50, 53, 57]), (34, [50, 53, 58]), (41, [48, 53, 57]), (36, [48, 52, 55])]          # Dm  Bb  F  C
ARP = [0, 2, 1, 2, 0, 2, 1, 2]
T_LAW, T_REVEAL, T_REAL = F(48.06), F(60.23), F(83.31)
t = 0.0; bar = 0
while t < END - .3:
    root, ch = PROG[bar % 4]; tense = T_LAW <= t < T_REVEAL; build = T_REVEAL <= t < F(67.98)
    for k, ix in enumerate(ARP): put(mus, pz(ch[ix] + 12, b * .9), t + k * b / 2, .34 if k % 2 == 0 else .24)          # pizzicato ostinato (8ths)
    for off in (0, 1.5, 2, 3): put(mus, pz(root, b * 1.6), t + off * b, .8 if off in (0, 2) else .5)                   # plucked upright bass (soft)
    put(mus, cello(root + 12, BAR), t, .32)                                                                                 # warm bowed cello pad (fills 90-300 Hz like Ricks)
    put(mus, sum(piano(m + 12) for m in ch) / 3, t, .16); put(mus, sum(piano(m + 12) for m in ch) / 3, t + 2.5 * b, .09)  # soft piano
    for off in (.5, 1.5, 2.5, 3.5): put(mus, wood(), t + off * b, .1)                                                     # woodblock on the off-beats
    for k in range(16): put(mus, shk(), t + k * b / 4, .025 + .02 * (k % 4 == 2))
    if tense or build:
        for off in (1, 3): put(mus, brushs(), t + off * b, .12)                                                          # light brush backbeat for the chase
    if bar % 4 == 3 and not tense: put(mus, glk(74), t + 3 * b, .06); put(mus, glk(77), t + 3.5 * b, .06)
    t += BAR; bar += 1
for tw in (15.24, 48.06, 60.23, 70.78): put(mus, swell(1.2), F(tw) - 1.2, .1)          # small lifts into each turn
for m, o in ((74, 0), (78, .12), (81, .24), (86, .36)): put(mus, glk(m, 1.6), F(67.98) + o, .12)   # sparkle on "Agloe General Store"
for m in (50, 54, 57, 62): put(mus, piano(m, 3.0) / 2, T_REAL, .6)                          # resolve to D MAJOR on "became real"
fo = int(1.0 * SR); mus[-fo:] *= np.linspace(1, 0, fo)

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

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-21.0 / 20)
sfx = sfx * 2.2
mix = (v + sfx + mus) * .84
fade = np.ones(N); fl = int(.8 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
