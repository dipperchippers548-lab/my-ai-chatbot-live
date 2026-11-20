"""Sound + original music for "How a Man Mailed Himself Across the World" -> build/mix.wav.
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

# ===== MUSIC: bright "adventure" groove that never stops (plucked guitar arps, glock hook, soft drums); minor + ticking for the Paris danger =====
def gtr(m, d=.5): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .45 * np.sin(4 * np.pi * f * x) * np.exp(-x * 6) + .2 * np.sin(6 * np.pi * f * x) * np.exp(-x * 9)) * np.exp(-x * 5) * np.minimum(1, x / .002)
def glock(m, d=.7): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + .25 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 12)) * np.exp(-x * 4.5)
def bss(m, d): x = tt(d); return np.tanh(1.6 * np.sin(2 * np.pi * hz(m) * x)) * np.minimum(1, x / .008) * np.exp(-x * 2.2)
def kck(): x = tt(.25); return np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-x * 35)) / SR) * np.exp(-x * 12)
def snp(): d = .12; return norm(bp(noise(d), 1500, 6000)) * np.exp(-tt(d) * 32) * .8 + np.sin(2 * np.pi * 220 * tt(d)) * np.exp(-tt(d) * 40) * .3
def hat(o=False): d = .18 if o else .04; return norm(hp(noise(d), 7000)) * np.exp(-tt(d) * (14 if o else 90))
def padc(ms, d): x = tt(d); return sum(np.sin(2 * np.pi * hz(m) * x) + .3 * np.sin(2 * np.pi * hz(m) * 2 * x) for m in ms) / len(ms) * env(d, .4, .6)
END = DUR
BPM = 108; b = 60 / BPM; BAR = 4 * b
TENSE0, TENSE1 = F(32.6), F(42.0)          # "Then things went wrong" ... "No room to move"
MAJ = [(48, [60, 64, 67, 72]), (43, [59, 62, 67, 71]), (45, [60, 64, 69, 72]), (41, [60, 65, 69, 72])]      # C  G  Am  F
MIN = [(45, [57, 60, 64, 69]), (41, [57, 60, 65, 69]), (43, [55, 59, 62, 67]), (40, [56, 59, 64, 68])]      # Am F  G  E
HOOK = [76, 79, 81, 79, 76, 74, 72, 74]
t = 0.0; bar = 0
while t < END:
    tense = TENSE0 <= t < TENSE1; root, ch = (MIN if tense else MAJ)[bar % 4]
    pat = [0, 2, 1, 3, 2, 1, 3, 2]
    for k in range(8): put(mus, gtr(ch[pat[k]], b * 1.2), t + k * b / 2, .22 if not tense else .16)
    for off, dur in ((0, 1.4), (1.5, .45), (2, 1.4), (3.5, .45)): put(mus, bss(root - 12 + (0 if off < 2 else (7 if off == 3.5 else 0)), b * dur), t + off * b, .42)
    if tense:
        for k in range(16): put(mus, hat(), t + k * b / 4, .05 + .03 * (k % 4 == 0))
        for off in (0, 2): put(mus, kck(), t + off * b, .45)
        put(mus, padc([m - 12 for m in ch], BAR), t, .12)
    else:
        for off in (0, 1.5, 2, 2.75): put(mus, kck(), t + off * b, .5 if off in (0, 2) else .3)
        for off in (1, 3): put(mus, snp(), t + off * b, .32)
        for k in range(8): put(mus, hat(k % 2 == 1 and k == 7), t + k * b / 2, .06 + .03 * (k % 2))
        if bar % 4 in (0, 2) and bar >= 1:
            for k, m in enumerate(HOOK): put(mus, glock(m + (2 if bar % 8 == 2 else 0), b), t + k * b / 2, .1)
    t += BAR; bar += 1

# ===== SOUND EFFECTS =====
def knock(): d = .14; return norm(lp(noise(d), 1200)) * np.exp(-tt(d) * 40) + np.sin(2 * np.pi * 180 * tt(d)) * np.exp(-tt(d) * 35) * .5
def hammer(): d = .2; x = tt(d); return (np.sin(2 * np.pi * 1900 * x) * .5 + np.sin(2 * np.pi * 3300 * x) * .3) * np.exp(-x * 35) + knock() [:int(d * SR)] if False else (np.sin(2 * np.pi * 1900 * tt(.2)) * .5 + np.sin(2 * np.pi * 3300 * tt(.2)) * .3) * np.exp(-tt(.2) * 35) + np.pad(knock(), (0, int(.2 * SR) - len(knock())))
def engine(d): x = tt(d); return norm(lp(noise(d), 500) + .3 * np.sin(2 * np.pi * 70 * x) * (1 + .3 * np.sin(2 * np.pi * 9 * x))) * env(d, .6, .8)
def coin(): return np.concatenate([marimba(91, .1), marimba(96, .45)])
def creak(d=.6): x = tt(d); return norm(bp(noise(d), 300, 1200) * (np.sin(2 * np.pi * np.cumsum(9 + 6 * np.sin(2 * np.pi * 1.5 * x)) / SR) > .6)) * env(d, .05, .2)
def saw_(d=1.0): x = tt(d); return norm(bp(noise(d), 1500, 5000) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 3 * x)))) * env(d, .05, .2)
def screech(): d = .7; return norm(bp(noise(d), 2000, 4000) * (1 + np.sin(2 * np.pi * 30 * tt(d)))) * env(d, .05, .4)
def thud_(): x = tt(.4); return np.sin(2 * np.pi * np.cumsum(60 + 50 * np.exp(-x * 20)) / SR) * np.exp(-x * 8)
def steps(n, gap=.32): o = np.zeros(int(SR * (n * gap + .2)))
    # (filled below)
def steps(n, gap=.32):
    o = np.zeros(int(SR * (n * gap + .2)))
    for k in range(n): s = knock() * .5; i = int(k * gap * SR); o[i:i + len(s)] += s[:len(o) - i]
    return o
def crowd(d): x = tt(d); return norm(bp(noise(d), 300, 2500) * (.7 + .3 * np.sin(2 * np.pi * 2.3 * x))) * env(d, .3, .4)
put(sfx, creak(), F(4.3), .1)                                                         # wooden box
put(sfx, whoosh(.3), F(12.5), .08)
for k in range(5): put(sfx, hammer(), F(17.3) + k * .28, .1)                         # building the crate
put(sfx, coin(), F(24.1), .08)                                                        # cash on delivery
for k in range(4): put(sfx, hammer(), F(29.25) + k * .2, .13)                        # nailed shut
put(sfx, engine(2.6), F(31.3), .18)                                                   # cargo plane
put(sfx, screech(), F(44.2), .08); put(sfx, thud_(), F(44.3), .25)                   # landed in Perth
put(sfx, saw_(1.0), F(47.1), .1); put(sfx, creak(), F(48.0), .12)                    # cut his way out
put(sfx, steps(5), F(48.6), .14)                                                      # walked out
put(sfx, crowd(2.2), F(64.3), .06)                                                    # the club

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
