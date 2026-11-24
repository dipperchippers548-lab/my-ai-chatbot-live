"""Sound + original music for "How Two Miners Fooled Tiffany's" -> build/mix.wav.
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

# ===== MUSIC: intense Western-heist score (new style): galloping low strings, toms, shaker, a lonely whistle lead, whip cracks on the turns =====
def strg(m, d, att=.01, rel=.15):
    x = tt(d); f = hz(m); o = np.zeros(len(x))
    for k, det in enumerate((-.005, 0, .006)): o += 2 * ((np.cumsum(f * (1 + det) * (1 + .003 * np.sin(2 * np.pi * 5.5 * x + k))) / SR + k * .3) % 1) - 1
    return lp(o / 3, 1400) * env(d, att, rel)
def tom(m=40, d=.45): x = tt(d); return np.sin(2 * np.pi * np.cumsum(hz(m) * (1 + .6 * np.exp(-x * 18))) / SR) * np.exp(-x * 7)
def shk(): return norm(bp(noise(.05), 5000, 10000)) * np.exp(-tt(.05) * 60)
def whistle(m, d): x = tt(d); f = hz(m) * (1 + .012 * np.sin(2 * np.pi * 5.8 * x) * np.minimum(1, x / .25)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .08 * bp(noise(d), 1500, 4000)) * env(d, .06, .2)
def whip(): d = .25; x = tt(d); return norm(hp(noise(d), 2500) * np.exp(-x * 30)) + np.sin(2 * np.pi * np.cumsum(3000 * np.exp(-x * 20) + 300) / SR) * np.exp(-x * 25) * .4
def anvil(): x = tt(.8); return (np.sin(2 * np.pi * 1180 * x) + .6 * np.sin(2 * np.pi * 2730 * x)) * np.exp(-x * 9) * .6
END = DUR
BPM = 132; b = 60 / BPM; BAR = 4 * b
PROG = [40, 40, 43, 38, 40, 40, 36, 38]                         # E  E  G  D  E  E  C  D (E minor, Western)
MEL = [(76, 1.5), (None, .5), (79, .5), (78, .5), (76, 1.0), (71, 2.0), (None, 2.0), (74, 1.0), (76, 1.0), (79, 1.5), (78, .5), (76, 4.0)]
TENSE0, TENSE1 = F(53.3), F(68.8)
t = 0.0; bar = 0
while t < END - .4:
    r = PROG[bar % 8]; tense = TENSE0 <= t < TENSE1
    for beat in range(4):                                                     # gallop: da-da-DUM on every beat
        for off, g in ((0, .55), (b / 3, .35), (2 * b / 3, .45)): put(mus, strg(r - 12 + (7 if (beat % 2 and off == 0) else 0), b * .3), t + beat * b + off, g)
    put(mus, strg(r + 12, BAR, .3, .4) + strg(r + 19, BAR, .3, .4), t, .14)    # sustained upper strings
    for off in ((0, 1.5, 2, 3) if not tense else (0, .5, 1.5, 2, 2.5, 3, 3.5)): put(mus, tom(38 if off in (0, 2) else 45), t + off * b, .5)
    for k in range(8): put(mus, shk(), t + k * b / 2, .07 + .04 * (k % 2))
    if tense: put(mus, anvil(), t + 3.5 * b, .25)
    t += BAR; bar += 1
mt = 0.0                                                                         # whistle melody on top (rests during the tense section)
while mt < END - 6:
    for m, d in MEL:
        dur = d * b
        if m and not (TENSE0 <= mt < TENSE1): put(mus, whistle(m, dur * .95), mt, .22)
        mt += dur
    mt += BAR * 2
for tw in (11.28, 42.76, 64.74, 69.93): put(mus, whip(), F(tw) - .05, .6)       # whip crack on each turn
fo = int(1.0 * SR); mus[-fo:] *= np.linspace(1, 0, fo)

# ===== SOUND EFFECTS =====
def twinkle(n=6):
    o = np.zeros(int(SR * (n * .09 + .5)))
    for k in range(n): x = tt(.4); s_ = np.sin(2 * np.pi * (2600 + rs.rand() * 2200) * x) * np.exp(-x * 14); i = int(k * .09 * SR); o[i:i + len(s_)] += s_
    return o
def rustle(d=.5): return norm(bp(noise(d), 1500, 6000) * (np.sin(2 * np.pi * 11 * tt(d)) > -.2)) * env(d, .03, .25)
def dig(): d = .25; return norm(lp(noise(d), 500)) * np.exp(-tt(d) * 16) + norm(bp(noise(d), 1200, 3500)) * np.exp(-tt(d) * 30) * .4
def bell(): x = tt(1.0); return (np.sin(2 * np.pi * 1760 * x) + .6 * np.sin(2 * np.pi * 2640 * x)) * np.exp(-x * 5)
def gasp(d=1.0): x = tt(d); return norm(bp(noise(d), 600, 3000) * (.5 + .5 * np.sin(2 * np.pi * 3 * x))) * env(d, .05, .5)
def tink(): x = tt(.5); return (np.sin(2 * np.pi * 3520 * x) + .4 * np.sin(2 * np.pi * 5280 * x)) * np.exp(-x * 12)
def coins(n=10):
    o = np.zeros(int(SR * (n * .06 + .5)))
    for k in range(n): x = tt(.35); s_ = (np.sin(2 * np.pi * (2000 + rs.rand() * 1500) * x) + .5 * np.sin(2 * np.pi * (3200 + rs.rand() * 1500) * x)) * np.exp(-x * 18); i = int(k * .06 * SR); o[i:i + len(s_)] += s_
    return o
put(sfx, twinkle(8), F(0.2), .06); put(sfx, rustle(.5), F(4.76), .08)              # scattering diamonds, the bag
for k in range(3): put(sfx, dig(), F(23.64) + k * .3, .14)                            # bury them
put(sfx, bell(), F(25.94), .07)                                                        # bank door
put(sfx, twinkle(5), F(29.45), .06); put(sfx, gasp(1.2), F(32.4), .08)               # bag of diamonds... lose their minds
put(sfx, tink(), F(41.27), .1)                                                         # the jeweler's loupe
put(sfx, coins(14), F(47.76), .06)                                                     # six hundred thousand
put(sfx, whoosh(.5), F(51.6), .1)                                                      # disappear
for k in range(2): put(sfx, dig(), F(62.6) + k * .3, .12)                             # dug up
put(sfx, tink(), F(66.72), .1); put(sfx, twinkle(4), F(66.9), .06)                    # already cut

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-27.0 / 20)
sfx = sfx * 4.0
mix = (v + sfx + mus) * .84
fade = np.ones(N); fl = int(.06 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
