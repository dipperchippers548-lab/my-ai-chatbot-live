"""Sound + original music for "How One Man Rigged McDonald's Monopoly" -> build/mix.wav.
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
END = F(61.6)
# ---- smooth heist: soft kick + finger snaps, shaker, warm sub bass, muted plucks, string pad swells, gentle risers (A minor, 100 bpm) ----
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def pl(m, d=.3): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .25 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 14) * np.minimum(1, x / .003)
def sub(m, d): x = tt(d); return np.sin(2 * np.pi * hz(m) * x) * env(d, .01, .2)
def kick(): x = tt(.22); return np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-x * 30)) / SR) * np.exp(-x * 11)
def snapp(): d = .1; return norm(bp(noise(d), 1800, 5000)) * np.exp(-tt(d) * 40)
def shk(): return norm(bp(noise(.06), 5000, 11000)) * np.exp(-tt(.06) * 50)
def pad(ms, d): return norm(sum(lp(saw(m, d) + saw(m + .1, d), 1100) for m in ms)) * env(d, min(.8, d / 3), min(1.0, d / 3))
def keys(m, d=1.2): x = tt(d); f = hz(m); return sum(a * np.sin(2 * np.pi * f * k * x) * np.exp(-x * (2 + k * 1.5)) for k, a in ((1, 1), (2, .4), (3, .15))) * np.minimum(1, x / .004)
def swell(d=1.2): x = tt(d); return norm(lp(noise(d), 2500)) * (x / d) ** 2.5
def thump(): d = 1.2; x = tt(d); return np.sin(2 * np.pi * np.cumsum(55 * (1 + .6 * np.exp(-x * 8))) / SR) * np.exp(-x * 3)
AM = [(45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62]), (40, [56, 59, 64])]   # Am F G E
def groove(t0, t1, g=1.0, lvl=2, bpm=100):
    b = 60 / bpm; t = t0; k = 0; ost = [0, 2, 1, 2]
    while t < t1 - .05:
        bar = k // 4; root, ch = AM[bar % 4]; bt = k % 4
        if bt == 0: put(mus, sub(root - 12, b * 3.6), t, .5 * g); put(mus, pad([m + 12 for m in ch], b * 4.1), t, .07 * g * (lvl >= 2))
        if lvl >= 1 and bt in (0, 2): put(mus, kick(), t, .4 * g)
        if lvl >= 2 and bt in (1, 3): put(mus, snapp(), t, .16 * g)
        for e in range(2): put(mus, shk(), t + e * b / 2, .045 * g)
        for e in range(2): put(mus, pl(ch[ost[(k * 2 + e) % 4]] + 12, .28), t + e * b / 2, .12 * g)
        t += b; k += 1
def hit(t, ms=(57, 64, 69), g=1.0): put(mus, swell(1.0), t - 1.0, .06 * g); put(mus, thump(), t, .35 * g); put(mus, keys(ms[0], 2.0) + keys(ms[1], 2.0) + keys(ms[2], 2.0), t, .1 * g)
def hold(t0, t1, g=1.0):
    d = t1 - t0; put(mus, pad([57, 60, 64], d), t0, .09 * g)
    for t in np.arange(t0, t1, .5): put(mus, norm(hp(noise(.02), 4000)) * np.exp(-tt(.02) * 200), t, .18 * g)
groove(0, F(11.0), lvl=2); hit(F(4.4))                                             # ...one secret
groove(F(11.0), F(18.7), lvl=1, g=.9); hit(F(12.5), (52, 57, 60), .8)              # Jerry Jacobson, head of security
hold(F(18.7), F(21.0), g=.8); groove(F(21.0), F(24.3), lvl=1, g=.9); hit(F(23.66), (55, 59, 62), .7)   # ...into his pocket
groove(F(24.3), F(35.6), lvl=2, g=1.0); hit(F(33.49), (57, 61, 64), .9)            # lucky strangers... twenty-four million
hold(F(35.6), F(43.5), g=1.0); put(mus, swell(2.0), F(43.62) - 2.0, .08); hit(F(43.62), (52, 55, 59), 1.1)   # the FBI... Uncle Jerry
groove(F(44.7), F(56.1), lvl=2, g=.95); hit(F(46.92), (52, 56, 59), .9)            # the man guarding the game... here's why
groove(F(56.1), END + .3, lvl=2, g=1.0)                                             # (loops)

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
def pocket(): d = .35; return norm(bp(noise(d), 600, 3000)) * env(d, .05, .2)
def printer(d=1.2): x = tt(d); return norm(bp(noise(d), 1500, 6000) * (np.sin(2 * np.pi * 18 * x) > 0)) * env(d, .02, .1)
def clickc(): return norm(hp(noise(.02), 3000)) * np.exp(-tt(.02) * 200)
def pin(): d = .12; return norm(sweep(900, 300, d)) * np.exp(-tt(d) * 30)
def radio(d=.9): x = tt(d); return norm(bp(noise(d), 900, 3000) * (np.sin(2 * np.pi * 7 * x) > -.2)) * env(d, .02, .1)
def coins_(n=10):
    out_ = np.zeros(int(SR * (n * .06 + .5)))
    for k in range(n):
        c = ding()[:int(.4 * SR)] * .5; i = int(k * .06 * SR); out_[i:i + len(c)] += c[:len(out_) - i]
    return out_
put(sfx, coins_(8), F(6.96), .04)                                                      # million-dollar pieces
put(sfx, printer(1.4), F(21.6), .05); put(sfx, pocket(), F(23.18), .12)                # the printer... slip into pocket
put(sfx, coins_(12), F(27.41), .04)                                                    # claim this prize
for k in range(6): put(sfx, ding() * .4, F(32.85) + k * .1, .03)                      # twenty-four million
put(sfx, radio(1.0), F(37.3), .05)                                                      # a tip reached the FBI
for k in range(3): put(sfx, clickc(), F(39.6) + k * .45, .1)                           # surveillance photos
for k in range(4): put(sfx, pin(), F(42.0) + k * .3, .06)                              # every trail (pins + string)
put(sfx, clickc(), F(46.92), .14); put(sfx, clickc(), F(47.05), .12)                   # handcuffs

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-16.5 / 20)
sfx = sfx * 2.2
mix = (v + sfx + mus) * .84
fade = np.ones(N); fl = int(.06 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
