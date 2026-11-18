"""Sound + original music for "He Bet His Life Savings He Could Beat One Guy" -> build/mix.wav.
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
END = F(78.6)
# ---- a NEW sound for this one: boom-bap drums + 808, piano, strings, brass (A minor) ----
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def piano(m, d=1.4): x = tt(d); f = hz(m); return sum(a * np.sin(2 * np.pi * f * k * x) * np.exp(-x * (1.6 + k * 1.4)) for k, a in ((1, 1), (2, .45), (3, .22), (4, .1))) * np.minimum(1, x / .004)
def strings(ms, d): return norm(sum(lp(saw(m, d) + saw(m + .12, d) + saw(m - .1, d), 1500) for m in ms)) * env(d, min(.6, d / 3), min(.8, d / 3))
def brassc(ms, d=.4): return norm(sum(lp(saw(m, d) + saw(m + .08, d), 2400) for m in ms)) * env(d, .015, .2)
def k808(m=33, d=.55): x = tt(d); f = hz(m) * (1 + 1.5 * np.exp(-x * 40)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 4) * np.minimum(1, x / .002)
def bkick(): x = tt(.22); return np.tanh(2.5 * np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-x * 35)) / SR) * np.exp(-x * 13))
def bsnare(): x = tt(.22); return norm(bp(noise(.22), 1200, 6000) * np.exp(-x * 16) + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 25) * .8)
def bhat(o=False): d = .18 if o else .05; return norm(hp(noise(d), 7500)) * np.exp(-tt(d) * (18 if o else 75))
CH = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]       # Am  F  C  G
def beat(t0, t1, bpm=88, g=1.0, keys=True, bass=True, drums=True, light=False):
    s16 = 60 / bpm / 4; t = t0; k = 0
    while t < t1 - .05:
        bar = k // 16; root, ch = CH[bar % 4]; st = k % 16; sw = s16 * .18 if st % 2 else 0
        if drums:
            if st in (0, 7, 10) and not (light and st == 7): put(mus, bkick(), t, .5 * g)
            if st in (4, 12) and not light: put(mus, bsnare(), t, .32 * g)
            if st % 2 == 0: put(mus, bhat(st == 14), t + sw, (.07 if st % 4 else .1) * g)
        if bass and st in (0, 10): put(mus, k808(root - 12, s16 * (8 if st == 0 else 5)), t, .55 * g)
        if keys and st == 0: [put(mus, piano(m, 1.6), t + i * .012, .1 * g) for i, m in enumerate(ch)]
        if keys and st == 8: put(mus, piano(ch[-1] + 12, .8), t, .07 * g)
        t += s16; k += 1
def lonely(t0, t1, bpm=70, g=1.0):          # just a slow piano, arpeggiated
    b = 60 / bpm; t = t0; k = 0
    while t < t1 - .05:
        root, ch = CH[(k // 4) % 4]; m = [root + 12, ch[0], ch[1], ch[2]][k % 4]; put(mus, piano(m, 2.0), t, .16 * g); t += b; k += 1
def anthem(t0, t1, bpm=124, g=1.0):         # training montage: four-on-the-floor, brass stabs climbing, strings swelling
    b = 60 / bpm; t = t0; k = 0; d = t1 - t0
    put(mus, strings([57, 64, 69, 72], d) * np.linspace(.4, 1, int(d * SR)), t0, .1 * g)
    while t < t1 - .05:
        put(mus, bkick(), t, .45 * g); put(mus, bhat(), t + b / 2, .09 * g)
        if k % 2: put(mus, bsnare(), t, .3 * g)
        bar = k // 4; root, ch = CH[bar % 4]
        if k % 4 == 0: put(mus, k808(root - 12, b * 3.5), t, .45 * g)
        if k % 4 in (0, 3): put(mus, brassc([m + 12 + (bar // 4) * 2 for m in ch], .3 if k % 4 else .45), t + (b / 2 if k % 4 == 3 else 0), .14 * g)
        t += b; k += 1
def tension(t0, t1, g=1.0):                 # the staredown: low drone + heartbeat
    d = t1 - t0; x = tt(d); put(mus, (np.sin(2 * np.pi * 55 * x) + .5 * np.sin(2 * np.pi * 82.5 * x * (1 + .002 * np.sin(x)))) * env(d, 1.0, 1.0), t0, .22 * g)
    for t in np.arange(t0 + .3, t1 - .3, .8): put(mus, k808(28, .25), t, .4 * g); put(mus, k808(28, .25), t + .24, .28 * g)
beat(0, F(7.0), g=1.0)                                  # fight night
beat(F(9.7), F(18.5), g=.95)                            # every year, same ring
beat(F(18.5), F(23.4), g=.7, light=True, keys=False)    # selling the couches (stripped down)
lonely(F(23.4), F(30.4), g=.9)                          # wife, dog... goldfish
anthem(F(30.4), F(38.8), g=1.05)                        # TRAINING MONTAGE
tension(F(38.8), F(52.3))                               # the staredown
d = F(56.4) - F(52.6); put(mus, strings([45, 52, 57, 64], d) * np.linspace(.2, 1, int(d * SR)) ** 2, F(52.6), .12)   # the swing (slow-mo swell)... then silence
lonely(F(59.6), F(74.7), bpm=76, g=.8); d = F(74.7) - F(64.4); put(mus, strings([57, 60, 64, 69], d), F(64.4), .07)   # the shoebox: piano + strings
beat(F(75.9), END + .8, g=1.05)                         # REMATCH: the beat slams back in
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
def bell(): x = tt(1.6); return (np.sin(2 * np.pi * 820 * x) + .6 * np.sin(2 * np.pi * 2210 * x) + .3 * np.sin(2 * np.pi * 3390 * x)) * np.exp(-x * 2.5)
def punch(): d = .18; return norm(lp(noise(d), 1200) * np.exp(-tt(d) * 30) + sweep(160, 60, d) * np.exp(-tt(d) * 18))
def boom(): d = 1.4; return norm(sweep(70, 30, d) * np.exp(-tt(d) * 3) + lp(noise(d), 300) * np.exp(-tt(d) * 4) * .5)
def cash(): return np.concatenate([np.sin(2 * np.pi * 2600 * tt(.08)) * np.exp(-tt(.08) * 30), np.zeros(int(.03 * SR)), ding()[:int(.5 * SR)] * .6])
def blub(): d = .12; return sweep(300, 900, d) * np.exp(-tt(d) * 25)
def crack(): return norm(hp(noise(.06), 1500)) * np.exp(-tt(.06) * 60)
bed(0, F(9.7), 'crowd', .03); bed(F(38.8), F(58.0), 'crowd', .02); bed(F(58.6), F(59.8), 'crowd', .07)
put(sfx, bell(), F(6.1), .07)                                                                   # ding ding
put(sfx, punch(), F(7.1), .25); put(sfx, boom(), F(7.2), .12)                                   # down in 9 seconds
for t in (10.35, 12.75, 13.9): put(sfx, whoosh(.35, 400, 3000), F(t), .05); put(sfx, punch(), F(t) + .25, .12)   # again, again, every year
for t in (19.5, 20.75, 22.55): put(sfx, cash(), F(t), .05)                                     # car, couch, other couch
put(sfx, sweep(500, 260, .9) * env(.9, .05, .3), F(24.1), .035); put(sfx, blub(), F(27.2), .08); put(sfx, blub(), F(27.5), .06)   # sad... blub blub
for k in range(6): put(sfx, lp(noise(.05), 600) * np.exp(-tt(.05) * 60), F(34.3) + k * .13, .1)   # 4 AM run
put(sfx, crack(), F(35.95), .12)                                                                # raw eggs
for k in range(4): put(sfx, punch(), F(37.3) + k * .22, .15)                                   # punching frozen meat
put(sfx, whoosh(.5, 200, 1500), F(39.1), .05); put(sfx, boom() * .6, F(45.05), .12)            # "you're going DOWN"
put(sfx, bell(), F(52.6), .09)                                                                  # the bell
put(sfx, whoosh(.6, 150, 1500), F(54.4), .1); put(sfx, punch(), F(56.4), .35); put(sfx, boom(), F(56.8), .2)   # swing... CONNECT... floor
put(sfx, norm(lp(noise(.3), 700)) * env(.3, .01, .2), F(63.2), .06)                           # dusty shoebox
for k in range(6): put(sfx, ding() * .5, F(66.1) + k * .06, .025)                             # every dollar
put(sfx, bell(), F(78.3), .08)                                                                  # ...on a rematch. DING
RS = END + .2; put(sfx, kick(), RS + .05, .17); put(sfx, snap(), RS + .19, .16); put(sfx, kick() * .6, RS + .33, .13)   # rimshot
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
