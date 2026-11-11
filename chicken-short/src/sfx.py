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

for t in (.55, .75, 1.25): put(cluck(), t, .12)                                   # happy chicken
put(whoosh(.14, 800, 4000), 2.82, .16); put(thud(120, .12), 2.93, .34); put(tick(1800), 2.93, .2)  # the chop
for t, f in ((3.6, 330), (3.95, 300)): put(sweep(f, f * 1.9, .09) * env(.09), t, .08)  # head bounces
put(sweep(300, 700, .12) * env(.12), 5.1, .08)                                    # hop
for t in np.arange(5.5, 6.9, .12): put(tick(1500), t, .06)                        # little footsteps
put(hp(rs.randn(int(.25 * SR)), 5000) * env(.25, .01, .2), 8.65, .07)             # the cut line
put(whoosh(.5), 9.15, .07)
for t in np.arange(11.0, 13.6, .5): put(thud(60, .13), t, .13); put(thud(52, .11), t + .14, .09)   # heartbeat
put(arp((1568, 1976, 2349, 3136)), 14.25, .11); put(cluck(), 15.0, .1)
for t in np.arange(15.85, 16.6, .08): put(tick(2600), t, .07)                     # calendar pages
put(blip(1760, .25), 16.62, .1)
for t in (18.6, 19.15, 19.7, 20.45, 20.95, 21.3): put(plink(), t, .09)            # drops
ED = tm(23.7) - tm(21.9); eng = lp(np.sign(np.sin(2 * np.pi * 27 * tt(ED))) * (1 + .5 * np.sin(2 * np.pi * 9 * tt(ED))), 320) * env(ED, .1, .2); put(eng, 21.9, .018)   # truck
for t in (22.0, 22.14): put((np.sin(2 * np.pi * 392 * tt(.1)) + np.sin(2 * np.pi * 494 * tt(.1))) * env(.1, .01, .03), t, .06)
for t in (24.45, 24.8, 25.2): put(coin(), t, .07)
put(vowel(300, 420, .45, ((500, 900), (1000, 1500))), 25.45, .12)                 # crowd gasp
put(blip(880, .08), 27.4, .08); put(blip(1175, .1), 27.52, .08)
CD = tm(30.4) - tm(28.8); t_ = tt(CD); put(np.sin(2 * np.pi * 4400 * t_) * (np.sin(2 * np.pi * 38 * t_) > 0) * (np.sin(2 * np.pi * 2.6 * t_) > .2) * env(CD, .1, .15), 28.8, .035)  # crickets
put(bp(rs.randn(int(.14 * SR)), 300, 1200) * env(.14, .005, .1), 30.62, .11); put(cluck(), 30.6, .1); put(thud(60, .22), 30.9, .14)   # choke and fall
put(vowel(233, 220, .4, ((300, 700), (900, 1400))), 31.9, .1); put(vowel(196, 165, .5, ((300, 700), (900, 1400))), 32.3, .1)
put(shimmer(), 33.0, .1); put(cluck(), 34.3, .1); put(cluck(), 34.5, .1)
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], tm); music *= 10 ** (-37.5 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music; mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:5]
print('loudest sfx relative to speech (dB, at s):', [(round(float(a), 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
