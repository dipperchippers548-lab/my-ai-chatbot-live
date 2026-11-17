"""Sound for the test scene -> build/mix.wav. Times match src/ep.part.js (VO, ECHO, COW...)."""
import numpy as np, wave
from scipy.signal import butter, lfilter
SR = 44100; VO = 6.6; ECHO = [12.25, 13.35, 14.45, 15.55]; COW = 16.9; DUR = 18.7
N = int(DUR * SR); out = np.zeros(N); rs = np.random.RandomState(5)
def tt(d): return np.arange(int(d * SR)) / SR
def put(sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    sig = sig[:N - i]; out[i:i + len(sig)] += sig * g
def env(d, a=.005, r=None): t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rs.randn(int(d * SR))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def sweep(f0, f1, d): t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def whoosh(d=.4, lo=300, hi=2500): return norm(bp(noise(d), lo, hi) * np.sin(np.pi * tt(d) / d) ** 2)
def beep(f, d=.12): return np.sign(np.sin(2 * np.pi * f * tt(d))) * .5 * env(d, .003, .02)
def thud(f=70, d=.3): return norm((sweep(f * 1.8, f, d) + .5 * lp(noise(d), 400)) * np.exp(-tt(d) * 16))
def verb(x, g=.4):
    y = x.copy()
    for k, dl in enumerate((.029, .043, .061, .083, .113, .149, .197)):
        n = int(dl * SR); y[n:] += x[:-n] * g * (.72 ** k)
    return y
def blip(f0=400, f1=1800, d=.12): return sweep(f0, f1, d) * np.exp(-tt(d) * 14)
def crackle(d): x = hp(noise(d), 2500) * (rs.rand(int(d * SR)) > .992); return norm(lp(np.convolve(x, np.exp(-np.arange(200) / 30), 'same'), 7000))
def bitcrush(d, f=220): t = tt(d); x = np.sign(np.sin(2 * np.pi * f * t * (1 + .5 * np.sin(2 * np.pi * 7 * t)))) * .5 + hp(noise(d), 3000) * .4; return np.round(x * 4) / 4 * env(d, .005, .03)

# --- real world: PC fan hum, muffled game music leaking from the headset, controller swooshes
put(norm(lp(noise(4.2), 200)) * env(4.2, .2, .3), 0, .03)
t = tt(3.1); game = sum(np.sin(2 * np.pi * 440 * 2 ** (n / 12) * t) * (np.floor(t * 6.5) % 4 == k) for k, n in enumerate((0, 7, 12, 7))) + .4 * np.sign(np.sin(2 * np.pi * 110 * t))
put(lp(game, 900) * env(3.1, .1, .3), 0, .025)
for k in (.35, .95, 1.5, 2.1, 2.6): put(whoosh(.25, 600, 3500), k, .04)
# --- the headset glitches
for k in (3.05, 3.35, 3.65): put(beep(880), k, .03); put(beep(660), k + .13, .03)
put(crackle(.7), 3.35, .06); put(bitcrush(.35, 180), 3.5, .05); put(bitcrush(.3, 300), 3.85, .06)
put(sweep(200, 2400, .6) * env(.6, .3, .05), 4.0, .06); put(whoosh(.7, 200, 4000), 3.95, .12)
put(norm(thud(50, .6) + hp(noise(.6), 2000) * np.exp(-tt(.6) * 6)), 4.55, .3)       # the flash
put(whoosh(.65, 400, 6000), 4.6, .1); put(bitcrush(.12, 400), 5.18, .05)
# --- low-poly world: light wind + a bird or two
d = DUR - 5.2; put(norm(bp(noise(d), 300, 1200)) * env(d, .5, .5), 5.2, .012)
for k in (7.3, 9.1): put(sweep(3000, 4200, .08) * env(.08), k, .02); put(sweep(3200, 4500, .07) * env(.07), k + .12, .02)
for k in (5.25, 5.55, 5.85): put(blip(), k, .1); put(bitcrush(.06, 500), k, .03)
put(sweep(1800, 500, .45) * env(.45, .02, .05), 5.86, .025); put(thud(80, .3), 6.3, .45); put(thud(140, .12), 6.34, .2)
# --- the voice
w = wave.open('build/voice.wav'); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close(); v = v / np.abs(v).max() * .84
put(v, VO, 1.0)
put(whoosh(.35, 300, 1800), 10.9, .06); put(thud(90, .2), 11.6, .2)
# --- the echo: "MY HANDS" bounces across the whole world, each copy further away; a boom on every camera snap
hands = v[int(4.55 * SR):int(5.98 * SR)].copy(); hands *= env(len(hands) / SR, .01, .1)
for k, (e, g, f) in enumerate(zip(ECHO, (.5, .33, .21, .13), (4000, 2600, 1700, 1100))):
    put(verb(lp(hands, f), .55 + k * .06), e, g)
    put(norm(sweep(70, 35, .9) * np.exp(-tt(.9) * 4)), e, .18 - k * .02); put(whoosh(.3, 150, 900), e - .1, .05)
# --- the cow
t = tt(1.1); f0 = 115 + 25 * np.sin(np.pi * t / 1.1); ph = np.cumsum(f0) / SR; saw = 2 * (ph % 1) - 1
moo = bp(saw, 250, 900) * 1.2 + bp(saw, 1000, 1600) * .4; put(norm(moo) * env(1.1, .12, .35), COW + .75, .35)
mix = np.clip(np.tanh(out * 1.05) / np.tanh(1.05) * .95, -.98, .98)
fade = np.ones(N); fl = int(.25 * SR); fade[-fl:] = np.linspace(1, 0, fl); mix *= fade
print('peak %.2f' % np.abs(mix).max())
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
