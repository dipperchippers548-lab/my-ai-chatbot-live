"""Sound for LOADED IN ep.1 cold open -> build/mix.wav. Times match src/pilot.part.js."""
import numpy as np, wave
from scipy.signal import butter, lfilter
SR = 44100; IMP = 14.4; VO = IMP - 2.6; ECHO = [28.05, 29.15, 30.25, 31.35]; TITLE = 33.3; DUR = 38.5; MOO = VO + 10.75; SWAP = 11.4
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
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, d=.35, bright=.35): x = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * x) + bright * np.sin(4 * np.pi * f * x) * np.exp(-x * 9)) * np.exp(-x * 7) * np.minimum(1, x / .003)
def sq(m, d): x = tt(d); return np.sign(np.sin(2 * np.pi * hz(m) * x)) * env(d, .003, .04)

# ---- 1 outside at night: crickets, a breeze, the game faintly through the window
t = tt(3.6); crk = sum(np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * r * t) > .2) * (np.sin(2 * np.pi * r2 * t + p) > -.1) for f, r, r2, p in ((4300, 34, .9, 0), (4700, 41, .7, 2)))
put(crk * env(3.6, .3, .3), 0, .006); put(norm(bp(noise(3.6), 200, 900)) * env(3.6, .5, .4), 0, .015)
# the VR game's chiptune: muffled outside, a bit clearer in the room (from the headset)
def game(d):
    s = np.zeros(int(d * SR)); step = .13
    for i, k in enumerate(np.arange(0, d - .2, step)): m = [72, 76, 79, 84, 79, 76, 74, 77][i % 8]; v = sq(m, .12) * .4 + (sq(m - 24, .12) * .5 if i % 2 == 0 else 0); j = int(k * SR); s[j:j + len(v)] += v[:len(s) - j]
    return s
put(lp(game(3.6), 500) * env(3.6, .3, .2), 0, .02); put(lp(game(3.6), 1400) * env(3.6, .05, .3), 3.6, .03); put(lp(game(.8), 1400), 7.2, .02)
put(norm(lp(noise(5.0), 180)) * env(5.0, .2, .3), 3.6, .025)                      # PC fan hum
for k in (3.9, 4.5, 5.1, 5.6, 6.2): put(whoosh(.25, 600, 3500), k, .035)
# ---- 3 the headset fails
for k in (7.2, 7.5, 7.8): put(beep(880), k, .03); put(beep(660), k + .13, .03)
put(crackle(.8), 7.6, .07); put(bitcrush(.35, 180), 7.75, .05); put(bitcrush(.3, 300), 8.15, .06)
put(sweep(200, 2400, .6) * env(.6, .3, .05), 8.0, .06); put(whoosh(.7, 200, 4000), 7.95, .12)
put(norm(thud(50, .6) + hp(noise(.6), 2000) * np.exp(-tt(.6) * 6)), 8.55, .32)
# ---- 4 tunnel
put(whoosh(1.2, 300, 6000), 8.6, .12); for_ = [put(blip(800 + i * 300, 2400, .06), 8.7 + i * .12, .03) for i in range(8)]
# ---- 5-6 the fall: wind roar, the glitch into low-poly, a bomb whistle coming down at us
d = IMP - 9.8; put(norm(bp(noise(d), 150, 1600) * (.7 + .3 * np.sin(2 * np.pi * 3 * tt(d)))) * env(d, .3, .05), 9.8, .09)
put(bitcrush(.18, 500), SWAP - .05, .07); put(blip(1800, 300, .2), SWAP, .06)
put(sweep(2200, 500, IMP - 12.6) * env(IMP - 12.6, .2, .02), 12.6, .03)
# ---- 7 IMPACT
put(norm(thud(45, .9) * 1.0 + lp(noise(.9), 900) * np.exp(-tt(.9) * 5) * .6), IMP, .55); put(thud(120, .2), IMP + .02, .25)
for k in range(5): put(norm(hp(noise(.05), 2000)) * np.exp(-tt(.05) * 60), IMP + .05 + k * .07, .04)     # dirt clods landing
# ---- the low-poly world: soft wind, a couple of birds
d = DUR - IMP; put(norm(bp(noise(d), 300, 1200)) * env(d, .5, .5), IMP, .012)
for k in (17.0, 19.6, 26.2): put(sweep(3000, 4200, .08) * env(.08), k, .02); put(sweep(3200, 4500, .07) * env(.07), k + .12, .02)
put(whoosh(.3, 400, 2400), VO + 5.6, .06)                                             # pops up
for k in range(4): put(norm(bp(noise(.06), 1500, 5000)) * env(.06), VO + 5.8 + k * .09, .03)   # brushing off
# a quiet, curious little motif while he looks around (stops dead for the cow)
for i, k in enumerate(np.arange(VO + 6.68, VO + 7.75, .25)): put(pluck([67, 70, 74, 72, 70, 67, 65, 67][i % 8], .5, .6), k, .05)
# the cow: chewing
for k in np.arange(VO + 7.75, VO + 16.0, .2): put(norm(lp(noise(.06), 1200)) * env(.06, .005, .04), k, .012)
# MOO
t = tt(1.2); f0 = 110 + 28 * np.sin(np.pi * t / 1.2); ph = np.cumsum(f0) / SR; saw = 2 * (ph % 1) - 1
put(norm(bp(saw, 250, 900) * 1.2 + bp(saw, 1000, 1600) * .4) * env(1.2, .12, .4), MOO, .32)
# he notices his hand: two low "dun... dun" notes
for k, m in ((VO + 12.3, 38), (VO + 12.85, 37)): put(norm(pluck(m, 1.0, .1) + pluck(m + 12, 1.0, .1) * .4), k, .12)
# ---- voice
w = wave.open('build/voice.wav'); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close(); v = v / np.abs(v).max() * .84
put(v, VO, 1.0)
# ---- the echo: "MY HANDS" across the whole world, a boom on every camera snap
hands = v[int(14.7 * SR):int(16.15 * SR)].copy(); hands *= env(len(hands) / SR, .01, .1)
for k, (e, g, f) in enumerate(zip(ECHO, (.5, .33, .21, .13), (4000, 2600, 1700, 1100))):
    put(verb(lp(hands, f), .55 + k * .06), e, g); put(norm(sweep(70, 35, .9) * np.exp(-tt(.9) * 4)), e, .18 - k * .02); put(whoosh(.3, 150, 900), e - .1, .05)
# ---- title: an original glitchy theme sting (about 128 BPM)
b = 60 / 128; T0 = TITLE
put(norm(thud(40, 1.2) + hp(noise(1.2), 2500) * np.exp(-tt(1.2) * 5) * .3), T0, .4); put(bitcrush(.25, 300), T0, .05)
lead = [69, 72, 76, 81, 79, 76, 72, 74, 76, 79, 84, 83, 81, 76, 79, 81]
for i in range(16):
    k = T0 + .2 + i * b / 2
    put(pluck(lead[i], .3, .8), k, .1); put(pluck(lead[i] + 12, .2, .5), k, .03)
    if i % 2 == 0: put(norm(sweep(110, 45, .2)) * np.exp(-tt(.2) * 14), k, .2)
    if i % 4 == 2: put(norm(hp(noise(.12), 1500)) * np.exp(-tt(.12) * 30), k, .07)
    if i % 2: put(norm(hp(noise(.03), 7000)) * np.exp(-tt(.03) * 140), k, .04)
for i, m in enumerate([45, 45, 48, 43]): x = tt(b * 2); put(np.sin(2 * np.pi * hz(m) * x) * np.exp(-x * 1.5), T0 + .2 + i * b * 2, .18)
x = tt(2.0); pad = sum(np.sin(2 * np.pi * hz(m) * x) for m in (57, 60, 64, 69)) / 4 * env(2.0, .05, 1.2); put(pad, T0 + .2 + 8 * b, .12)
mix = np.clip(np.tanh(out * 1.05) / np.tanh(1.05) * .95, -.98, .98)
fade = np.ones(N); fl = int(.8 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5; mix *= fade
print('peak %.2f' % np.abs(mix).max())
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
