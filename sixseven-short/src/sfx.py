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

# 1 hook: school bell, classroom buzz, kids chanting
put(bell(.75), 0.02, .05); bed(0, 2.18, .02, 300, 1400); put(popsnd(), .4, .12)
for t in (.55, 1.0, 1.45, 1.9): put(vowel(250, 230, .12, ((300, 600), (1900, 2600))), t, .05); put(vowel(240, 210, .16, ((500, 800), (1700, 2100))), t + .2, .05)
# 2 the numbers slam onto the school
put(whoosh(.35, 400, 3000), 2.33, .05); put(thud(45, .5), 2.82, .16); put(crash(), 2.82, .025)
put(whoosh(.35, 400, 3000), 2.65, .05); put(thud(42, .5), 3.14, .16); put(crash(), 3.14, .025); put(coin(), 3.6, .04)
# 3-4 "Six." "Seven."
for t in (5.18, 6.43): put(thud(55, .45), t, .16); put(popsnd(), t, .09); put(shimmer(), t + .05, .04)
# 5 nobody knows
for k in range(7): put(blip(600 + k * 70, .07), 7.93 + k * .12, .06)
put(vowel(220, 180, .45, ((400, 800), (1000, 1500))), 8.6, .06)
# 6-7 the rapper and the song
put(scratch(), 10.1, .1); VD = tm(16.96) - tm(10.07); put(crackle(VD) * env(VD, .1, .1), 10.07, .03); put(popsnd(), 12.5, .12); put(popsnd(), 14.42, .12)
put(popsnd(), 15.32, .12); put(boing(330), 15.36, .05); put(popsnd(), 15.67, .12); put(boing(440), 15.71, .05)
# 8 the edit
for t in (17.2, 17.55, 18.15): put(tick(2600), t, .08); put(blip(1320, .05), t + .01, .04)
put(whoosh(.7, 600, 3500), 17.3, .07); put(thud(140, .08), 18.2, .1)
# 9 the court: dribbles, squeaks, the dunk
BD = tm(21.8) - tm(19.0); put(crowd(BD, 400, 2200) * env(BD, .1, .2), 19.0, .035)
for k in range(5): put(thud(120, .07), 19.0 + .224 * (k + .5), .1)
for t in (19.25, 19.7, 20.05): put(squeak2(), t, .04)
put(thud(70, .2), 20.45, .16); put(sum(np.sin(2 * np.pi * f * tt(.5)) * np.exp(-tt(.5) * 9) for f in (310, 620, 1240)) / 3, 20.45, .1); put(crowd(.9, 500, 3000) * env(.9, .05, .5), 20.5, .06)
# 10 six foot seven
put(sweep(900, 300, .6) * env(.6, .02, .1), 22.1, .04); put(thud(160, .1), 22.7, .14); put(popsnd(), 22.76, .12)
# 11 the kid in the stands
SD = tm(28.13) - tm(24.54); put(crowd(SD, 400, 2400) * env(SD, .1, .2), 24.54, .045); put(beep(), 24.6, .05); put(beep(), 24.75, .05)
put(whoosh(.35, 500, 3000), 25.75, .09); put(yell(.7, 380, 2), 26.44, .05)
# 12 "and did this": tick-tock with the bouncing hands
for k in range(5): put(blip(1568 if k % 2 else 1175, .06), 28.13 + .1 + k * .314, .07)
put(shimmer(), 28.15, .06)
# 13 the scale
for k in range(7): put(tick(1900 if k % 2 else 1400), 29.71 + .1 + k * .349, .09)
# 14 blew up
for k in range(14): put(ping(), 32.08 + .1 * (1 - k / 16) * k, .01)
put(whoosh(.6, 300, 3000), 32.9, .06); put(thud(50, .5), 33.2, .12); put(crackle(.6) * env(.6, .05, .3), 33.2, .06); put(arp((1568, 2093, 2637), .05, .4), 33.25, .06)
# 15-16 the classroom: chalk, then the whole class yells
CD = tm(36.62) - tm(33.77); put(murmur(CD) * env(CD, .2, .2), 33.77, .015); put(chalk(.5), 34.6, .05); put(chalk(.35), 35.25, .05)
put(yell(.75, 230, 9), 37.77, .06); put(thud(55, .35), 37.77, .12); put(popsnd(), 37.8, .1)
YD = tm(39.9) - tm(38.5); put(crowd(YD, 500, 3000) * env(YD, .1, .3), 38.5, .04)
# 17 page 67
for k in range(9): put(paper(), 39.95 + k * .05, .03)
put(ping(), 40.45, .06); put(thud(90, .12), 40.45, .1)
# 18 chaos
XD = tm(43.09) - tm(41.8); put(bell(XD), 41.8, .007); put(yell(XD, 260, 9), 41.8, .015); put(crash(), 41.82, .014)
# 19 banned: record scratch, stamps
put(scratch(), 43.12, .06); put(stamp(), 43.71, .2); put(stamp(), 44.09, .22); put(buzz(98, .25), 44.12, .03)
# 20 the teacher does it / uncool
put(popsnd(), 45.1, .08)
put(vowel(180, 140, .7, ((300, 700), (800, 1300))), 47.25, .07); put(cricket(tm(48.9) - tm(47.5)), 47.5, .02); put(popsnd(), 47.62, .1)
# 21 word of the year: drum roll then fanfare and confetti
put(drumroll(tm(50.55) - tm(48.95)), 48.95, .06); put(thud(50, .4), 50.55, .12); put(crash(), 50.55, .03); WD = tm(52.5) - tm(50.6); put(crowd(WD, 500, 3000) * env(WD, .05, .4), 50.6, .05)
for k in range(6): put(popsnd(), 50.6 + k * .18, .05)
# 22 no definition
put(cricket(tm(55.1) - tm(52.6)), 52.6, .025); put(blip(523, .25), 53.64, .06); put(blip(392, .45), 53.85, .06)
# 23-25 joke, signal, performance
giggle(55.5, .05); giggle(55.95, .045, 470); put(popsnd(), 55.4, .1)
for t in (57.0, 57.35, 57.7): put(ping(), t, .04)
put(popsnd(), 57.0, .1); put(popsnd(), 58.06, .1); PD = tm(59.55) - tm(58.0); put(crowd(PD, 500, 3000) * env(PD, .05, .3), 58.0, .05)
# 26 so if you don't get it...
put(boing(260), 59.7, .07); put(vowel(233, 220, .3, ((300, 700), (900, 1400))), 61.15, .06); put(vowel(207, 175, .45, ((300, 700), (900, 1400))), 61.45, .06); giggle(61.6, .05, 450)
# 27 loop
put(shimmer(), 63.0, .07); put(bell(.6), 64.3, .03)
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
