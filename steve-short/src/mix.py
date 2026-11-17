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
groove(0, F(20.6), key=0)                                   # bright, bouncy small-town groove
groove(F(20.6), F(26.0), key=0, g=.6); pad(F(20.6), F(26.0), [72, 76, 79, 83], .07)   # the theories, dreamy
groove(F(26.0), F(31.0), key=0)
groove(F(33.7), F(42.9), key=0, g=.9)
groove(F(42.9), F(44.9), key=-5, minor=True, g=.6, drums=False)   # six long months
groove(F(44.9), F(50.6), key=0, g=.8)
pad(F(31.0), F(31.9), [48, 55, 60, 63], .1)                  # the turn-around sting
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
bed(0, F(20.6), 'birds', .025); bed(F(26.0), F(27.8), 'birds', .02); bed(F(40.95), F(42.9), 'birds', .02); bed(F(44.9), DUR, 'birds', .02)
bed(0, F(1.2), 'engine', .08); put(sfx, norm(bp(noise(.5), 2000, 6000)) * env(.5, .02, .3), F(1.1), .05)          # truck + brakes hiss
bed(F(44.9), F(46.3), 'engine', .07); put(sfx, norm(bp(noise(.5), 2000, 6000)) * env(.5, .02, .3), F(46.2), .05)
for k in range(5): put(sfx, lp(noise(.05), 600) * np.exp(-tt(.05) * 60), F(2.3) + k * .28, .08)                       # footsteps
put(sfx, popsnd(), F(4.85), .1)                                                                                       # tag pop
put(sfx, whoosh(.25, 1500, 6000), F(6.4), .04)                                                                        # letters
for k in range(5): put(sfx, hp(noise(.04), 3000) * np.exp(-tt(.04) * 90), F(9.3) + k * .15, .08)                     # snip snip
put(sfx, ding(), F(10.11), .08)
for k, m in enumerate([67, 72, 76, 79]): x = tt(.35); put(sfx, lp(np.sign(np.sin(2 * np.pi * hz(m) * x)), 2200) * env(.35, .01, .1), F(11.75) + k * .11, .05)   # fanfare
for k in range(2): x = tt(.12); put(sfx, bp(np.sign(np.sin(2 * np.pi * (700 - 300 * x / .12) * x)), 500, 2500) * env(.12, .005, .05), F(14.6) + k * .22, .1)   # yip yip
bed(F(15.5), F(18.7), 'crowd', .05)
for k in range(2): put(sfx, popsnd(), F(18.9) + .2 + k * .15, .1)
for t in (20.6, 22.5): put(sfx, sum(pluck(m, .5, .1) for m in (84, 88, 91, 96)) / 3, F(t), .1); put(sfx, whoosh(.5, 800, 5000), F(t), .05)
bed(F(27.8), F(33.7), 'store', .03); put(sfx, np.sin(2 * np.pi * 1800 * tt(.1)) * env(.1), F(28.6), .03)            # store beep
put(sfx, norm(bp(noise(.6), 200, 2500) * np.sin(np.pi * tt(.6) / .6)), F(30.95) + .1, .15)                         # forty people turn
put(sfx, sweep(1200, 200, .3) * env(.3), F(31.0), .04)
for k in range(6): put(sfx, np.sin(2 * np.pi * [1320, 1760][k % 2] * tt(.12)) * env(.12, .005, .03), F(34.3) + k * .14, .05)   # ringtone
for k in range(3): x = tt(.4); put(sfx, lp(np.sign(np.sin(2 * np.pi * (480 + 120 * k) * x * (1 + .1 * x))), 2500) * env(.4, .01, .1), F(36.0) + k * .45, .04)   # party horns
bed(F(35.9), F(37.9), 'crowd', .06)
for k in range(5): put(sfx, whoosh(.18, 2000, 7000), F(43.0) + .15 + k * .28, .05)                                 # calendar pages
# rimshot after "Hi. I'm Steve."
RS = F(52.15); put(sfx, kick(), RS + .05, .17); put(sfx, snap(), RS + .19, .16); put(sfx, kick() * .6, RS + .33, .13); put(sfx, norm(hp(noise(.9), 5000)) * np.exp(-tt(.9) * 4), RS + .3, .08)
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
