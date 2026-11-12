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

put(popsnd(), .45, .12); put(arp((1047, 1319, 1568, 2093), .06, .5), .3, .06)                    # "1925"
put(blip(1175, .08), 2.0, .07)                                                                  # hat tip
put(stamp(), 3.1, .2); put(arp((1568, 1976, 2349), .05, .4), 3.3, .07)                           # SOLD
put(popsnd(), 5.15, .12)                                                                        # "not his"
put(popsnd(), 6.47, .11)
put(stamp(), 7.9, .2); put(paper(), 8.25, .1); put(arp((1319, 1760), .06, .3), 8.55, .06)        # forging papers
for i in range(5): put(paper(), 9.25 + i * .16, .07); put(blip(880 + i * 110, .06), 9.5 + i * .16, .05)   # invitations
put(arp((1047, 1319, 1568, 2093, 2637), .06, .6), 11.5, .08)                                    # fancy hotel
MD = tm(14.5) - tm(13.2); put(murmur(MD) * env(MD, .1, .2), 13.2, .03)
for i, t in enumerate(np.arange(14.7, 16.1, .2)): put(blip(520 + i * 70, .07), t, .06); put(coin(), t + .05, .035)   # costs rising
put(sweep(900, 200, .5) * env(.5, .02, .2), 17.1, .05)                                          # tower comes down
for t in np.arange(17.45, 18.2, .13): put(thud(80 + rs.rand() * 60, .1), t, .09); put(tick(1200 + rs.rand() * 800), t + .03, .07)
put(popsnd(), 18.2, .11)
put(hp(rs.randn(int(.45 * SR)), 4500) * env(.45, .05, .3), 19.15, .045); put(stamp(), 19.6, .16)  # "shh" / top secret
put(coin(), 21.45, .09); put(coin(), 21.53, .07); put(blip(2093, .3), 21.55, .06)               # paid
for t in np.arange(22.5, 24.4, .105): put(thud(120, .05), t, .045)                              # running
put(whoosh(.5, 500, 3000), 22.45, .07)
put(vowel(300, 420, .3, ((500, 900), (1000, 1500))), 25.15, .07); put(popsnd(), 25.16, .1)       # "not for sale"
put(vowel(233, 220, .35, ((300, 700), (900, 1400))), 25.6, .07); put(vowel(196, 165, .45, ((300, 700), (900, 1400))), 25.92, .07)
for t in np.arange(27.0, 27.9, .22): put(tick(900), t, .05)                                     # tiptoeing away
put(boing(200), 28.15, .06); put(popsnd(), 28.7, .11)                                           # he's back
MD2 = tm(31.3) - tm(29.95); put(murmur(MD2) * env(MD2, .1, .2), 29.95, .03)
put(blip(520, .1), 31.9, .08); put(blip(780, .14), 32.02, .08)                                  # "hm?"
put(ring(.55), 32.82, .05)                                                                      # the phone call
put(whistle(.45), 33.72, .022); put(whistle(.3), 34.2, .018); put(popsnd(), 33.8, .07)              # police
for t in np.arange(33.75, 34.5, .1): put(thud(110, .05), t, .02)
put(horn(1.3), 34.7, .016); put(popsnd(), 35.35, .1)                                             # ship horn, "America"
WD = tm(36.8) - tm(34.6); put(bp(rs.randn(int(WD * SR)), 300, 1500) * (.5 + .5 * np.sin(2 * np.pi * .8 * tt(WD))) * env(WD, .2, .3), 34.6, .012)   # sea
put(shimmer(), 37.0, .08)
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], tm); music *= 10 ** (-37.5 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music; mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:5]
print('loudest sfx relative to speech (dB, at s):', [(round(float(a), 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
