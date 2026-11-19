"""Sound + original music for "How Zebra Stripes Protected Warships" -> build/mix.wav.
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
def groove(t0, t1, key=0, minor=False, g=1.0, drums=True, sneaky=False):
    bpm = 104 if sneaky else 116; b = 60 / bpm; bar = 4 * b
    prog = ([0, -4, -2, -5] if minor else [0, 5, -3, 7]); scale = [0, 2, 3, 5, 7, 8, 10, 12] if minor else [0, 2, 4, 5, 7, 9, 11, 12]
    mel = [0, 2, 4, 2, 5, 4, 2, 1] if not sneaky else [0, None, 2, None, 4, 3, None, 1]
    k = 0; t = t0
    while t < t1 - .05:
        root = 60 + key + prog[(k // 1) % 4]
        for i in range(8):
            at = t + i * b / 2
            if at >= t1: break
            n = mel[(i + k * 3) % 8]
            if n is not None: put(mus, (marimba if not sneaky else pluck)(root + 12 + scale[n % 8] - (12 if sneaky else 0), .3), at, .22 * g)
            if drums and i % 2 == 0: put(mus, shaker(), at, .05 * g)
        put(mus, bass(root - 24, b * 1.6), t, .4 * g); put(mus, bass(root - 24 + 7, b * .9), t + 2 * b, .3 * g)
        if drums:
            for i in (0, 2): put(mus, kick(), t + i * b, (.35 if not sneaky else .22) * g)
            for i in (1, 3): put(mus, snap(), t + i * b, .12 * g)
        t += bar; k += 1
def pad(t0, t1, notes, g):
    d = t1 - t0; x = tt(d); s = sum(np.sin(2 * np.pi * hz(m) * x * (1 + .002 * i)) for i, m in enumerate(notes)) / len(notes); put(mus, s * env(d, .4, .5), t0, g)
END = F(73.75)
# ---- 1917 at sea: military snare + low brass march, a playful oom-pah for the stripes, submarine drone + sonar (C) ----
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def brass(ms, d=.5): return norm(sum(lp(saw(m, d) + saw(m + .08, d), 2000) for m in ms)) * env(d, .03, .2)
def tuba(m, d=.4): return norm(lp(saw(m, d) + .6 * saw(m - 12, d), 420)) * env(d, .02, .15)
def snare(d=.15): return norm(bp(noise(d), 1500, 7000) * np.exp(-tt(d) * 25) + np.sin(2 * np.pi * 200 * tt(d)) * np.exp(-tt(d) * 30) * .5)
def bdrum(): x = tt(.25); return np.sin(2 * np.pi * np.cumsum(55 + 70 * np.exp(-x * 30)) / SR) * np.exp(-x * 12)
def glock(m, d=.7): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .35 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 9)) * np.exp(-x * 4)
CC = [(36, [60, 64, 67]), (41, [60, 65, 69]), (43, [59, 62, 67]), (36, [60, 64, 67])]
def march(t0, t1, bpm=112, g=1.0, horns=True):
    b = 60 / bpm; t = t0; k = 0
    while t < t1 - .05:
        root, ch = CC[(k // 4) % 4]; put(mus, bdrum(), t, .35 * g) if k % 2 == 0 else None
        for i in range(2): put(mus, snare(.1), t + i * b / 2 + (b / 4 if (k + i) % 3 == 0 else 0), .1 * g)
        if horns and k % 4 == 0: put(mus, brass([m - 12 for m in ch], b * 3.5), t, .2 * g)
        put(mus, tuba(root - 12, b * .8), t, .3 * g)
        t += b; k += 1
def circus(t0, t1, bpm=132, g=1.0):                       # playful oom-pah for zebra stripes and laughing admirals
    b = 60 / bpm; t = t0; k = 0; mel = [72, 76, 79, 76, 77, 74, 71, 74]
    while t < t1 - .05:
        root, ch = CC[(k // 4) % 4]; put(mus, tuba(root - 12 if k % 2 == 0 else root - 5, b * .7), t, .35 * g)
        if k % 2: put(mus, brass(ch, b * .4), t, .1 * g)
        put(mus, glock(mel[k % 8], .4), t, .08 * g); t += b; k += 1
def depth(t0, t1, g=1.0):                                 # submarine: low drone + pings
    d = t1 - t0; x = tt(d); put(mus, (np.sin(2 * np.pi * 41 * x) + .5 * np.sin(2 * np.pi * 61.7 * x)) * env(d, .5, .6), t0, .22 * g)
    for t in np.arange(t0 + .3, t1, 2.2): x = tt(1.6); put(mus, np.sin(2 * np.pi * 1180 * x) * np.exp(-x * 3) * .6, t, .1 * g)
march(0, F(12.4), g=1.0)                                  # 1917: paint the warships... like zebras
circus(F(12.4), F(19.7), g=.9)                            # the admirals laugh: "a circus tent"
put(mus, brass([48, 55, 60], 1.4), F(22.8), .2)           # "I'm not trying to hide it."
depth(F(24.8), F(41.4), g=1.0)                            # submarines, the periscope, the torpedo
march(F(41.4), F(53.9), bpm=120, g=.95, horns=False)      # the stripes break up the shape...
circus(F(53.9), F(58.1), bpm=140, g=.8)                   # the barber pole
march(F(58.1), F(64.9), bpm=116, g=1.1); put(mus, brass([60, 64, 67, 72], 1.6), F(63.0), .22)   # over two thousand ships: DAZZLE
circus(F(64.9), F(69.8), g=.85)                           # the admirals painting their own ships
march(F(69.8), END + .3, g=1.0)                           # ...in 1917, a painter convinced (loops)

# ================= SOUND EFFECTS =================
def bed(t0, t1, kind, g):
    d = t1 - t0
    if d <= 0: return
    x = tt(d)
    if kind == 'birds':
        s = np.zeros(len(x))
        for k in np.arange(.2, d - .3, .9):
            for j in range(3): c = sweep(3000 + rs.rand() * 1500, 4200 + rs.rand() * 900, .07) * env(.07, .005, .03); i = int((k + j * .1 + rs.rand() * .2) * SR); s[i:i + len(c)] += c[:len(s) - i]
    elif kind == 'crowd': s = bp(noise(d), 300, 2500) * (.7 + .3 * np.sin(2 * np.pi * 2.3 * x)) + bp(noise(d), 800, 1600) * (np.sin(2 * np.pi * 5 * x) > .3) * .4
    elif kind == 'crickets': s = np.sin(2 * np.pi * 4400 * x) * (np.sin(2 * np.pi * 28 * x) > .2) * (np.sin(2 * np.pi * .9 * x) > -.2)
    elif kind == 'store': s = bp(noise(d), 200, 900) * .6 + np.sin(2 * np.pi * 120 * x) * .05
    elif kind == 'engine': s = lp(np.sign(np.sin(2 * np.pi * 42 * x)) * .5 + noise(d) * .5, 700)
    put(sfx, norm(s) * env(d, .15, .2), t0, g)
def scanbeep(f=1900, d=.12): return np.sign(np.sin(2 * np.pi * f * tt(d))) * .4 * env(d, .003, .02)
def buzzer(): x = tt(.5); return lp(np.sign(np.sin(2 * np.pi * 110 * x)) + np.sign(np.sin(2 * np.pi * 116 * x)), 900) * .4 * env(.5, .01, .1)
def thwip(): return whoosh(.12, 1500, 6000) * .6
def thump(): return norm(lp(noise(.08), 700)) * np.exp(-tt(.08) * 45)
def click(): return norm(hp(noise(.02), 3000)) * np.exp(-tt(.02) * 200)
def glass():
    d = .7; s = norm(hp(noise(d), 2500)) * np.exp(-tt(d) * 9) * .8
    for k in range(9): f = 2500 + rs.rand() * 4000; o = rs.rand() * .25; p = np.sin(2 * np.pi * f * tt(.25)) * np.exp(-tt(.25) * 22); i = int(o * SR); s[i:i + len(p)] += p[:len(s) - i] * .35
    return s
def chime(): return np.concatenate([marimba(84, .18) * .9, marimba(91, .5)])
def siren(): return sweep(700, 1400, .25) * env(.25, .01, .05) * .5
def sneeze(): d = .35; return norm(bp(noise(d), 800, 5000)) * env(d, .02, .25) * (1 + .5 * np.sin(2 * np.pi * 9 * tt(d)))
def scratch(): d = .3; return norm(bp(noise(d), 600, 3000) * np.sin(2 * np.pi * np.cumsum(30 - 25 * tt(d) / d) / SR) ** 2) * env(d, .01, .08)
def wave_(d): x = tt(d); return norm(lp(noise(d), 700) * (.5 + .5 * np.sin(2 * np.pi * .35 * x) ** 2))
def swish(): d = .3; return norm(bp(noise(d), 800, 4000)) * env(d, .03, .15)
def laughs(d=1.6): x = tt(d); return norm(bp(noise(d), 300, 2500) * (np.abs(np.sin(2 * np.pi * 4.5 * x)) ** 2)) * env(d, .05, .5)
def boom(d=1.6): return norm(lp(noise(d), 300) * np.exp(-tt(d) * 3) + sweep(80, 30, d) * np.exp(-tt(d) * 4))
def bubbles(d=1.5):
    x = tt(d); s = np.zeros(len(x)); r = np.random.RandomState(3)
    for k in range(18):
        i = int(r.rand() * len(x) * .9); b_ = sweep(400 + r.rand() * 600, 1200 + r.rand() * 800, .05) * np.exp(-tt(.05) * 50); s[i:i + len(b_)] += b_[:len(s) - i]
    return s
def squeak(): d = .4; return sweep(700, 950, d) * env(d, .05, .1) * (np.sin(2 * np.pi * 21 * tt(d)) > 0)
def horn(d=1.4): x = tt(d); return norm(lp(saw(43, d) + saw(43.1, d) + .5 * saw(55, d), 900)) * env(d, .1, .4)
put(sfx, wave_(F(24.8)), 0, .05); put(sfx, wave_(DUR - F(41.4)), F(41.4), .05)
put(sfx, horn(1.6), F(.3), .06)                                                            # ship's horn, 1917
for k in range(5): put(sfx, swish(), F(6.6) + k * .55, .07)                                # stripes, zigzags, swirls (paint)
put(sfx, laughs(), F(13.2), .08); put(sfx, laughs(1.0), F(18.9), .06)                      # the admirals laugh
for t in (27.1, 28.5): put(sfx, boom(1.4), F(t), .1)                                        # ships sinking every day
put(sfx, squeak(), F(32.5), .06)                                                            # the periscope goes up
put(sfx, norm(bp(noise(1.6), 300, 2500) * env(1.6, .05, .8)) + bubbles(1.6) * .5, F(38.4), .1)   # TORPEDO
for t in (45.4, 46.7, 48.5): put(sfx, popsnd(), F(t), .05)                                 # which end? turning? how fast?
put(sfx, norm(bp(noise(1.4), 300, 2500) * env(1.4, .05, .7)) + bubbles(1.4) * .5, F(51.4), .1); put(sfx, whoosh(.6, 200, 2000), F(52.5), .06)   # ...sails right past
for k in range(4): put(sfx, ding() * .5, F(56.2) + k * .12, .03)                           # barber pole
for k in range(8): put(sfx, swish(), F(60.6) + k * .12, .04)                               # two thousand ships painted
put(sfx, laughs(1.0), F(65.9), .05)
for k in range(4): put(sfx, swish(), F(67.6) + k * .3, .07)                                # the admirals painting
put(sfx, horn(1.2), F(73.2), .05)                                                           # loop

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-25 / 20)
sfx = sfx * 1.6
mix = v + sfx + mus
fade = np.ones(N); fl = int(.06 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
