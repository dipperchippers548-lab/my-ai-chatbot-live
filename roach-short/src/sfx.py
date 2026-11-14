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
def scritch(d): x = bp(rs.randn(int(d * SR)), 2500, 7000) * (np.sin(2 * np.pi * 23 * tt(d)) > .2) * (.6 + .4 * np.sin(2 * np.pi * 3 * tt(d))); return x * env(d, .02, .05)
def thunder(d=1.4): x = lp(rs.randn(int(d * SR)), 220) * np.exp(-tt(d) * 2.2) + lp(rs.randn(int(d * SR)), 1200) * np.exp(-tt(d) * 9) * .5; return x / np.abs(x).max()
def plop(f=900): d = .12; return sweep(f * .6, f * 1.6, d) * np.exp(-tt(d) * 30)
def pour(d): x = bp(rs.randn(int(d * SR)), 600, 3000) * (.6 + .4 * np.sin(2 * np.pi * 9 * tt(d))); return x * env(d, .05, .1)
def ding(): d = .8; t_ = tt(d); return (np.sin(2 * np.pi * 1568 * t_) + .5 * np.sin(2 * np.pi * 2350 * t_)) * np.exp(-t_ * 5)
def clink(): d = .2; t_ = tt(d); return sum(np.sin(2 * np.pi * f * t_) for f in (3200, 4700)) * np.exp(-t_ * 25)
# 1-2 night: clock ticking, scratching inside the head
for k in range(9): put(tick(3000), 0.3 + k * .5, .05)
put(scritch(1.2), 2.9, .04); put(scritch(1.6), 5.0, .05)
# 3 sat up: louder
put(squeak(300), 7.1, .02); put(scritch(1.9), 8.4, .09)
# 4 fly into the ear
put(whoosh(.8, 200, 2500), 10.1, .07); put(thud(55, .3), 10.8, .08); put(scritch(1.6), 11.0, .06)
# 5 flashback: tiny skitter across the pillow
for k in range(24): put(tick(5000), 12.9 + k * .19, .025)
put(whoosh(.5, 150, 900), 17.2, .04)
# 6 panic, grab the swab
put(yell(.4, 240, 3), 18.6, .04); put(whoosh(.25), 19.7, .05); put(clack(), 20.2, .06)
# 7 big mistake
put(whoosh(.35, 300, 1500), 22.0, .05); put(squelch(), 22.33, .1); put(thud(45, .5), 22.33, .12)
# 8 pushed deeper
put(squelch(), 24.0, .06); put(scritch(1.4), 24.2, .06); put(squelch(), 25.6, .05); put(thud(60, .25), 26.65, .1)
# 9 thunder
put(scritch(1.8), 27.75, .08); put(thunder(1.6), 29.8, .14); put(thunder(1.2), 30.5, .1); put(yell(.6, 200, 4), 29.85, .04)
# 10-11 water
PD = tm(34.5) - tm(32.2); put(pour(PD), 32.2, .04); [put(plop(700 + k * 90), 32.4 + k * .3, .04) for k in range(7)]
for k in range(8): put(plop(400 + k * 60), 34.8 + k * .25, .04)
put(scritch(2.0), 34.8, .07)
# 12 the idea
put(ding(), 38.3, .06); put(popsnd(), 38.3, .05)
# 13 oil drops
put(squeak(700), 40.0, .02); [put(plop(500), 41.9 + k * 1.0, .07) for k in range(3)]
# 14 stopped
put(scritch(.8), 44.9, .04)
# 15 hospital
for k in range(5): put(beep(), 48.0 + k * 1.0, .015)
put(clink(), 49.9, .05); put(squelch(), 50.4, .06); put(shimmer(), 51.4, .05)
# 16 loop: chips bag rustle and a tick
for k in range(6): put(paper(), 53.1 + k * .12, .03)
put(tick(3000), 54.3, .05)
sfx *= 2.5  # this voice is mastered ~8 dB hotter than the earlier ones
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], tm); music *= 10 ** (-29.5 / 20) / np.sqrt(np.mean(music ** 2))
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
