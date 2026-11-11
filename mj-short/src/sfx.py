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

D1 = tm(6.0) - tm(0); put(crowd(D1) * env(D1, .1, .1), 0.0, .03)                                   # crowd under the opening
put(popsnd(), .45, .12)                                                                          # "1984"
put(fwoomp(), 3.02, .1); FD = tm(5.9) - tm(3.1); put(crackle(FD) * env(FD, .05, .1), 3.1, .06)     # hair catches fire
put(clack(), 6.32, .2)                                                                           # clapperboard
D2 = tm(10.3) - tm(8.1); put(crowd(D2, 500, 3000) * env(D2, .1, .2), 8.1, .05); put(popsnd(), 8.62, .12)   # 3,000 fans
put(popsnd(), 10.5, .12); put(blip(990, .08), 11.3, .07)                                         # the plan
put(whoosh(.35, 600, 3000), 12.45, .09); put(arp((1568, 2093, 2637), .05, .4), 12.8, .07)        # spin
for t in (13.92, 14.2, 14.5, 14.85, 15.15, 15.5): put(firework(), t, .07)                         # fireworks
D3 = tm(15.9) - tm(13.9); put(crackle(D3) * env(D3, .05, .1), 13.9, .06)
put(sweep(300, 90, .9) * env(.9, .05, .5), 16.05, .045)                                           # "but this time"
for t in (18.05, 18.2, 18.3): put(tick(3000), t, .06)                                            # sparks land
put(fwoomp(), 18.3, .06); F2 = tm(22.4) - tm(18.5); put(crackle(F2) * env(F2, .1, .1), 18.5, .06)
put(vowel(330, 480, .5, ((500, 900), (1000, 1500))), 21.72, .1)                                  # fans gasp
for t in np.arange(22.6, 23.5, .11): put(thud(110, .06), t, .035)                                 # crew running
put(thud(70, .2), 23.55, .07)
HD = tm(25.0) - tm(24.1); put(hp(rs.randn(int(HD * SR)), 3500) * env(HD, .03, .4), 24.1, .03)    # put out: hiss
for t in (25.75, 26.6, 27.45, 28.3): put(beep(), t, .06)                                         # heart monitor
put(popsnd(), 25.95, .1)
put(arp((1319, 1568, 2093), .05, .4), 28.1, .06)                                                 # brave smile
for t in np.arange(29.0, 29.7, .2): put(thud(100, .06), t, .07)                                  # the suit walks in
put(coin(), 30.2, .1); put(coin(), 30.28, .08); put(blip(2093, .3), 30.3, .07)                   # ka-ching
for t in np.arange(30.6, 32.2, .16): put(whoosh(.1, 1500, 5000), t, .035)                        # cash flutter
put(whoosh(.25, 600, 3000), 32.95, .07); put(arp((1047, 1319, 1568, 2093, 2637), .07, .6), 33.4, .09)   # the gift
D4 = tm(37.4) - tm(35.3); put(crowd(D4) * env(D4, .15, .1), 35.3, .03); put(shimmer(), 35.4, .08)
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], tm); music *= 10 ** (-37.5 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music; mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:5]
print('loudest sfx relative to speech (dB, at s):', [(round(float(a), 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
