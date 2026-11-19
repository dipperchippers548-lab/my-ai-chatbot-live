"""Sound + original music for "He Won the Lottery 14 Times" -> build/mix.wav.
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
END = F(64.6)
# ---- a 90s heist groove: slap bass, clavinet stabs, brushed funk drums, horn hits (E minor) ----
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def slap(m, d=.22): x = tt(d); f = hz(m); return np.tanh(2.2 * (np.sin(2 * np.pi * f * x) + .4 * np.sin(4 * np.pi * f * x) * np.exp(-x * 30))) * np.exp(-x * 9) * np.minimum(1, x / .002)
def clav(ms, d=.14): x = tt(d); return norm(sum(hp(np.sign(np.sin(2 * np.pi * hz(m) * x)) * np.exp(-x * 22), 400) for m in ms)) * env(d, .002, .05)
def horns(ms, d=.35): return norm(sum(lp(saw(m, d) + saw(m + .07, d), 2600) for m in ms)) * env(d, .015, .15)
def kick(): x = tt(.2); return np.sin(2 * np.pi * np.cumsum(50 + 100 * np.exp(-x * 32)) / SR) * np.exp(-x * 14)
def snare(): d = .16; return norm(bp(noise(d), 1500, 7000) * np.exp(-tt(d) * 24) + np.sin(2 * np.pi * 190 * tt(d)) * np.exp(-tt(d) * 30) * .5)
def hat(): return norm(hp(noise(.04), 8000)) * np.exp(-tt(.04) * 90)
def tick_(): return norm(hp(noise(.02), 4000)) * np.exp(-tt(.02) * 200)
EM = [(40, [64, 67, 71]), (43, [62, 67, 71]), (45, [64, 69, 72]), (47, [63, 66, 71])]
def heist(t0, t1, bpm=104, g=1.0, full=True):
    s16 = 60 / bpm / 4; t = t0; k = 0; bl = [0, None, 0, 12, None, 7, None, 10, 0, None, 3, None, 5, None, 7, None]
    while t < t1 - .05:
        root, ch = EM[(k // 16) % 4]; st = k % 16
        if bl[st] is not None: put(mus, slap(root - 12 + bl[st]), t, .45 * g)
        if full and st in (2, 6, 10, 14): put(mus, clav(ch), t, .13 * g)
        if st in (0, 7, 10): put(mus, kick(), t, .4 * g)
        if st in (4, 12): put(mus, snare(), t, .2 * g)
        if st % 2 == 0: put(mus, hat(), t + (s16 * .2 if st % 4 else 0), .06 * g)
        t += s16; k += 1
def ticking(t0, t1, g=1.0):
    for t in np.arange(t0, t1, .5): put(mus, tick_(), t, .25 * g); put(mus, slap(28, .3) * .4, t, .25 * g) if int((t - t0) * 2) % 4 == 0 else None
heist(0, F(15.8), g=1.0); put(mus, horns([64, 67, 71], .5), F(2.3), .2)              # 14 times... none of it was luck
ticking(F(15.8), F(27.6), g=.9); heist(F(19.9), F(27.6), g=.6, full=False)             # 1992: 7 million combinations
put(mus, horns([59, 62, 66], .9), F(25.9), .22)                                         # twenty-seven MILLION
heist(F(28.0), F(31.6), bpm=110, g=.75)                                                  # people laughed
heist(F(31.9), F(40.0), bpm=116, g=1.05); put(mus, horns([64, 67, 71, 76], .4), F(36.8), .18)   # the warehouse, day and night
ticking(F(40.0), F(44.6), g=1.1)                                                          # ran out of time...
put(mus, horns([64, 68, 71, 76], 1.6), F(45.0), .3)                                       # THE WINNING NUMBERS (major!)
heist(F(45.4), F(58.4), bpm=104, g=.85)                                                   # here's the math
heist(F(58.4), END + .3, bpm=104, g=1.0); put(mus, horns([64, 67, 71], .5), F(64.4), .2) # rules changed... (loops)

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
def printer(d=1.2): x = tt(d); return norm(bp(noise(d), 1500, 6000) * (np.sin(2 * np.pi * 18 * x) > 0)) * env(d, .02, .1)
def scribble(d=.5): x = tt(d); return norm(bp(noise(d), 2500, 8000) * (.5 + .5 * np.sin(2 * np.pi * 9 * x)) ** 2) * env(d, .02, .1)
def laughs(d=1.4): x = tt(d); return norm(bp(noise(d), 300, 2500) * (np.abs(np.sin(2 * np.pi * 4.5 * x)) ** 2)) * env(d, .05, .5)
def ball(): x = tt(.12); return (np.sin(2 * np.pi * 1700 * x) + .5 * np.sin(2 * np.pi * 2900 * x)) * np.exp(-x * 40)
def coins_(n=12):
    out_ = np.zeros(int(SR * (n * .06 + .5)))
    for k in range(n):
        c = ding()[:int(.4 * SR)] * .5; i = int(k * .06 * SR); out_[i:i + len(c)] += c[:len(out_) - i]
    return out_
def stamp(): d = .4; return norm(sweep(110, 50, d) * np.exp(-tt(d) * 12) + lp(noise(d), 900) * np.exp(-tt(d) * 25) * .6)
put(sfx, coins_(10), F(2.29), .04)                                                       # fourteen times
for k in range(5): put(sfx, ball(), F(9.6) + k * .12, .04)                              # jackpot...
for k in range(12): put(sfx, ball(), F(20.1) + k * .09, .03)                            # seven million combinations
put(sfx, ding() * .4, F(23.3), .05)                      # one dollar each
put(sfx, coins_(16), F(25.9), .05)                                                       # twenty-seven million
put(sfx, laughs(), F(28.2), .08)                                                         # people laughed
put(sfx, stamp(), F(32.9), .1)                                                           # rented a warehouse
for t in (35.4, 36.9): put(sfx, scribble(.8), F(t), .06)                                 # filling out tickets
put(sfx, printer(1.4), F(37.6), .05)
for k in range(10): put(sfx, ball(), F(45.1) + k * .1, .05)                             # the winning numbers
put(sfx, coins_(14), F(45.8), .05)
put(sfx, ding() * .5, F(50.6), .05)                                                      # win 27 million
put(sfx, stamp(), F(60.3), .14)                                                          # rules changed

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
