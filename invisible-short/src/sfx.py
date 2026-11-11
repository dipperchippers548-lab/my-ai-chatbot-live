"""Synthesise the sound effects and mix them under the voiceover -> build/mix.wav"""
import numpy as np, wave, json
from scipy.signal import butter, lfilter
SR = 44100
CUT = json.load(open('build/cuts.json'))
def tm(t):  # original time -> time after the pauses are cut
    return t - sum(min(t, b) - a for a, b in CUT['cuts'] if t > a)
w = wave.open('build/voice_cut.wav'); voice = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
N = int(CUT['duration'] * SR); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
voice *= 0.84 / np.abs(voice).max()
sfx = np.zeros(N); rs = np.random.RandomState(3)
def put(sig, t, g=1.0):
    i = int(tm(t) * SR); sig = sig[:max(0, N - i)]; sfx[i:i + len(sig)] += sig * g
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None):
    t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def sweep(f0, f1, d, shape='sin'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if shape == 'sin' else 2 * ((ph / (2 * np.pi)) % 1) - 1
def blip(f, d=.07): return np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * 45)
def shimmer(up=True):
    d = .75; x = sum(sweep(f * (1 if up else 2.2), f * (2.2 if up else 1), d) for f in (660, 990, 1320)) / 3
    return x * env(d, .05, .4) * (.6 + .4 * np.sin(2 * np.pi * 17 * tt(d)))
def boom(): d = .9; return (sweep(95, 38, d) + .5 * lp(rs.randn(int(d * SR)), 300)) * np.exp(-tt(d) * 5)
def whoosh(d=.5): return bp(rs.randn(int(d * SR)), 500, 2600) * np.sin(np.pi * tt(d) / d) ** 2
def thud(f=70, d=.18): return (sweep(f * 1.8, f, d) + .4 * lp(rs.randn(int(d * SR)), 400)) * np.exp(-tt(d) * 28)
def flop(): d = .25; return lp(rs.randn(int(d * SR)), 900) * np.exp(-tt(d) * 16)
def arp(notes, step=.07, d=.5):
    out = np.zeros(int((d + step * len(notes)) * SR))
    for i, f in enumerate(notes): s = np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * 9); k = int(i * step * SR); out[k:k + len(s)] += s
    return out / 2
def vowel(f0a, f0b, d, forms=((800, 1150), (2500, 2900))):
    src = sweep(f0a, f0b, d, 'saw') * (1 + .15 * np.sin(2 * np.pi * 7 * tt(d)))
    return sum(bp(src, lo, hi) for lo, hi in forms) * env(d, .02, d * .4)
def tick(f=2400): d = .03; return bp(rs.randn(int(d * SR)), f * .7, f * 1.4) * np.exp(-tt(d) * 160)
def pop(): d = .12; return sweep(300, 1100, d) * np.exp(-tt(d) * 30)
def clang():
    d = .9; t = tt(d); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in ((412, 6), (967, 9), (1543, 12), (2210, 16), (3105, 22))) / 5

put(shimmer(True), .78, .16)
put(boom(), 2.93, .09)
for i, t in enumerate(np.arange(5.2, 7.4, .23)): put(blip(1300 + 180 * (i % 4), .06), t, .05)
for t in np.arange(7.65, 12.7, .62): put(whoosh(.5), t, .07)
for t in (13.12, 13.4, 13.68, 13.92): put(thud(90, .1), t, .10)
put(clang(), 14.02, .26); put(thud(60, .25), 14.3, .30)
for t in (15.25, 15.9): put(tick(1500), t, .14)
put(sweep(900, 300, .22) * env(.22), 16.42, .06); put(flop(), 16.52, .13)
put(blip(520, .1), 18.6, .12); put(blip(780, .14), 18.72, .12)
for i, t in enumerate(np.arange(20.15, 22.6, .483)): put(sweep(220, 520, .13) * env(.13), t, .07)
put(arp((1568, 1976, 2349, 3136)), 22.86, .13)
put(vowel(520, 380, .75), 24.85, .16)
for i, t in enumerate(np.arange(26.25, 28.0, .14)): put(tick(2600 if i % 2 else 2000), t, .07)
put(pop(), 28.08, .11)
put(blip(1760, .09), 29.8, .12); put(blip(1760, .09), 29.94, .12)
HD = tm(32.8) - tm(29.8); hum = (np.sin(2 * np.pi * 58 * tt(HD)) + .3 * np.sin(2 * np.pi * 116 * tt(HD))) * env(HD, .1, .15); put(hum, 29.8, .02)
put(blip(1200, .08), 32.84, .08)
for i in range(6): put(vowel(250 - i * 12, 215 - i * 12, .1, ((700, 1100), (1200, 1700))), 34.66 + i * .17, .14)
put(vowel(233, 220, .42, ((300, 700), (900, 1400))), 36.48, .13); put(vowel(196, 165, .6, ((300, 700), (900, 1400))), 36.92, .13)
put(shimmer(False), 37.95, .13)
sfx = sfx - np.mean(sfx)
mix = voice + sfx; mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB peak %.2f | sfx rms %.1f dB peak %.2f | mix peak %.2f' % (db(voice), np.abs(voice).max(), db(sfx), np.abs(sfx).max(), np.abs(mix).max()))
worst = sorted((((db(sfx[i:i + SR // 2]) - db(voice[i:i + SR // 2])), i / SR) for i in range(0, N - SR // 2, SR // 4) if db(voice[i:i + SR // 2]) > -30), reverse=True)[:6]
print('loudest sfx relative to speech (dB, at s):', [(round(a, 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
