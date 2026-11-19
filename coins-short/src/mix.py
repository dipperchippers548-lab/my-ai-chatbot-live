"""Sound + original music for "Why Coins Have Ridges" -> build/mix.wav.
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
END = F(64.2)
# ---- 1690s London: harpsichord, plucked lute bass, a tavern fiddle jig, brass fanfare (D minor / D major) ----
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def harpsi(m, d=.5): x = tt(d); f = hz(m); return sum(a * np.sign(np.sin(2 * np.pi * f * k * x)) * np.exp(-x * (5 + k * 3)) for k, a in ((1, .5), (2, .3), (3, .15))) * np.minimum(1, x / .001)
def lute(m, d=.6): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .5 * np.sin(4 * np.pi * f * x) * np.exp(-x * 8)) * np.exp(-x * 5) * np.minimum(1, x / .002)
def fiddle(m, d=.25): x = tt(d); return lp(saw(m, d) * (1 + .04 * np.sin(2 * np.pi * 6 * x)), 3500) * env(d, .02, .08)
def brass(ms, d=.6): return norm(sum(lp(saw(m, d) + saw(m + .08, d), 2200) for m in ms)) * env(d, .03, .25)
def drum(): x = tt(.2); return np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-x * 25)) / SR) * np.exp(-x * 12)
DM = [(38, [62, 65, 69]), (34, [62, 65, 70]), (36, [60, 64, 67]), (33, [61, 64, 69])]       # Dm Bb C A
def baroque(t0, t1, bpm=112, g=1.0, minor=True):      # running harpsichord arpeggios over a lute bass
    b = 60 / bpm; t = t0; k = 0
    while t < t1 - .05:
        root, ch = DM[(k // 4) % 4]
        if not minor: ch = [c + (1 if c % 12 == 5 else 0) for c in ch]
        put(mus, lute(root, b * 1.8), t, .5 * g)
        for i in range(4): put(mus, harpsi([ch[0], ch[1], ch[2], ch[1] + 12][i] + 12, .35), t + i * b / 4, .09 * g)
        t += b; k += 1
def jig(t0, t1, bpm=132, g=1.0):                       # tavern: fiddle jig in 6/8, frame drum
    b = 60 / bpm / 2; t = t0; k = 0; mel = [74, 72, 70, 69, 70, 72, 74, 77, 76, 74, 72, 69]
    while t < t1 - .05:
        put(mus, fiddle(mel[k % 12], b * .95), t, .12 * g)
        if k % 3 == 0: put(mus, drum(), t, .3 * g); put(mus, lute(DM[(k // 6) % 4][0], b * 2.5), t, .35 * g)
        t += b; k += 1
def tension(t0, t1, g=1.0):                            # low harpsichord ostinato
    b = 60 / 100 / 2; t = t0; k = 0
    while t < t1 - .05:
        put(mus, harpsi([50, 53, 50, 52][k % 4], .3), t, .14 * g)
        if k % 4 == 0: put(mus, lute(38, .4), t, .2 * g)
        t += b; k += 1
baroque(0, F(15.1), g=1.0)                             # the coin shaver at work
baroque(F(15.1), F(23.2), bpm=118, g=1.05)             # thousands doing it, money shrinking
put(mus, brass([62, 66, 69], 1.2), F(26.85), .25)      # ...Isaac NEWTON (ta-daa)
jig(F(28.1), F(34.7), g=1.0)                           # the coin gangs laughing in the tavern
tension(F(34.7), F(40.4), g=1.0)                       # Newton undercover
baroque(F(40.4), F(52.4), bpm=124, g=1.1, minor=False); put(mus, brass([62, 66, 69, 74], 1.0), F(40.45), .2)   # the REAL fix
d = F(56.0) - F(52.45); x = tt(d); put(mus, norm(np.sin(2 * np.pi * hz(50) * x) + .5 * np.sin(2 * np.pi * hz(57) * x)) * env(d, .2, .3), F(52.45), .1)   # your quarter... today
tension(F(56.0), F(60.2), g=.9)                        # prison
baroque(F(60.2), END + .3, g=.9)                       # ...a man in London who got rich (loops)

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
def snip(): d = .08; return norm(hp(noise(d), 3000)) * np.exp(-tt(d) * 60)
def clink(): x = tt(.4); return (np.sin(2 * np.pi * 3100 * x) + .6 * np.sin(2 * np.pi * 4700 * x)) * np.exp(-x * 12)
def sizzle(d=1.0): return norm(hp(noise(d), 3000)) * env(d, .05, .5) * (.7 + .3 * np.sin(2 * np.pi * 13 * tt(d)))
def stamp(): d = .5; return norm(sweep(90, 40, d) * np.exp(-tt(d) * 9) + lp(noise(d), 800) * np.exp(-tt(d) * 20) * .6)
def clang(): x = tt(1.2); return norm(sum(np.sin(2 * np.pi * f * x) for f in (220, 347, 590, 830)) * np.exp(-x * 3) + lp(noise(1.2), 1500) * np.exp(-x * 20))
def laughs(d=1.6): x = tt(d); return norm(bp(noise(d), 300, 2500) * (np.abs(np.sin(2 * np.pi * 4.5 * x)) ** 2)) * env(d, .05, .5)
bed(F(28.1), F(40.4), 'crowd', .03)
for k in range(3): put(sfx, clink(), F(3.2) + k * .18, .05)                                 # ...got rich (coins)
for k in range(3): put(sfx, snip(), F(9.4) + k * .2, .12)                                   # clip a tiny sliver
put(sfx, clink(), F(11.8), .05); put(sfx, sizzle(1.0), F(13.3), .05)                        # spend it... melt it down
for k in range(10): put(sfx, clink(), F(17.8) + k * .14, .025)                             # thousands of people
put(sfx, sweep(600, 200, 1.0) * env(1.0, .05, .3), F(21.6), .04)                           # money shrinking
put(sfx, laughs(), F(29.2), .07)                                                            # the coin gangs laughed
put(sfx, laughs(1.0), F(34.3), .06)
put(sfx, whoosh(.4, 300, 2500), F(35.3), .06)                                               # disguises
for k in range(3): put(sfx, stamp(), F(44.0) + k * .45, .2)                                 # ridges stamped
put(sfx, snip(), F(46.2), .1); put(sfx, sweep(1800, 600, .4) * env(.4, .01, .2), F(48.5), .05)   # shave... ridges vanish
for k in range(4): put(sfx, ding() * .5, F(53.4) + k * .07, .03)                           # your quarter
put(sfx, clang(), F(59.2), .1)                                                              # prison door
put(sfx, whoosh(.5, 200, 2000), F(63.5), .05)                                               # loop back

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
