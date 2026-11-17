"""Sound + original music for "The Neighbor Who Mowed Lawns At 3 AM" -> build/mix.wav.
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
groove(0, F(3.6), key=0)                                     # election day: bright
groove(F(6.4), F(13.3), key=-3, minor=True, sneaky=True, g=.8)   # the joke ballot: sneaky
groove(F(16.8), F(24.4), key=0)                               # he won?!
groove(F(24.4), F(29.25), key=-3, minor=True, sneaky=True, g=.6)   # no plan, no speech
groove(F(29.25), F(46.75), key=2, g=1.0)                      # mayor Doug fixes everything
groove(F(46.75), DUR, key=-3, minor=True, sneaky=True, g=.8)  # the opponent's secret vote
pad(F(16.98), F(18.0), [48, 55, 60, 64], .1); pad(F(45.42), F(46.6), [48, 55, 60, 64, 67], .09)
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
    elif kind == 'store': s = bp(noise(d), 200, 900) * .6 + np.sin(2 * np.pi * 120 * x) * .05
    elif kind == 'engine': s = lp(np.sign(np.sin(2 * np.pi * 42 * x)) * .5 + noise(d) * .5, 700)
    put(sfx, norm(s) * env(d, .15, .2), t0, g)
def scribble(d):
    x = tt(d); return hp(noise(d), 2500) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 9 * x))) * env(d, .02, .05)
def ping(): x = tt(.25); return (np.sin(2 * np.pi * 1568 * x) + .6 * np.sin(2 * np.pi * 2093 * x)) * np.exp(-x * 14)
bed(0, F(3.6), 'birds', .025); bed(F(16.8), F(46.75), 'birds', .015)
bed(F(3.6), F(6.4), 'crowd', 0)
x = tt(F(6.4) - F(3.6)); put(sfx, sum(np.sin(2 * np.pi * f * x) * (np.sin(2 * np.pi * r * x) > .2) * (np.sin(2 * np.pi * r2 * x + p) > -.1) for f, r, r2, p in ((4300, 34, .9, 0), (4700, 41, .7, 2))) * env(len(x) / SR, .3, .3), F(3.6), .03)   # crickets
put(sfx, whoosh(1.2, 200, 1500), F(4.6), .05)                                            # tumbleweed
for t0 in (8.14, 8.6): put(sfx, scribble(.4), F(t0), .08)
put(sfx, scribble(.8), F(9.65), .08); put(sfx, ding(), F(11.09), .06)
for k in range(5): put(sfx, norm(bp(noise(.06), 1500, 6000)) * np.exp(-tt(.06) * 50), F(12.0) + k * .26, .05)   # chip crunch
for k in range(8): put(sfx, ping(), F(13.5) + k * .32, .05)
x = tt(.9); put(sfx, lp(np.sign(np.sin(2 * np.pi * 150 * x)), 400) * (np.sin(2 * np.pi * 9 * x) > 0) * env(.9, .01, .1), F(14.2), .04); put(sfx, lp(np.sign(np.sin(2 * np.pi * 150 * x)), 400) * (np.sin(2 * np.pi * 9 * x) > 0) * env(.9, .01, .1), F(15.4), .04)   # buzzing
put(sfx, whoosh(.5, 300, 4000), F(16.8), .08); put(sfx, kick(), F(16.98), .3)
for k in range(4): x = tt(.07); put(sfx, np.sin(2 * np.pi * (700 + k * 60) * x * (1 + .2 * np.sin(2 * np.pi * 30 * x))) * env(.07), F(18.5) + k * .1, .05)   # giggle
for k in range(4): put(sfx, norm(bp(noise(.5), 1500, 5000)) * env(.5, .05, .2), F(20.6) + k * .35, .03); put(sfx, ping(), F(20.75) + k * .35, .03)   # whispers + pings
for k in range(10): put(sfx, whoosh(.2, 1500, 6000), F(22.0) + k * .18, .03)
put(sfx, sweep(2600, 3400, .4) * env(.4, .02, .1), F(24.5), .03)                        # mic squeal
for k in range(6): put(sfx, sweep(900, 1300, .1) * env(.1), F(27.1) + k * .3, .02)        # chair squeak
for k in range(3): put(sfx, norm(lp(noise(.25), 900)) * np.exp(-tt(.25) * 12), F(29.6) + k * 1.1, .2); put(sfx, popsnd(), F(29.6) + k * 1.1 + .55, .08)
for k in range(4): put(sfx, norm(hp(noise(.12), 3000)) * env(.12), F(34.6) + k * .3, .04)   # snack bag crinkle
x = tt(.5); put(sfx, lp(np.sign(np.sin(2 * np.pi * 520 * x * (1 + .15 * x))), 2500) * env(.5, .01, .1), F(37.0), .05)   # party horn
bed(F(37.0), F(40.0), 'crowd', .05); bed(F(40.05), F(41.6), 'crowd', .07)
put(sfx, sweep(900, 200, .5) * env(.5), F(41.7), .05); put(sfx, sweep(300, 1400, .5) * env(.5), F(42.85), .05); put(sfx, ding(), F(43.3), .06)
put(sfx, whoosh(.5, 300, 4000), F(43.95), .08); bed(F(44.3), F(46.75), 'crowd', .06)
put(sfx, scribble(.7), F(48.6), .08); put(sfx, norm(hp(noise(.5), 3000)) * env(.5, .05, .3), F(49.6), .04)   # shhh
for k, m in enumerate([67, 72, 60]): put(sfx, pluck(m, .3, .6), F(49.4) + k * .16, .08)
import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-25 / 20)
sfx = sfx * 1.6
mix = v + sfx + mus
fade = np.ones(N); fl = int(.5 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
