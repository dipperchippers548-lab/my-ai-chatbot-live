"""Sound + original music for "The Cat Who Came Home Fatter Every Night" -> build/mix.wav.
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
END = F(60.2)
# ---- a NEW sound again: pizzicato strings + glockenspiel + tuba + brushed jazz (F major) ----
def saw(m, d): x = tt(d); return 2 * ((hz(m) * x) % 1) - 1
def pizz(m, d=.35): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .4 * np.sin(4 * np.pi * f * x) * np.exp(-x * 20) + .2 * np.sin(6 * np.pi * f * x) * np.exp(-x * 30)) * np.exp(-x * 11) * np.minimum(1, x / .002)
def glock(m, d=.9): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .35 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 9)) * np.exp(-x * 3.5)
def tuba(m, d=.45): x = tt(d); return lp(saw(m, d) + .6 * saw(m - 12, d), 380) * env(d, .03, .2) * (1 + .15 * np.sin(2 * np.pi * 5 * x))
def wbass(m, d): x = tt(d); return np.sin(2 * np.pi * hz(m) * x) * np.exp(-x * 2.2) * np.minimum(1, x / .004)
def brush(d=.25): return norm(bp(noise(d), 2500, 9000)) * env(d, .05, .15)
def bkick(): x = tt(.18); return np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-x * 30)) / SR) * np.exp(-x * 16)
FCH = [(41, [65, 69, 72]), (38, [62, 65, 69]), (46, [65, 70, 74]), (48, [64, 67, 72])]      # F  Dm  Bb  C
def cute(t0, t1, bpm=112, g=1.0, glk=True, drums=True):        # bouncy pizzicato, glockenspiel melody on top
    b = 60 / bpm; t = t0; k = 0; mel = [72, 74, 76, 79, 77, 76, 74, 72]
    while t < t1 - .05:
        root, ch = FCH[(k // 4) % 4]
        put(mus, pizz(root, .4), t, .5 * g); put(mus, pizz(ch[(k * 2) % 3] + 12 * (k % 2), .3), t + b / 2, .3 * g)
        if glk and k % 2 == 0: put(mus, glock(mel[(k // 2) % 8] + 12, .8), t, .07 * g)
        if drums: put(mus, bkick(), t, .25 * g) if k % 2 == 0 else put(mus, brush(.12), t, .06 * g)
        t += b; k += 1
def jazz(t0, t1, bpm=126, g=1.0):                              # vet visit: walking bass + brushes
    b = 60 / bpm; t = t0; k = 0
    while t < t1 - .05:
        root, ch = FCH[(k // 4) % 4]; put(mus, wbass(root - 12 + [0, 4, 7, 9][k % 4], b * 1.1), t, .55 * g); put(mus, brush(.3), t, .07 * g)
        if k % 4 == 3: put(mus, pizz(ch[0], .3) + pizz(ch[2], .3), t + b * .66, .18 * g)
        t += b; k += 1
def spy(t0, t1, bpm=96, g=1.0):                                # collar cam at night: low creeping pizz
    b = 60 / bpm; t = t0; k = 0; line = [38, None, 41, 43, None, 44, 43, 41]
    while t < t1 - .05:
        n = line[k % 8]
        if n: put(mus, pizz(n, .5), t, .55 * g); put(mus, pizz(n + 12, .3), t, .15 * g)
        if k % 4 == 0: put(mus, bkick(), t, .18 * g)
        t += b / 2; k += 1
def warm(t0, t1, g=1.0):                                       # the reveal: soft strings bed
    d = t1 - t0; put(mus, norm(sum(lp(saw(m, d) + saw(m + .1, d), 1300) for m in (53, 60, 65, 69))) * env(d, .6, .8), t0, .1 * g)
cute(0, F(15.15), g=1.0)                       # every night... a little fatter / cat door / the diet
put(mus, tuba(34, .7), F(15.2), .5)             # "Biscuit got fatter." BWOMP
jazz(F(16.9), F(21.6), g=.9)                    # the vet
jazz(F(22.3), F(24.3), g=.9)                    # (drops out for "Sir...")
cute(F(24.3), F(32.0), bpm=118, g=1.05)         # hiding the food, beanbag with legs
put(mus, tuba(34, .5), F(30.35), .45); put(mus, tuba(29, .8), F(30.85), .5)    # bwomp... bwomp
spy(F(32.0), F(42.3), g=1.0)                    # the collar cam, night walk
warm(F(42.3), F(49.0), g=.8); put(mus, glock(84, 1.4) + glock(88, 1.4), F(44.3), .12)   # the door opens: "There you are!"
cute(F(49.0), END + .6, bpm=112, g=.95); warm(F(49.0), F(55.9), g=.7)   # two families, two names, two dinners
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
def squeak(d=.35): return sweep(900, 1600, d) * env(d, .02, .1) * (np.sin(2 * np.pi * 18 * tt(d)) > -.3)
def scratchs(): d = .5; return norm(bp(noise(d), 1500, 6000) * (np.sin(2 * np.pi * 9 * tt(d)) > 0)) * env(d, .02, .1)
def purr(d=1.4): x = tt(d); return norm(lp(noise(d), 200) * (.6 + .4 * np.sin(2 * np.pi * 24 * x))) * env(d, .2, .4)
def munch(): d = .14; return norm(bp(noise(d), 600, 3000)) * np.exp(-tt(d) * 25)
def creak(): d = .8; return norm(bp(saw(40, d) * (1 + .5 * np.sin(2 * np.pi * 3 * tt(d))), 300, 1800)) * env(d, .05, .3)
def boing(): d = .45; return sweep(180, 420, d) * np.exp(-tt(d) * 6) * (1 + .5 * np.sin(2 * np.pi * 14 * tt(d)))
def clunk(): d = .25; return norm(sweep(500, 300, d) * np.exp(-tt(d) * 18) + lp(noise(d), 1200) * np.exp(-tt(d) * 30) * .5)
bed(0, F(3.9), 'crickets', .01); bed(F(32.0), F(42.3), 'crickets', .012)
put(sfx, ding() * .5, F(3.77), .05)                                                     # "...fatter." ding
for k in range(3): put(sfx, squeak(.25), F(10.1) + k * .3, .06)                         # stuck in the cat door
put(sfx, boing(), F(10.81), .08)
put(sfx, ding() * .4, F(13.14), .04); put(sfx, popsnd(), F(14.13), .06)                 # half a scoop... no treats
for k in range(3): put(sfx, munch(), F(23.26) + k * .16, .05)                           # cheeseburgers?
put(sfx, whoosh(.4, 300, 2500), F(24.64), .06); put(sfx, clunk(), F(25.0), .08)          # hid every crumb
put(sfx, boing(), F(30.35), .1)                                                          # beanbag
put(sfx, click(), F(32.81), .12); put(sfx, scanbeep(1800, .1), F(33.76), .05)          # clip... beep, camera on
for k in range(3): put(sfx, squeak(.2), F(37.3) + k * .22, .05)                         # squeezed under the fence
for k in range(8): put(sfx, lp(noise(.05), 500) * np.exp(-tt(.05) * 60), F(38.85) + k * .19, .08)   # waddle waddle
put(sfx, scratchs(), F(40.9), .08)                                                       # scratch scratch
put(sfx, creak(), F(42.94), .06)                                                         # door creaks open
put(sfx, clunk(), F(46.67), .12); put(sfx, purr(1.6), F(47.2), .06)                     # bowl of salmon... purrrr
for k in range(4): put(sfx, ding() * .4, F(51.98) + k * 1.0 + (k > 1) * .0, .025)       # two... two... two
put(sfx, ding() * .5, F(57.63), .04)                                                     # vet bill
for k in range(4): put(sfx, munch(), F(59.41) + k * .15, .07)                           # still eats twice: munch munch
put(sfx, norm(tuba(34, .4)), END + .25, .1); put(sfx, norm(tuba(29, .7)), END + .7, .12)             # bwomp bwomp
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
