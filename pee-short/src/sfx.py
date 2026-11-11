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

for t in (.3, .78, 1.26): put(squeak(), t, .07)                                    # the pee dance
put(arp((1047, 1319, 1568, 2093), .06, .6), 2.2, .1)                               # halo
put(blip(990, .08), 3.97, .08)
put(sweep(1200, 400, .25) * env(.25), 5.08, .07); put(boing(170), 5.33, .07); put(boing(230), 6.05, .06); put(boing(150), 6.32, .06)   # stretchy bag
for t in np.arange(7.5, 8.5, .19): put(plink(), t, .08)                            # filling
put(popsnd(), 8.22, .15)                                                           # "200 ml"
put(thud(90, .12), 9.93, .1); put(coin(), 9.94, .08)                               # the cup lands
for i, t in enumerate(np.arange(11.05, 12.4, .12)): put(blip(1500 + 250 * (i % 3), .05), t, .06)   # sensors
for t in (12.56, 12.85): put(buzz(95, .2), t, .04)                                 # phone buzz
put(popsnd(), 12.82, .12)
put(blip(1320, .09), 14.22, .16); put(blip(1760, .16), 14.31, .16)                 # "!"
put(np.sin(2 * np.pi * 1568 * tt(.16)) * env(.16, .02, .05), 15.95, .06); put(np.sin(2 * np.pi * 1319 * tt(.2)) * env(.2, .02, .05), 16.12, .06)   # whistling it off
put(whoosh(.2, 800, 4000), 16.24, .1)
for t in (17.75, 18.65, 19.3): put(squeak(500), t, .08)                            # flexing
for t in (20.6, 21.15, 21.7, 22.25): put(buzz(220, .09), t, .07)                   # the robot muscle
AD = tm(25.3) - tm(23.0); t_ = tt(AD); put(np.sin(2 * np.pi * np.where(np.sin(2 * np.pi * 2.2 * t_) > 0, 740, 587) * t_) * env(AD, .05, .1), 23.0, .028)   # alarm
put(popsnd(), 23.72, .15)                                                          # "500 ml"
for t in np.arange(25.55, 27.8, .483): put(squelch(), t, .09)                       # squeezing
put(thud(100, .14), 28.32, .14); put(tick(1700), 28.32, .16); put(whoosh(.3, 300, 1800), 28.36, .14)   # forced open
SD = tm(33.6) - tm(30.0); put(lp(sweep(140, 420, SD, 'saw'), 1200) * env(SD, .2, .05), 30.0, .03)     # strain building
RD = tm(34.6) - tm(33.68); put(bp(rs.randn(int(RD * SR)), 1500, 5000) * (.6 + .4 * np.sin(2 * np.pi * 13 * tt(RD))) * env(RD, .05, .3), 33.68, .06)   # release
put(vowel(300, 230, .6, ((600, 1000), (1100, 1500))), 34.0, .1)                    # relief
put(arp((1568, 1976, 2349, 3136)), 35.6, .1)
put(thud(55, .3), 36.86, .09); put(buzz(98, .28), 37.44, .05)                      # burst, then "never"
put(vowel(233, 220, .4, ((300, 700), (900, 1400))), 39.3, .1); put(vowel(196, 165, .5, ((300, 700), (900, 1400))), 39.65, .1)
put(shimmer(), 40.4, .09)
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], tm); music *= 10 ** (-37.5 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music; mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:5]
print('loudest sfx relative to speech (dB, at s):', [(round(float(a), 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
