"""Synthesise the sound effects, add the music, and mix them under the (close-mic, pause-cut, sped-up) voiceover
-> build/mix.wav. Event times are final (edited) seconds; F(t) maps an original voiceover time, exactly as main.js does."""
import numpy as np, wave, json, sys, os
from scipy.signal import butter, lfilter
sys.path.insert(0, os.path.dirname(__file__)); from music import make_music
SR = 44100; CUT = json.load(open('build/cuts.json'))
def F(t): return (t - sum(min(t, b) - a for a, b in CUT['cuts'] if t > a)) / CUT['speed']
def at(t0, o): return F(o) - F(t0)
VOICE = 'build/voice_close.wav' if os.path.exists('build/voice_close.wav') else 'build/voice_cut.wav'
w = wave.open(VOICE); voice = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
N = int(CUT['duration'] * SR); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]; voice *= 0.84 / np.abs(voice).max()
sfx = np.zeros(N); rs = np.random.RandomState(3)
def put(sig, t, g=1.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i]; sfx[i:i + len(sig)] += sig * g
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None): t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rs.randn(int(d * SR))
def sweep(f0, f1, d): t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def thud(f=70, d=.25): return (sweep(f * 1.8, f, d) + .5 * lp(noise(d), 400)) * np.exp(-tt(d) * 18)
def whoosh(d=.4, lo=300, hi=2500): return bp(noise(d), lo, hi) * np.sin(np.pi * tt(d) / d) ** 2
def popsnd(): d = .1; return sweep(350, 1300, d) * np.exp(-tt(d) * 32)
def ding(): d = .6; t = tt(d); return (np.sin(2 * np.pi * 2093 * t) + .5 * np.sin(2 * np.pi * 3136 * t)) * np.exp(-t * 7)
def beep(f=1000, d=.1): return np.sin(2 * np.pi * f * tt(d)) * env(d, .005, .02)
def zap(): d = .08; return (hp(noise(d), 2500) * .6 + sweep(2400, 600, d)) * env(d, .002, .05)
def motor(t0, t1, f0, f1, g):  # electric hub-motor whine + tyre hum
    d = t1 - t0; t = tt(d); f = np.linspace(f0, f1, len(t)); ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) * .6 + np.sin(2 * np.pi * ph * 2.01) * .25 + bp(noise(d), 120, 500) * .5; put(x * env(d, .1, .15), t0, g)
def wind(t0, t1, g, lo=300, hi=2000): d = t1 - t0; x = bp(noise(d), lo, hi) * (.7 + .3 * np.sin(2 * np.pi * .8 * tt(d))); put(x / (np.abs(x).max() + 1e-9) * env(d, .15, .2), t0, g)
def crack(): d = .18; t = tt(d); x = hp(noise(d), 1800) * np.exp(-t * 45) + sweep(900, 200, d) * np.exp(-t * 30) * .6; return x / np.abs(x).max()
def clunk(): d = .5; t = tt(d); return thud(55, .5) * 1.2 + sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 9) for f in (430, 690, 1130)) * .25 + hp(noise(d), 2000) * np.exp(-t * 25) * .5
def lubdub(t, g=.4): put(sweep(70, 45, .14) * np.exp(-tt(.14) * 22), t, g); put(sweep(64, 42, .12) * np.exp(-tt(.12) * 24), t + .16, g * .7)

# 1-2 riding: motor whine rising with speed, wind
motor(0, F(6.33), 210, 240, .03); motor(F(4.92), F(6.33), 240, 420, .035); wind(0, F(8.8), .02); wind(F(4.92), F(6.33), .03, 600, 3500)
for k in range(4): put(beep(1600 + k * 200, .05), F(4.92) + .1 + k * .25, .02)
# 3 wobble, fall, plaster
F3 = F(6.33); put(whoosh(.35, 400, 2000), F3 + .5, .06); put(thud(80, .3), F3 + .82, .5); put(thud(120, .15), F3 + .9, .25); put(popsnd(), F3 + .85 + .55, .1)
motor(F(8.8), F(10.95), 380, 380, .025)
# 4 worse: the world slows - a low whoosh
put(whoosh(1.2, 80, 600), F(8.8), .2)
# 5 tiny wheels: pops for the labels and the bike wheel
for k in (.2, .5, .65): put(popsnd(), F(10.95) + k, .08)
# 6-7 slow-motion approach: a low rumbling roll
wind(F(12.7), F(16.85), .03, 60, 400)
# 8 the impact
IMP = F(16.85); put(clunk(), IMP, .35); put(crack() * .5, IMP + .02, .2)
# 9-11 body keeps going: whooshes
put(whoosh(.6, 200, 1500), F(19.4) + .15, .1); wind(F(21.2), F(24.2), .05, 200, 1800); put(popsnd(), F(23.3), .06); put(whoosh(1.0, 150, 1200), F(24.2) + .2, .12)
# 12 brain: signal zaps racing down the arms
k = F(26.8) + .25
while k < F(29.4): put(zap(), k, .04); k += .31
# 13 hands slap the ground
L = F(29.95); put(thud(110, .18), L, .32); put(hp(noise(.08), 1500) * np.exp(-tt(.08) * 50), L, .1); put(thud(100, .18), L + .03, .22)
# 14 snap
put(crack(), F(31.45), .45)
# 15 riser into the slam
put(sweep(120, 700, F(35.1) - F(32.35)) * np.linspace(0, 1, int((F(35.1) - F(32.35)) * SR)) ** 2, F(32.35), .04)
# 16 slam + ringing ears
S16 = F(35.1); put(thud(60, .45), S16, .45); put(lp(noise(.3), 800) * np.exp(-tt(.3) * 12), S16, .25)
put(np.sin(2 * np.pi * 3800 * tt(1.6)) * np.exp(-tt(1.6) * 1.8), S16 + .1, .025)
# 17 heartbeat over the skull
k = F(37.0) + .1
while k < F(39.35): lubdub(k, .35); k += .8
# 18 heart monitors
k = F(39.35) + .1
while k < F(41.8): put(beep(1050, .09), k, .05); k += .62
# 19 helmet drop: whoosh, pop, ding
H = F(44.55); put(whoosh(.35, 600, 3500), H - .35, .1); put(thud(160, .12), H, .4); put(ding(), H + .02, .12)
sfx -= np.mean(sfx); print("sfx peak at %.2f s: %.2f" % (np.argmax(np.abs(sfx)) / SR, np.abs(sfx).max())); sfx *= min(1, .95 / np.abs(sfx).max())
music = make_music(CUT['duration'], F); music *= 10 ** (-28 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music
fade = np.ones(N); fl = int(.3 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2; mix *= fade
mix = np.clip(np.tanh(mix * 1.05) / np.tanh(1.05) * .95, -.98, .98)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:6]
print('loudest sfx relative to speech (dB, final s):', [(round(float(a), 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
