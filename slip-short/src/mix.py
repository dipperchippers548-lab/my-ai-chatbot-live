"""Sound for "You Slipped on a Wet Floor at Work" -> build/mix.wav.
Times are final (edited) seconds; F(t) maps a voiceover-clock time, exactly like main.js."""
import numpy as np, wave, json
from scipy.signal import butter, lfilter
SR = 44100; C = json.load(open('build/cuts.json'))
def F(t): return (t - sum(min(t, b) - a for a, b in C['cuts'] if t > a)) / C['speed'] + C.get('offset', 0)
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

# ===== no music (this format runs on voice + sfx) =====
# ===== SOUND EFFECTS =====
def tick(): return norm(hp(noise(.01), 3000)) * np.exp(-tt(.01) * 300)
def kaching(): return np.concatenate([norm(bp(noise(.08), 2000, 6000)) * .5, marimba(96, .1) + marimba(100, .1), marimba(103, .5)])
def steps(n=8, gap=.15):
    o = np.zeros(int(SR * (n * gap + .3)))
    for k in range(n): s_ = norm(bp(noise(.08), 150, 1500)) * np.exp(-tt(.08) * 40); i = int(k * gap * SR); o[i:i + len(s_)] += s_
    return o
def creak(d=.7): x = tt(d); f = 180 + 60 * np.sin(2 * np.pi * 7 * x) + 120 * x / d; return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500)) * env(d, .05, .2)
def boing(): d = .5; x = tt(d); return np.sin(2 * np.pi * np.cumsum(300 + 200 * x / d + 60 * np.sin(2 * np.pi * 14 * x) * np.exp(-x * 3)) / SR) * np.exp(-x * 5)
def drip(): d = .12; x = tt(d); return np.sin(2 * np.pi * np.cumsum(500 + 1400 * x / d) / SR) * np.exp(-x * 30)
def organ(): d = 1.3; x = tt(d); return lp(sum(np.sign(np.sin(2 * np.pi * hz(m) * x)) * .5 + np.sin(2 * np.pi * hz(m) * 2 * x) for m in (60, 64, 67, 72)), 2500) / 6 * env(d, .03, .5)
def stamp(): d = .25; return norm(lp(noise(d), 900)) * np.exp(-tt(d) * 25) + norm(bp(noise(d), 1500, 4000)) * np.exp(-tt(d) * 60) * .5
def scribble(d=1.4): x = tt(d); return norm(bp(noise(d), 2500, 7000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 9 * x)))) * env(d, .03, .1)
def cricket(d=1.2):
    o = np.zeros(int(d * SR))
    for k in range(int(d / .35)):
        for j in range(3): s_ = np.sin(2 * np.pi * 4400 * tt(.03)) * np.exp(-tt(.03) * 60); i = int((k * .35 + j * .045) * SR); o[i:i + len(s_)] += s_
    return o
def scratch(): d = .45; x = tt(d); return norm(bp(noise(d), 400, 4000) * np.abs(np.sin(2 * np.pi * 6 * x))) * env(d, .01, .1) + .4 * np.sin(2 * np.pi * np.cumsum(900 - 700 * x / d) / SR) * env(d, .01, .1)
def notif_snd(): return np.concatenate([marimba(88, .12), marimba(95, .4)])
def clank(): x = tt(.7); return (np.sin(2 * np.pi * 620 * x) + .7 * np.sin(2 * np.pi * 1530 * x) + .4 * np.sin(2 * np.pi * 2210 * x)) * np.exp(-x * 8) + norm(lp(noise(.7), 500)) * np.exp(-x * 30)
def dun(): o = []; [o.append(lp(np.sign(np.sin(2 * np.pi * hz(m) * tt(d))), 900) * env(d, .01, .2)) for m, d in ((38, .3), (37, .3), (34, 1.0))]; return norm(np.concatenate(o))
def tap(): return norm(bp(noise(.05), 800, 4000)) * np.exp(-tt(.05) * 90)
def inhale(d=1.2): x = tt(d); return norm(bp(noise(d), 500, 3500)) * (x / d) ** 1.5 * env(d, .1, .15)
def drone(d): x = tt(d); return lp(sum(2 * ((np.cumsum(np.full(len(x), f)) / SR) % 1) - 1 for f in (55, 55.6, 82.5)) * (x / d), 600) * env(d, .3, .1) / 3 + .25 * np.sin(2 * np.pi * np.cumsum(400 + 500 * x / d) / SR) * (x / d) ** 2
def boom(): x = tt(1.6); return np.sin(2 * np.pi * np.cumsum(40 + 90 * np.exp(-x * 8)) / SR) * np.exp(-x * 3) + norm(bp(noise(1.6), 200, 5000)) * np.exp(-x * 6) * .7
def zip_(): d = .4; return sweep(300, 2400, d) * env(d, .01, .1) * .6 + whoosh(d, 600, 5000) * .6
def slam(): d = .5; return norm(lp(noise(d), 700)) * np.exp(-tt(d) * 14) + norm(bp(noise(d), 1500, 5000)) * np.exp(-tt(d) * 40) * .6
def blip(): return sweep(500, 1500, .12) * np.exp(-tt(.12) * 20)
def chime(): return np.concatenate([marimba(79, .15), marimba(84, .15), marimba(91, .6)])
def squeak(): d = .35; x = tt(d); return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(700 + 250 * np.sin(2 * np.pi * 5 * x)) / SR)), 600, 3000)) * env(d, .02, .1)
def thud(): d = .3; return norm(lp(noise(d), 400)) * np.exp(-tt(d) * 20) + np.sin(2 * np.pi * 80 * tt(d)) * np.exp(-tt(d) * 15)
def horn(): d = .7; x = tt(d); return norm(bp(np.sign(np.sin(2 * np.pi * np.cumsum(520 + 40 * x / d) / SR)), 400, 4000)) * env(d, .02, .15)
def alarm(): o = np.zeros(int(SR * .9)); [o.__setitem__(slice(int(k * .22 * SR), int(k * .22 * SR) + int(.12 * SR)), np.sign(np.sin(2 * np.pi * 2000 * tt(.12))) * .5) for k in range(4)]; return lp(o, 5000)
def growl(d=.9): x = tt(d); return norm(lp(noise(d), 250) * (1 + np.sin(2 * np.pi * 9 * x))) * env(d, .1, .3)
def womp():
    o = []
    for m, d in ((55, .35), (54, .35), (53, .35), (52, 1.0)): x = tt(d); f = hz(m) * (1 + (.03 * np.sin(2 * np.pi * 6 * x) if d > .5 else 0)); o.append(lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 1500) * env(d, .02, .15))
    return norm(np.concatenate(o))
def warn(): return np.concatenate([np.sin(2 * np.pi * 880 * tt(.18)) * env(.18), np.zeros(int(.06 * SR)), np.sin(2 * np.pi * 660 * tt(.25)) * env(.25)]) * .6
def plink(m): return marimba(m, .2)
def shing(): d = .6; x = tt(d); return (np.sin(2 * np.pi * np.cumsum(3000 + 2000 * x / d) / SR) + .5 * norm(hp(noise(d), 5000))) * np.exp(-x * 6) * .5
def ethereal(d=1.0): x = tt(d); return sum(np.sin(2 * np.pi * np.cumsum(hz(m) * (1 + x / d)) / SR) for m in (72, 76, 79)) / 3 * env(d, .15, .4)
def limp(n=6):
    o = np.zeros(int(SR * (n * .32 + .3)))
    for k in range(n): s_ = norm(bp(noise(.08), 150, 1500)) * np.exp(-tt(.08) * 40) * (1 if k % 2 else .45); i = int((k * .32 + (k % 2) * .12) * SR); o[i:i + len(s_)] += s_
    return o
def coinsPour(d=1.5):
    o = np.zeros(int(d * SR) + SR)
    for k in range(int(d * 30)): x = tt(.15); f = 2500 + rs.rand() * 2500; s_ = (np.sin(2 * np.pi * f * x) + .4 * np.sin(2 * np.pi * f * 1.5 * x)) * np.exp(-x * 30); i = int(rs.rand() * d * SR); o[i:i + len(s_)] += s_ * .5
    return o
def twang(): d = .9; x = tt(d); f = hz(52) * (1 + .06 * np.exp(-x * 4)); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .6 + np.sin(4 * np.pi * np.cumsum(f) / SR), 3000) * np.exp(-x * 4)
put(sfx, squeak(), F(0.0), .25); put(sfx, thud(), F(0.06), .2)                    # cold open: already on the floor
put(sfx, alarm(), F(4.05), .12)                                                     # 6 AM
put(sfx, growl(), F(9.08), .2); put(sfx, womp(), F(12.06), .14)                    # no breakfast... since 2019
put(sfx, creak(.7), F(14.4), .16); put(sfx, drip(), F(15.6), .2); put(sfx, drip(), F(16.1), .16)   # bathroom
put(sfx, dun(), F(17.88), .2); put(sfx, warn(), F(19.04), .2)                      # the sign. CAUTION
put(sfx, ding(), F(22.87), .16)                                                     # funkin' genius
for k, m in enumerate((72, 76, 74, 77, 76, 79)): put(sfx, plink(m), F(27.04) + k * .2, .16)   # tiptoe
put(sfx, shing(), F(29.48), .2)                                                     # ninja
for tw in (31.0, 32.42, 33.43): put(sfx, squeak(), F(tw), .14)                     # one step, two steps, three-
put(sfx, squeak(), F(34.77), .3); put(sfx, whoosh(.5), F(34.9), .25)              # feet go up
put(sfx, ethereal(1.0), F(36.21), .14)                                             # soul leaves your body
put(sfx, thud(), F(39.52), .24); put(sfx, boom(), F(39.52), .12)                    # straight on your ass
put(sfx, limp(5), F(44.22), .2)                                                     # limp to your boss
for tw in (48.03, 53.83, 55.79, 56.76, 58.25, 59.05, 61.76): put(sfx, kaching(), F(tw), .13)   # every hundred bucks
put(sfx, boom(), F(62.77), .12)                                                     # THE WHOLE WORLD
for k in range(6): put(sfx, kaching(), F(71.74) + k * .1, .08)                     # money rains
put(sfx, coinsPour(1.4), F(75.03), .1); put(sfx, kaching(), F(75.53), .14); put(sfx, twang(), F(78.71), .16)   # forty thousand... Texas
put(sfx, zip_(), F(86.37), .25); put(sfx, steps(6, .08), F(86.5), .2); put(sfx, squeak(), F(87.75), .3); put(sfx, thud(), F(88.2), .2)   # runs at it, slips on purpose
put(sfx, ding(), F(88.61), .16)                                                     # Genius.

import os
VOICE = 'build/voice_loud.wav' if os.path.exists('build/voice_loud.wav') else 'build/voice_cut.wav'  # louder, lightly compressed voice
w = wave.open(VOICE); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
WJ = json.load(open('build/words.json')); bw = wave.open('build/beep.wav'); BEEP = np.frombuffer(bw.readframes(bw.getnframes()), dtype=np.int16).astype(float) / 32768; bw.close(); BEEP = BEEP / (np.abs(BEEP).max() + 1e-9)
BLEEPS = []
for i, w in enumerate(WJ):    
    if w['w'].lower().startswith('fucked') and i >= 1 and WJ[i - 1]['w'].lower() == 'he':     # "He [BEEP] your shit up"
        t0 = F(w['s']) - .02; t1 = max(F(w['e']), t0 + len(BEEP) / SR); BLEEPS.append((t0, t1))
        a_, b_ = int(t0 * SR), int(t1 * SR); fade = int(.008 * SR); v[a_:b_] = 0; v[a_ - fade:a_] *= np.linspace(1, 0, fade)
json.dump(BLEEPS, open('build/bleeps.json', 'w')); v = v / np.abs(v).max() * .92
mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 10 ** (-16.5 / 20)
sfx = sfx * 2.2
sfx_b = np.zeros(N)
for t0, t1 in BLEEPS: put(sfx_b, BEEP, t0, .55)
mix = (v + sfx + mus + sfx_b) * .84
fade = np.ones(N); fl = int(.06 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade   # (tiny fade only: it loops)
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("sfx peak at %.2f s" % (np.argmax(np.abs(sfx)) / SR)); print('voice %.1f dB | sfx %.1f dB peak %.2f | music %.1f dB | mix peak %.2f' % (db(v), db(sfx), np.abs(sfx).max(), db(mus), np.abs(mix).max()))
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
np.save('build/sfx.npy', sfx)
