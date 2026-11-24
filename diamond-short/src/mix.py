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

# ===== MUSIC: driving "mission" score that never stops: pulsing 8th-note bass, punchy drums, staccato string stabs, risers into big moments =====
def gtr(m, d=.5): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .45 * np.sin(4 * np.pi * f * x) * np.exp(-x * 6)) * np.exp(-x * 6) * np.minimum(1, x / .002)
def glock(m, d=.7): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .25 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 12)) * np.exp(-x * 4.5)
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def pulse(m, d): return lp(saw(m, d) + saw(m + .08, d), 700) * env(d, .004, d * .6)
def stab(ms, d=.18): return lp(sum(saw(m, d) + saw(m + .1, d) for m in ms), 2600) / len(ms) * env(d, .004, .12)
def kck(): x = tt(.28); return hp(np.tanh(2 * np.sin(2 * np.pi * np.cumsum(46 + 110 * np.exp(-x * 30)) / SR)) * np.exp(-x * 10), 70)
def snr(): d = .2; return norm(bp(noise(d), 1200, 7000)) * np.exp(-tt(d) * 22) * .9 + np.sin(2 * np.pi * 190 * tt(d)) * np.exp(-tt(d) * 30) * .5
def hat(o=False): d = .16 if o else .035; return norm(hp(noise(d), 7500)) * np.exp(-tt(d) * (16 if o else 100))
def tom(m=40): x = tt(.4); return np.sin(2 * np.pi * np.cumsum(hz(m) * (1 + .5 * np.exp(-x * 15))) / SR) * np.exp(-x * 7)
def riser(d=1.5): x = tt(d); return norm(bp(noise(d), 800, 6000)) * (x / d) ** 2.5 * .7 + np.sin(2 * np.pi * np.cumsum(200 * 2 ** (2 * x / d)) / SR) * (x / d) ** 3 * .3
def boom(): x = tt(1.6); return np.sin(2 * np.pi * np.cumsum(38 * (1 + .8 * np.exp(-x * 8))) / SR) * np.exp(-x * 2.5) + norm(lp(noise(1.6), 300)) * np.exp(-x * 6) * .4
END = DUR
BPM = 116; b = 60 / BPM; BAR = 4 * b
TENSE0, TENSE1 = F(53.3), F(68.8)          # the geologist investigates
PROG = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]       # Am F C G (heroic minor)
TPROG = [(45, [57, 60, 64]), (46, [58, 62, 65]), (45, [57, 60, 64]), (44, [56, 59, 64])]      # Am Bb Am G#dim - tense
HOOK = [69, None, 72, 71, 69, None, 64, 67]
t = 0.0; bar = 0
while t < END:
    tense = TENSE0 <= t < TENSE1; root, ch = (TPROG if tense else PROG)[bar % 4]
    for k in range(8): put(mus, pulse(root - 12 + (12 if k % 4 == 3 else 0), b * .5), t + k * b / 2, .5)       # 8th-note driving bass
    if tense:
        for off in (0, 1.5, 2.5): put(mus, tom(38 + (bar % 2) * 2), t + off * b, .5)
        for k in range(16): put(mus, hat(), t + k * b / 4, .05 + .03 * (k % 4 == 0))
        for off in (0, 2): put(mus, stab([m + 12 for m in ch], .12), t + off * b + b * .5, .16)
    else:
        for off in (0, 1.5, 2, 2.75): put(mus, kck(), t + off * b, .55 if off in (0, 2) else .35)
        for off in (1, 3): put(mus, snr(), t + off * b, .4)
        for k in range(8): put(mus, hat(k == 7), t + k * b / 2, .06 + .03 * (k % 2))
        for off in (0, .75, 1.5, 2.5, 3.25): put(mus, stab([m + 12 for m in ch]), t + off * b, .14)
        if bar % 4 in (1, 3):
            for k, m in enumerate(HOOK):
                if m: put(mus, glock(m + 12, b), t + k * b / 2, .07)
    t += BAR; bar += 1
for tw in (9.88, 25.45, 34.98, 53.37, 68.87): put(mus, riser(1.4), F(tw) - 1.4, .35)          # build into each big turn
for tw in (11.28, 42.76, 64.74, 69.93): put(mus, boom(), F(tw), .45)                       # "Watch me", 63 hours, walked out, here's why

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
