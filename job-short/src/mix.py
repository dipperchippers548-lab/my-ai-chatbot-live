"""Sound + original music for "Your Haircut" -> build/mix.wav.
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
put(sfx, creak(.8), F(0.0), .18); put(sfx, steps(5, .22), F(0.6), .16)           # door, walking in
put(sfx, popsnd(), F(4.62), .3); put(sfx, tick(), F(4.75), .2)                    # a button pops off the tiny suit
put(sfx, boing(), F(6.26), .22)                                                    # tie on backwards
for k in range(5): put(sfx, drip(), F(7.41) + k * .16, .2)                         # sweating
put(sfx, organ(), F(8.75), .16)                                                    # sinner in church
put(sfx, ding(), F(14.16), .16)                                                    # funkin' genius
for tw in (22.59, 24.04, 27.0): put(sfx, stamp(), F(tw), .3)                       # FIRED x3
put(sfx, scribble(1.4), F(28.53), .14); put(sfx, cricket(1.2), F(31.2), .12)      # he writes... "good sign"
for tw in (34.49, 35.63, 36.71, 39.67): put(sfx, popsnd(), F(tw), .25)             # weaknesses
put(sfx, scratch(), F(42.3), .12); put(sfx, notif_snd(), F(43.3), .22); put(sfx, clank(), F(46.63), .2)   # I don't. / mom / gym
put(sfx, scratch(), F(50.63), .12); put(sfx, dun(), F(53.67), .2)                  # in your chair, bro... your job
put(sfx, tap(), F(55.8), .3); put(sfx, inhale(1.0), F(56.9), .2); put(sfx, drone(F(60.5) - F(58.5)), F(58.5), .14)   # pen, breath, stare
put(sfx, boom(), F(60.55), .3)                                                     # FUCK NO
put(sfx, zip_(), F(64.6), .3); put(sfx, steps(10, .07), F(64.8), .22); put(sfx, slam(), F(66.4), .45)   # he sprints out, door slams
put(sfx, blip(), F(67.04), .2); put(sfx, chime(), F(68.2), .18); put(sfx, cricket(1.3), F(69.9), .14)  # coffee, laptop, you
put(sfx, squeak(), F(72.0), .2); put(sfx, thud(), F(74.0), .35)                   # sits, feet up
put(sfx, horn(), F(75.17), .2); put(sfx, kaching(), F(77.22), .14)               # congratulations... boss

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
