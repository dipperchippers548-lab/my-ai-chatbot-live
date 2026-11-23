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
TENSE0, TENSE1 = F(48.06), F(60.23)          # lawyers storm in -> drive out (tense section)
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
for tw in (15.24, 48.06, 60.23, 70.78): put(mus, riser(1.4), F(tw) - 1.4, .35)          # build into each big turn
for tw in (8.03, 48.06, 67.98, 83.31): put(mus, boom(), F(tw), .35)                       # "Watch me", 63 hours, walked out, here's why

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
