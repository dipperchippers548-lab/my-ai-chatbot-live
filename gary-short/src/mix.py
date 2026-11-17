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
groove(0, F(9.1), key=0)                                      # morning: bright, bouncy
groove(F(9.1), F(15.1), key=0, g=.7); pad(F(9.1), F(15.1), [72, 76, 79, 83], .07)   # the theories, dreamy
groove(F(15.1), F(21.4), key=-3, minor=True, sneaky=True)    # night: tiptoe
groove(F(22.3), F(43.0), key=-3, minor=True, g=.85)          # the sleep-mowing saga
groove(F(45.35), F(53.6), key=2, g=.6, drums=False)          # morning after, gentle
groove(F(56.4), F(59.6), key=0, g=1.0)                       # payday: back to the bright groove
groove(F(59.6), DUR, key=-3, minor=True, sneaky=True, g=.8)  # ...and he's out mowing again
# stings
for t, ms in ((F(21.45), [48, 55, 60, 63]), (F(42.71), [43, 50, 55])): pad(t, t + 1.0, ms, .12)
put(mus, sum(marimba(m, .6) for m in (72, 76, 79, 84)) / 2, F(56.4) + .05, .25)

# ================= SOUND EFFECTS =================
def bed(t0, t1, kind, g):
    d = t1 - t0
    if d <= 0: return
    x = tt(d)
    if kind == 'birds':
        s = np.zeros(len(x))
        for k in np.arange(.2, d - .3, .9):
            for j in range(3): c = sweep(3000 + rs.rand() * 1500, 4200 + rs.rand() * 900, .07) * env(.07, .005, .03); i = int((k + j * .1 + rs.rand() * .2) * SR); s[i:i + len(c)] += c[:len(s) - i]
    elif kind == 'crickets': s = sum(np.sin(2 * np.pi * f * x) * (np.sin(2 * np.pi * r * x) > .2) * (np.sin(2 * np.pi * r2 * x + p) > -.1) for f, r, r2, p in ((4300, 34, .9, 0), (4700, 41, .7, 2)))
    elif kind == 'mower':
        f0 = 38; s = lp(np.sign(np.sin(2 * np.pi * f0 * x * (1 + .03 * np.sin(2 * np.pi * 3 * x)))) * .6 + noise(d) * .4, 900) + .3 * np.sin(2 * np.pi * 76 * x)
    elif kind == 'mowerfast':
        s = lp(np.sign(np.sin(2 * np.pi * 55 * x)) * .6 + noise(d) * .4, 1200)
    elif kind == 'snore':
        s = np.zeros(len(x))
        for k in np.arange(0, d, 2.2):
            c = lp(noise(1.0), 250) * np.sin(np.pi * tt(1.0) / 1.0) ** 2 * (1 + .6 * np.sign(np.sin(2 * np.pi * 28 * tt(1.0)))); i = int(k * SR); s[i:i + len(c)] += c[:len(s) - i]
    put(sfx, norm(s) * env(d, .15, .2), t0, g)
bed(0, F(9.1), 'birds', .03); bed(F(45.35), F(56.4), 'birds', .025); bed(F(56.4), F(59.6), 'birds', .02)
bed(F(15.1), F(45.35), 'crickets', .012); bed(F(59.6), DUR, 'crickets', .012)
for a, b in ((24.15, 26.95), (28.75, 30.75), (36.8, 40.35), (40.35, 42.71), (59.6, 99)): bed(F(a), min(F(b), DUR), 'mower', .07)
bed(F(26.95), F(28.75), 'mower', .03); bed(F(30.75), F(35.05), 'mowerfast', .07)
bed(F(22.3), F(24.15), 'snore', .1); bed(F(26.95), F(28.75), 'snore', .12); bed(F(43.35), F(45.35), 'snore', .12)
# doors, steps, sparkles, question marks
put(sfx, whoosh(.5, 300, 1500), F(1.95) + .05, .05)
for k in range(6): put(sfx, lp(noise(.05), 600) * np.exp(-tt(.05) * 60), F(1.95) + .4 + k * .27, .1)
put(sfx, ding(), F(5.79), .1)
for k in range(3): put(sfx, popsnd(), F(7.2) + .28 + k * .12, .1)
# theories: dream whoosh, kid giggle, truck, gasp, ghost
for t in (9.1, 10.9, 14.0): put(sfx, sum(pluck(m, .5, .1) for m in (84, 88, 91, 96)) / 3 * 1.0, F(t), .1); put(sfx, whoosh(.5, 800, 5000), F(t), .05)
for k in range(5): x = tt(.08); put(sfx, np.sin(2 * np.pi * (700 + k * 60) * x * (1 + .2 * np.sin(2 * np.pi * 30 * x))) * env(.08), F(9.4) + k * .11, .05)
d = F(12.7) - F(10.9); put(sfx, norm(lp(noise(d), 300) + np.sign(np.sin(2 * np.pi * 55 * tt(d))) * .3) * env(d, .2, .3), F(10.9), .07)
put(sfx, sweep(600, 1500, .35) * env(.35, .01, .1) + hp(noise(.35), 2000) * env(.35) * .3, F(12.7) + .25, .09)
d = F(15.1) - F(14.0); x = tt(d); put(sfx, np.sin(2 * np.pi * (520 + 120 * np.sin(2 * np.pi * .8 * x)) * x * (1 + .01 * np.sin(2 * np.pi * 6 * x))) * env(d, .2, .3), F(14.0), .05)
# night: camera beep, REC, door creak, snap-zoom whoosh
put(sfx, np.sin(2 * np.pi * 2000 * tt(.08)) * env(.08), F(17.04), .06); put(sfx, np.sin(2 * np.pi * 2000 * tt(.08)) * env(.08), F(17.04) + .14, .06)
x = tt(.9); f = 230 + 70 * x / .9 + 20 * np.sin(2 * np.pi * 7 * x); put(sfx, norm(bp(2 * ((np.cumsum(f) / SR) % 1) - 1, 400, 2400)) * env(.9, .05, .2), F(19.83) - .55, .06)
put(sfx, whoosh(.25, 500, 4000), F(21.4) - .02, .1)
# hedges: snip snip
k = F(35.05) + .1
while k < F(36.8): put(sfx, hp(noise(.04), 3000) * np.exp(-tt(.04) * 90) + np.sin(2 * np.pi * 3500 * tt(.04)) * np.exp(-tt(.04) * 80) * .5, k, .1); k += .17
# the pool: splash, gurgle
SPL = F(42.71); put(sfx, norm(lp(noise(1.2), 3000) * np.exp(-tt(1.2) * 3.5) + sweep(300, 80, 1.2) * np.exp(-tt(1.2) * 6) * .5), SPL, .4)
for k in range(10): put(sfx, sweep(300 + rs.rand() * 400, 900 + rs.rand() * 600, .05) * np.exp(-tt(.05) * 40), F(43.35) + .2 + k * .18, .04)
# morning: alarm clock, question pops, phone bloop
for k in range(4): put(sfx, np.sign(np.sin(2 * np.pi * 1800 * tt(.08))) * .4 * env(.08), F(45.35) + .1 + k * .14, .05)
for k in range(3): put(sfx, popsnd(), F(48.4) + .25 + k * .1, .09)
put(sfx, sweep(500, 900, .12) * env(.12), F(50.3) + .3, .05)
# payday: ka-ching x3 + paper flutters
for k in range(3):
    t = F(56.4) + .35 + k * .75; put(sfx, ding() * .6, t + .55, .1); put(sfx, norm(hp(noise(.15), 3000)) * np.exp(-tt(.15) * 20), t + .55, .04); put(sfx, whoosh(.3, 1500, 6000), t, .03)

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
print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
