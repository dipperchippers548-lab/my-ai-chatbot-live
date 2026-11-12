"""Synthesise the sound effects and music and mix them under the (pause-cut, sped-up) voiceover -> build/mix.wav"""
import numpy as np, wave, json, sys, os
from scipy.signal import butter, lfilter
sys.path.insert(0, os.path.dirname(__file__)); from music import make_music
SR = 44100; CUT = json.load(open('build/cuts.json'))
def tm(t):  # original voiceover time -> final video time
    return (t - sum(min(t, b) - a for a, b in CUT['cuts'] if t > a)) / CUT['speed']
w = wave.open('build/voice_cut.wav'); voice = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
N = int(CUT['duration'] * SR); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]; voice *= 0.84 / np.abs(voice).max()
sfx = np.zeros(N); rs = np.random.RandomState(3)
def put(sig, t, g=1.0):
    i = int(tm(t) * SR); sig = sig[:max(0, N - i)]; sfx[i:i + len(sig)] += sig * g
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None): t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def sweep(f0, f1, d, shape='sin'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) if shape == 'sin' else 2 * ((ph / (2 * np.pi)) % 1) - 1
def blip(f, d=.07): return np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * 45)
def whoosh(d=.3, lo=500, hi=2600): return bp(rs.randn(int(d * SR)), lo, hi) * np.sin(np.pi * tt(d) / d) ** 2
def thud(f=70, d=.18): return (sweep(f * 1.8, f, d) + .4 * lp(rs.randn(int(d * SR)), 400)) * np.exp(-tt(d) * 28)
def tick(f=2400): d = .03; return bp(rs.randn(int(d * SR)), f * .7, f * 1.4) * np.exp(-tt(d) * 160)
def arp(notes, step=.07, d=.5):
    o = np.zeros(int((d + step * len(notes)) * SR))
    for i, f in enumerate(notes): s = np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * 9); k = int(i * step * SR); o[k:k + len(s)] += s
    return o / 2
def vowel(f0a, f0b, d, forms=((800, 1150), (2500, 2900))):
    src = sweep(f0a, f0b, d, 'saw') * (1 + .15 * np.sin(2 * np.pi * 7 * tt(d))); return sum(bp(src, lo, hi) for lo, hi in forms) * env(d, .02, d * .4)
def cluck(): return vowel(520, 380, .09, ((900, 1500), (2200, 3200)))
def coin(): d = .3; t = tt(d); return (np.sin(2 * np.pi * 2637 * t) + .6 * np.sin(2 * np.pi * 3951 * t)) * np.exp(-t * 14)
def plink(): d = .12; return sweep(1400, 2300, d) * np.exp(-tt(d) * 35)
def shimmer(): d = .6; x = sum(sweep(f * 2.2, f, d) for f in (660, 990, 1320)) / 3; return x * env(d, .05, .4) * (.6 + .4 * np.sin(2 * np.pi * 17 * tt(d)))

def squeak(f=900): d = .09; return sweep(f, f * 1.7, d) * env(d, .005, .05)
def boing(f=180): d = .28; t = tt(d); return np.sin(2 * np.pi * f * t * (1 + .5 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 6))) * np.exp(-t * 9)
def popsnd(): d = .1; return sweep(350, 1300, d) * np.exp(-tt(d) * 32)
def buzz(f=110, d=.16): return lp(np.sign(np.sin(2 * np.pi * f * tt(d))), 900) * env(d, .005, .02)
def squelch(): d = .2; return lp(rs.randn(int(d * SR)), 500) * np.sin(np.pi * tt(d) / d) ** 2

def crowd(d, lo=400, hi=2200): x = bp(rs.randn(int(d * SR)), lo, hi) * (.75 + .25 * np.sin(2 * np.pi * .9 * tt(d))); return x / np.abs(x).max()
def crackle(d): x = hp(rs.randn(int(d * SR)), 2500) * (rs.rand(int(d * SR)) > .9985).astype(float); y = lp(np.convolve(x, np.exp(-np.arange(300) / 40), 'same'), 6000); return y / (np.abs(y).max() + 1e-9)
def firework(): return np.concatenate([whoosh(.22, 900, 5000) * .6, hp(rs.randn(int(.3 * SR)), 1800) * np.exp(-tt(.3) * 14) * .5])
def fwoomp(): d = .5; return (lp(rs.randn(int(d * SR)), 500) + sweep(160, 60, d) * .7) * np.sin(np.pi * tt(d) / d) ** .6 * np.exp(-tt(d) * 3)
def clack(): return tick(1300) + .6 * thud(200, .05)[:int(.03 * SR)]
def beep(): d = .09; return np.sin(2 * np.pi * 1000 * tt(d)) * env(d, .005, .02)

def wind(d): x = bp(rs.randn(int(d * SR)), 250, 1400) * (.6 + .4 * np.sin(2 * np.pi * .7 * tt(d) + 1)); return x / np.abs(x).max()
def bpop(): d = .12; return (hp(rs.randn(int(d * SR)), 1200) * np.exp(-tt(d) * 45) + sweep(500, 120, d) * np.exp(-tt(d) * 30) * .6)
def jet(d): x = lp(rs.randn(int(d * SR)), 900) * np.exp(-((tt(d) - d * .45) / (d * .22)) ** 2); y = x + sweep(420, 180, d) * .25 * np.exp(-((tt(d) - d * .45) / (d * .25)) ** 2); return y / np.abs(y).max()
def static(d): return hp(rs.randn(int(d * SR)), 2500) * env(d, .01, .05) * (rs.rand(int(d * SR)) > .3)
def pft(): d = .06; return bp(rs.randn(int(d * SR)), 900, 4000) * np.exp(-tt(d) * 70)
def fall(d): return sweep(1800, 500, d) * env(d, .02, .1)

def stamp(): return thud(90, .12) * .8 + np.pad(tick(1400), (0, int(.12 * SR) - int(.03 * SR))) * .6
def paper(): d = .12; return hp(rs.randn(int(d * SR)), 3000) * np.sin(np.pi * tt(d) / d) ** 2
def whistle(d=.5): t = tt(d); return np.sin(2 * np.pi * 2800 * t + 6 * np.sin(2 * np.pi * 38 * t)) * env(d, .01, .05)
def ring(d=.5): t = tt(d); return (np.sin(2 * np.pi * 1900 * t) + np.sin(2 * np.pi * 2350 * t)) * (np.sin(2 * np.pi * 22 * t) > 0) * env(d, .005, .05)
def horn(d=1.2): t = tt(d); return lp(np.sign(np.sin(2 * np.pi * 98 * t)) + np.sign(np.sin(2 * np.pi * 147 * t)), 500) * env(d, .08, .25)
def murmur(d): x = bp(rs.randn(int(d * SR)), 300, 1100) * (.6 + .4 * np.sin(2 * np.pi * 3.1 * tt(d))); return x / np.abs(x).max()

def bed(t0, t1, g, lo=220, hi=1300):   # steady wind / engine noise between two (original) times
    d = tm(t1) - tm(t0); x = bp(rs.randn(int(d * SR)), lo, hi) * (.7 + .3 * np.sin(2 * np.pi * .9 * tt(d) + t0)); put(x / np.abs(x).max() * env(d, .06, .08), t0, g)
def alarm(t): put(beep(), t, .035); put(beep(), t + .16, .035)
def lubdub(t, g=.1): put(thud(58, .13), t, g); put(thud(50, .11), t + .15, g * .7)
def screech(): d = .5; return bp(rs.randn(int(d * SR)), 1800, 5200) * env(d, .01, .4) * (.7 + .3 * np.sin(2 * np.pi * 30 * tt(d)))
def siren(d): t_ = tt(d); return np.sin(2 * np.pi * np.where(np.sin(2 * np.pi * 1.6 * t_) > 0, 660, 880) * t_) * env(d, .1, .2)
def glass(): d = .35; return hp(rs.randn(int(d * SR)), 4500) * np.exp(-tt(d) * 14) + sum(np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * 22) for f in (3100, 4200, 5300)) * .25

def bell(d): t_ = tt(d); x = (np.sin(2 * np.pi * 1180 * t_) + .5 * np.sin(2 * np.pi * 2650 * t_)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 24 * t_))); return x * env(d, .01, .15)
def cricket(d): t_ = tt(d); return np.sin(2 * np.pi * 4400 * t_) * (np.sin(2 * np.pi * 38 * t_) > 0) * (np.sin(2 * np.pi * 2.6 * t_) > .2) * env(d, .1, .15)
def giggle(t0, g=.05, f=420): [put(vowel(f + k * 30, f + 40 + k * 30, .07, ((300, 520), (2200, 2900))), t0 + k * .1, g) for k in range(4)]
def yell(d=.6, base=200, n=7, g=1.0):
    x = np.zeros(int(d * SR)); r = np.random.RandomState(5)
    for k in range(n): x += vowel(base * (1 + r.rand() * .7), base * (1.1 + r.rand() * .7), d, ((600, 1000), (1300, 2000)))
    x += bp(rs.randn(int(d * SR)), 900, 3500) * .6; return x / np.abs(x).max() * env(d, .02, .3)
def scratch(): d = .35; t_ = tt(d); f = 300 + 900 * np.abs(np.sin(2 * np.pi * 4 * t_)); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .4 + bp(rs.randn(len(t_)), 700, 3000), 3000) * env(d, .01, .1)
def crash(): d = .7; return hp(rs.randn(int(d * SR)), 2500) * np.exp(-tt(d) * 5)
def chalk(d): x = bp(rs.randn(int(d * SR)), 2500, 6500) * (np.sin(2 * np.pi * 7 * tt(d)) > -.2); return x * env(d, .02, .05)
def squeak2(): d = .12; return sweep(1400, 2600, d) * np.sin(np.pi * tt(d) / d) ** 2
def ping(): d = .45; t_ = tt(d); return (np.sin(2 * np.pi * 1760 * t_) + .5 * np.sin(2 * np.pi * 2637 * t_)) * np.exp(-t_ * 9)
def drumroll(d):
    x = np.zeros(int(d * SR)); step = .045
    for k in range(int(d / step)):
        s = (hp(rs.randn(int(.07 * SR)), 1200) * .7 + np.sin(2 * np.pi * 200 * tt(.07)) * .4) * np.exp(-tt(.07) * 40) * (.35 + .65 * k * step / d); i = int(k * step * SR); x[i:i + len(s)] += s[:len(x) - i]
    return x

def breathe(d, up=True): x = bp(rs.randn(int(d * SR)), 180, 900) * np.sin(np.pi * tt(d) / d) ** 2; return x / np.abs(x).max()
def snore(d): t_ = tt(d); x = lp(2 * ((t_ * 55 * (1 + .1 * np.sin(2 * np.pi * 3 * t_))) % 1) - 1, 500) + .4 * lp(rs.randn(len(t_)), 300); return x / np.abs(x).max() * np.sin(np.pi * t_ / d) ** .7
def achoo(): a = vowel(320, 420, .25, ((300, 600), (2200, 2900))); b = hp(rs.randn(int(.35 * SR)), 1500) * np.exp(-tt(.35) * 8) + vowel(400, 250, .35, ((500, 900), (1000, 1500))) * .8; return np.concatenate([a * .6, np.zeros(int(.05 * SR)), b])
def rumble(d): x = lp(rs.randn(int(d * SR)), 120); return x / np.abs(x).max() * env(d, .2, .4)
def creak(d=.4): t_ = tt(d); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(90 + 60 * np.sin(2 * np.pi * 1.5 * t_)) / SR)), 1500) * env(d, .05, .1)
# breathing in and out
put(breathe(1.2), .3, .03); put(breathe(1.6), 2.6, .06); put(boing(220), 3.9, .05)
put(breathe(1.0), 4.9, .05); [put(boing(180 + k * 30), 5.95 + k * .12, .05) for k in range(5)]
put(blip(880, .08), 7.1, .05); put(popsnd(), 8.05, .1)
for t in (9.25, 9.85, 10.7): put(popsnd(), t, .1)
put(vowel(320, 420, .2, ((300, 600), (2200, 2900))), 11.3, .04)
put(rumble(tm(14.28) - tm(12.0)), 12.0, .3); put(whoosh(.8, 300, 2500), 12.6, .08); [put(thud(70 + k * 10, .15), 13.1 + k * .17, .08) for k in range(6)]
put(sweep(300, 600, .4) * env(.4, .05, .2), 14.3, .03)
put(snore(1.1), 15.4, .12); put(snore(.9), 16.6, .1); [put(tick(1600 + (k % 3) * 400), 16.5 + k * .06, .05) for k in range(12)]
[put(cluck(), 17.5 + k * .22, .06) for k in range(6)]; put(sweep(400, 900, 1.2) * env(1.2, .1, .3), 17.6, .025)
put(creak(), 19.4, .05); put(creak(), 20.7, .05); put(popsnd(), 20.48, .1)
CD = tm(23.3) - tm(21.8); put(cricket(CD), 21.8, .015); put(achoo(), 22.3, .16)
CD2 = tm(25.6) - tm(23.4); put(cricket(CD2), 23.4, .02)
put(bp(rs.randn(int(.9 * SR)), 400, 2200) * (np.sin(2 * np.pi * 9 * tt(.9)) > 0) * env(.9, .05, .2), 26.2, .1); put(thud(60, .4), 26.4, .18); put(crash(), 26.45, .04)
put(vowel(233, 220, .35, ((300, 700), (900, 1400))), 28.2, .06); put(vowel(196, 165, .5, ((300, 700), (900, 1400))), 28.55, .06)
put(stamp(), 29.85, .12); put(popsnd(), 31.12, .1)
put(shimmer(), 32.3, .05); put(breathe(1.4), 32.6, .03)
put(thud(50, .5), 34.7, .2); put(sweep(200, 90, .6) * env(.6, .01, .3), 34.72, .08)
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], tm); music *= 10 ** (-37.5 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music; mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:8]
def orig(tc):
    t = tc * CUT['speed']
    for a, b in CUT['cuts']:
        if t >= a: t += b - a
    return round(t, 1)
print('loudest sfx relative to speech (dB, final s, original s):', [(round(float(a), 1), b, orig(b)) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
