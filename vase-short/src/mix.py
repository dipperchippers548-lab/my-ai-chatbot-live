"""Sound + original music for "You Broke Your Mom's Favorite Vase" -> build/mix.wav.
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

# ===== MUSIC: calm elevator bossa (the joke: lounge music while everything goes wrong) =====
def keys(m, d=1.2): x = tt(d); f = hz(m); return sum(a * np.sin(2 * np.pi * f * k * x) * np.exp(-x * (1.6 + k * 1.4)) for k, a in ((1, 1), (2, .35), (3, .12))) * np.minimum(1, x / .004) * (1 + .15 * np.sin(2 * np.pi * 5 * x))
def bbass(m, d): x = tt(d); return (np.sin(2 * np.pi * hz(m) * x) + .2 * np.sin(4 * np.pi * hz(m) * x)) * np.minimum(1, x / .006) * np.exp(-x * 2.5)
def rim(): d = .05; return norm(bp(noise(d), 1500, 4000)) * np.exp(-tt(d) * 90) + np.sin(2 * np.pi * 1700 * tt(d)) * np.exp(-tt(d) * 70) * .5
def brush(): d = .12; return norm(bp(noise(d), 3000, 9000)) * env(d, .03, .08)
def vib(m, d=.6): x = tt(d); f = hz(m); return np.sin(2 * np.pi * f * x) * np.exp(-x * 4) * (1 + .4 * np.sin(2 * np.pi * 6 * x))
END = F(50.7)                                    # music stops dead on "You're grounded"
BPM = 104; b = 60 / BPM
CH = [(51, [55, 58, 62, 65]), (56, [60, 63, 67, 70]), (50, [53, 57, 60, 65]), (55, [58, 62, 65, 69])]   # Ebmaj9  Abmaj7  Dm7b5-ish  Gm7
MEL = [70, None, 72, 74, None, 70, 67, None, 69, None, 65, None, 67, 70, None, None]
t = 0.0; bar = 0
while t < END:
    root, ch = CH[bar % 4]
    for k, off in enumerate((0, 1.5, 2, 3.5)):                                             # bossa bass: root - fifth pattern
        n = root - 12 + (7 if k % 2 else 0); put(mus, bbass(n, b * 1.4), t + off * b, .5)
    for off in (0, 1.5, 2.5): put(mus, sum(keys(m, b * 1.6) for m in ch) / 3, t + off * b, .32)   # comping chords
    for k in range(8): put(mus, brush(), t + k * b / 2, .07 + .04 * (k % 2))
    for off in (.5, 1.5, 2.75, 3.5): put(mus, rim(), t + off * b, .09)
    if bar >= 2:
        for k, m in enumerate(MEL[(bar % 2) * 8:(bar % 2) * 8 + 8]):
            if m: put(mus, vib(m, b * 1.2), t + k * b / 2, .16)
    t += 4 * b; bar += 1
fo = int(.05 * SR); i = int(END * SR); mus[i:i + fo] *= np.linspace(1, 0, fo); mus[i + fo:] = 0
put(mus, sum(keys(m, 2.2) for m in (63, 67, 70, 74)) / 2, F(55.41), .9)                 # cheesy "ta-da" chord on "fucking genius"
put(mus, vib(82, 1.4), F(55.5), .35)

mus[:] = 0   # user: no music on this one (voice + sfx only)

# ===== SOUND EFFECTS =====
def glass():
    d = .7; s = norm(hp(noise(d), 2500)) * np.exp(-tt(d) * 9) * .8
    for k in range(12): f = 2500 + rs.rand() * 4000; o = rs.rand() * .3; p = np.sin(2 * np.pi * f * tt(.25)) * np.exp(-tt(.25) * 22); i = int(o * SR); s[i:i + len(p)] += p[:len(s) - i] * .35
    return s
def crash(): d = .5; return norm(lp(noise(d), 900)) * np.exp(-tt(d) * 10) + glass()[:int(d * SR)] * .7
def squirt(): d = .4; return norm(bp(noise(d), 400, 1600)) * env(d, .03, .2) * (np.sin(2 * np.pi * 14 * tt(d)) > -.3)
def squelch(): d = .3; return norm(lp(noise(d), 500) * np.sin(2 * np.pi * np.cumsum(80 + 200 * tt(d)) / SR)) * env(d, .01, .2)
def clank(): x = tt(.6); return (np.sin(2 * np.pi * 610 * x) + .6 * np.sin(2 * np.pi * 1530 * x) + .3 * np.sin(2 * np.pi * 2710 * x)) * np.exp(-x * 9)
def digthud(): d = .25; return norm(lp(noise(d), 400)) * np.exp(-tt(d) * 16) + norm(bp(noise(d), 1000, 3000)) * np.exp(-tt(d) * 30) * .3
def tap(): return norm(hp(noise(.015), 3000)) * np.exp(-tt(.015) * 250)
def notif(): return np.concatenate([marimba(88, .12), marimba(95, .4)])
def engine(d=1.6): x = tt(d); return lp(np.sign(np.sin(2 * np.pi * (38 - 12 * x / d) * x)) * .5 + noise(d) * .4, 600) * env(d, .3, .5)
def doorslam(): d = .3; return norm(lp(noise(d), 300)) * np.exp(-tt(d) * 20)
def recstop(): d = .5; x = tt(d); return np.sin(2 * np.pi * np.cumsum(400 * (1 - x / d) ** 2 + 30) / SR) * env(d, .005, .1)
def thudd(): x = tt(.4); return np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-x * 20)) / SR) * np.exp(-x * 9)
put(sfx, crash(), F(0.05), .22)                                                       # the vase hits the floor (first frame)
put(sfx, squirt(), F(5.27), .08)                                                      # glue
put(sfx, crash() * .6, F(7.44), .14)                                                  # falls the fuck apart
put(sfx, squirt(), F(9.3), .1); put(sfx, squelch(), F(13.3), .12)                     # superglue... stuck hand
put(sfx, whoosh(.3, 300, 2500), F(16.9), .1); put(sfx, crash(), F(18.05), .25)        # swings into the TV
put(sfx, recstop() * .5, F(21.2), .0)
for k in range(5): put(sfx, tap(), F(22.99) + k * .09, .1)                            # ordering online
put(sfx, notif(), F(25.0), .09)                                                       # "Arriving in 3-5 business days"
put(sfx, squelch(), F(31.5), .14); put(sfx, squelch(), F(35.3), .1)                   # mud
put(sfx, clank(), F(36.8), .1)                                                        # shovel
for tw in (37.88, 39.07, 40.71): put(sfx, digthud(), F(tw), .2)                     # dig. dig. fucking dig.
put(sfx, engine(1.4), F(41.9), .1); put(sfx, doorslam(), F(43.3), .14)                # car pulls in
put(sfx, thudd(), F(50.92), .3)                    # "You're grounded" - music dies
put(sfx, ding() * .5, F(55.41), .05)

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
