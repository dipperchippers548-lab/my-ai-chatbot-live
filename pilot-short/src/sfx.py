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

bed(0, 1.6, .04); put(popsnd(), .45, .12)                                                       # the hook: wind, "1990"
bed(1.6, 2.6, .012, 80, 300)                                                                    # calm cabin hum
put(whoosh(.35, 300, 3000), 2.56, .12)
bed(2.75, 5.05, .045); put(vowel(520, 380, .5), 3.62, .07)                                      # outside: wind and a scream
put(stamp(), 5.67, .2); put(arp((1047, 1319, 1568, 2093), .06, .5), 5.72, .08)                   # "SURVIVED"
put(jet(tm(8.6) - tm(6.65)), 6.65, .09)                                                         # take-off roar
bed(8.6, 11.3, .028)
for i, t in enumerate(np.arange(8.7, 10.05, .11)): put(blip(700 + i * 55, .05), t, .045)         # altimeter climbing
put(blip(1760, .1), 10.1, .1); put(blip(2349, .2), 10.2, .1)
bed(11.3, 12.45, .012, 80, 300)
for t in (11.82, 12.06, 12.24, 12.38): put(tick(3200), t, .1)                                    # the windscreen cracking
put(thud(48, .5), 12.5, .14); put(hp(rs.randn(int(.3 * SR)), 900) * np.exp(-tt(.3) * 12), 12.5, .08); put(glass(), 12.52, .07)   # BANG
bed(12.5, 13.45, .05)
bed(13.45, 15.8, .02, 120, 500); put(popsnd(), 13.9, .11); lubdub(14.5, .09); lubdub(15.25, .09)  # slow-motion name card
put(whoosh(.4, 300, 3500), 15.92, .09); bed(15.8, 17.9, .035); put(glass(), 16.92, .07)           # he goes through the hole
bed(17.9, 20.55, .03); alarm(18.3); alarm(19.25); alarm(20.2)
put(thud(120, .12), 20.63, .16); bed(20.55, 24.2, .03)                                           # the door, the attendant
for t in np.arange(20.75, 21.6, .13): put(thud(110, .05), t, .05)
put(thud(80, .14), 22.07, .16); put(vowel(240, 200, .2, ((500, 900), (1000, 1500))), 22.1, .07)   # grabs him
put(lp(sweep(120, 260, 1.0, 'saw'), 900) * env(1.0, .2, .2), 23.0, .03)                          # strain
bed(24.2, 26.05, .04)
for i, t in enumerate(np.arange(24.3, 25.15, .045)): put(tick(2400 if i % 2 else 1900), t, .05)   # the timer
put(blip(880, .3), 25.2, .09)
bed(26.05, 28.15, .03); put(vowel(230, 190, .2, ((500, 900), (1000, 1500))), 26.9, .06); put(vowel(200, 170, .2, ((500, 900), (1000, 1500))), 27.2, .06)
bed(28.15, 29.75, .05, 900, 3800); put(popsnd(), 28.55, .11); put(crackle(1.0) * env(1.0, .05, .3), 28.4, .05)   # freezing wind
bed(29.75, 31.8, .018, 300, 900); put(sweep(1400, 700, 1.6) * env(1.6, .3, .6), 29.95, .018)     # his face turns blue
lubdub(32.2, .12); lubdub(33.2, .12)                                                            # "they thought he was dead"
lubdub(34.0, .1); put(thud(60, .35), 34.36, .2); lubdub(34.9, .1); lubdub(35.5, .1)              # "refused to let go"
bed(36.2, 37.75, .035); alarm(36.35); alarm(37.25); put(static(.2), 36.9, .04)
put(jet(tm(39.5) - tm(37.75)), 37.75, .045); SD = tm(40.5) - tm(37.9); put(siren(SD), 37.9, .02)   # approach, fire trucks
put(screech(), 39.58, .045); put(thud(55, .3), 39.58, .09)                                         # touchdown
for t in (40.7, 41.2): put(beep(), t, .05)
put(stamp(), 41.67, .2); put(arp((1047, 1319, 1568, 2093, 2637), .06, .6), 41.72, .09); CD = tm(42.55) - tm(41.7); put(crowd(CD, 500, 3000) * env(CD, .1, .3), 41.7, .05)   # "ALIVE"
for t in (42.8, 43.7, 44.6): put(beep(), t, .04)                                                 # hospital monitor
put(popsnd(), 43.15, .1); put(crackle(.5) * env(.5, .02, .3), 43.2, .05); put(popsnd(), 44.1, .08); put(tick(900), 44.15, .08); put(thud(140, .08), 44.16, .06)
for i in range(5): put(paper(), 45.45 + i * .17, .08)
put(blip(1568, .25), 46.22, .08); put(popsnd(), 47.0, .1); put(arp((1319, 1568, 2093, 2637), .06, .5), 47.05, .08)   # back at work
put(popsnd(), 48.4, .1); put(blip(392, .12), 48.75, .07); put(blip(330, .2), 48.9, .07)          # "the cause?"
for i, t in enumerate(np.arange(49.72, 50.48, .028)): put(tick(2600 if i % 2 else 2100), t, .04)   # 84 screws
put(blip(1760, .25), 50.5, .09)
put(tick(1400), 51.2, .12); put(tick(1100), 51.28, .1)
for t in np.arange(51.85, 52.3, .05): put(tick(1700), t, .05)                                    # the loose one rattles
put(stamp(), 51.8, .1); put(buzz(98, .25), 51.82, .025)                                          # "TOO SMALL"
bed(52.95, 55.2, .04); put(shimmer(), 53.05, .08)
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
