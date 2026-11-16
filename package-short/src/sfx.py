"""Synthesise the sound effects, add the music, and mix them under the (pause-cut, sped-up) voiceover -> build/mix.wav
Event times are in final (edited) seconds; F(t) maps an original voiceover time to that clock, as main.js does."""
import numpy as np, wave, json, sys, os
from scipy.signal import butter, lfilter
sys.path.insert(0, os.path.dirname(__file__)); from music import make_music
SR = 44100; CUT = json.load(open('build/cuts.json'))
def F(t): return (t - sum(min(t, b) - a for a, b in CUT['cuts'] if t > a)) / CUT['speed']
w = wave.open('build/voice_cut.wav'); voice = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
N = int(CUT['duration'] * SR); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]; voice *= 0.84 / np.abs(voice).max()
sfx = np.zeros(N); rs = np.random.RandomState(3)
def put(sig, t, g=1.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[:N - i]; sfx[i:i + len(sig)] += sig * g
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None): t = tt(d); r = r or d * .7; return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, d - t) / r)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rs.randn(int(d * SR))
def sweep(f0, f1, d): t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def verb(x, g=.35, d=.9):  # cheap small-room reverb: a few decaying taps
    y = x.copy()
    for k, dl in enumerate((.031, .047, .067, .089, .121, .163)):
        n = int(dl * SR); y[n:] += x[:-n] * g * (.75 ** k)
    return y

def knock(g=1.0, muffled=False):  # knuckles on a wooden door: low body + woody click
    d = .22; t = tt(d); body = sweep(160, 95, d) * np.exp(-t * 32); click = bp(noise(d), 900, 3200) * np.exp(-t * 90) * .7
    x = body + click
    if muffled: x = lp(x, 600) * 1.4
    return verb(x) * g
def creak(d, f0=220, f1=330):  # door hinge: a rough, wavering saw tone
    t = tt(d); f = f0 + (f1 - f0) * (t / d) + 25 * np.sin(2 * np.pi * 7 * t) + 15 * rs.randn(len(t)).cumsum() / np.sqrt(len(t)) * 0
    ph = np.cumsum(f) / SR; x = 2 * (ph % 1) - 1; x *= (.6 + .4 * (np.sin(2 * np.pi * 23 * t) > 0))
    return bp(x, 400, 2600) * env(d, .05, .15)
def step(g=1.0): d = .12; t = tt(d); return (lp(noise(d), 500) * np.exp(-t * 45) + sweep(110, 70, d) * np.exp(-t * 50) * .6) * g
def click(): d = .03; return bp(noise(d), 1500, 5000) * np.exp(-tt(d) * 200)
def tick(): d = .025; return bp(noise(d), 2500, 6500) * np.exp(-tt(d) * 260) + np.sin(2 * np.pi * 3200 * tt(d)) * np.exp(-tt(d) * 300) * .5
def rattle(d): x = bp(noise(d), 600, 4000) * (np.sin(2 * np.pi * 10.8 * tt(d)) > .3); return lp(x, 5000) * env(d, .02, .05)
def cardboard(d): x = bp(noise(d), 300, 2200) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3 * tt(d)))); return x * env(d, .05, .2)
def rustle(d): x = hp(noise(d), 2500) * (rs.rand(int(d * SR)) > .6); return lp(x, 8000) * env(d, .03, .15)
def ringer(d):  # an old phone's electronic trill, on .5 / off .25
    t = tt(d); trill = np.sign(np.sin(2 * np.pi * 18 * t)); x = lp(np.sign(np.sin(2 * np.pi * np.where(trill > 0, 1250, 1580) * t)), 4500) * .5
    return x * ((t % .75) < .5) * env(d, .01, .05)
def buzz(d): t = tt(d); return lp(np.sign(np.sin(2 * np.pi * 150 * t)), 400) * ((t % .75) < .5) * env(d, .01, .05)
def whoosh(d=.4, lo=300, hi=2500): return bp(noise(d), lo, hi) * np.sin(np.pi * tt(d) / d) ** 2
def zap(): d = .07; return (hp(noise(d), 2000) + lp(np.sign(np.sin(2 * np.pi * 120 * tt(d))), 800)) * env(d, .003, .03)
def hum(d, f=120): t = tt(d); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t)) * env(d, .1, .3)
def lubdub(t, g=.5): put(sweep(70, 45, .14) * np.exp(-tt(.14) * 22), t, g); put(sweep(64, 42, .12) * np.exp(-tt(.12) * 24), t + .16, g * .7)
def bed(t0, t1, kind, g):
    d = t1 - t0; x = noise(d)
    if kind == 'wind': x = bp(x, 200, 900) * (.55 + .45 * np.sin(2 * np.pi * .35 * tt(d)) ** 2)
    elif kind == 'room': x = lp(x, 300) * .6 + hum(d, 60) * .02
    elif kind == 'static': x = hp(x, 3000) * (rs.rand(len(x)) > .5)
    elif kind == 'whisper': x = bp(x, 1500, 5000) * (.5 + .5 * np.sin(2 * np.pi * 3.3 * tt(d)) ** 2)
    put(x / (np.abs(x).max() + 1e-9) * env(d, min(.3, d / 3), min(.3, d / 3)), t0, g)
def crickets(t0, t1, g):
    d = t1 - t0; t = tt(d); x = sum(np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * r * t) > .2) * (np.sin(2 * np.pi * r2 * t + p) > -.1) for f, r, r2, p in ((4300, 34, .9, 0), (4700, 41, .7, 2)))
    put(x * env(d, .3, .3), t0, g)

T_IN = F(5.3) + 1.42          # door opens
T_INSIDE = F(17.15)           # back inside with the box
# --- room tone, TV, outside ---
bed(0, F(45.9), 'room', .012)
bed(0, T_IN, 'wind', .006); crickets(0, T_IN, .004)
bed(T_IN - .05, T_INSIDE, 'wind', .05); crickets(T_IN, T_INSIDE, .02); put(whoosh(.7, 200, 1400), T_IN - .05, .08)
bed(T_INSIDE, F(44.55), 'wind', .008); crickets(T_INSIDE, F(44.55), .005)
# 1 knocks: two while he's on the couch, three on the door shot
for k in (0, .2): put(knock(), F(2.92) + k, .5)
for k in (.05, .24, .43): put(knock(), F(3.55) + k, .6)
# 2 footsteps, latch, creak
for k in (.2, .48, .76, 1.02): put(step(), F(5.3) + k, .35)
put(click(), T_IN - .02, .25); put(creak(.6, 200, 280), T_IN, .08)
# 6 red marks
for o in (14.8, 15.45): put(step(1.4), F(o), .35); put(whoosh(.15, 1500, 5000), F(o) - .05, .05)
# 7 shake: pick-up thud, then the rattle
put(step(), F(17.15) + .05, .3); put(rattle(F(19.05) - F(17.15) - .35), F(17.15) + .35, .12)
# 8 ticking, until the phone rings
k = F(19.05)
while k < F(25.95):
    put(tick(), k, .16 if k < F(21.1) else .07); k += .5
# 9-10 cardboard flaps, paper
put(cardboard(F(23.5) - F(21.1) - .1), F(21.1) + .1, .06); put(rustle(.8), F(23.5) + .2, .04)
# 11 the ring + buzz in the box, stops when he picks it up
RING0, RING1 = F(25.95), F(27.8) + .5
put(ringer(RING1 - RING0), RING0, .045); put(buzz(RING1 - RING0), RING0, .05); put(click(), RING1, .3)
# 12-13 line static, a breathy whisper bed under the narrator's whisper
bed(RING1, F(32.5), 'static', .012); bed(F(29.35), F(31.4), 'whisper', .02)
# 14 curtains
put(whoosh(.45, 500, 3000), F(32.5) + .05, .1)
# 15 street lamp flickers on, then hums
for k in (.1, .3, .42, .55): put(zap(), F(33.7) + k, .08)
put(hum(F(42.5) - F(33.7) - .55, 120) * .5, F(33.7) + .55, .02)
# 17-18 the smile, the point
put(whoosh(.9, 200, 1200)[::-1], F(39.3) - .7, .07); put(whoosh(.35, 300, 2200), F(40.1) + .1, .12)
# 19 the second knock - closer, louder
for k in (-.02, .17, .36): put(knock(1.2), F(43.65) + k, .45)
# heartbeat through the end
k = F(43.65) + .5
while k < F(47.5) + 1.2: lubdub(k, .5); k += .6
# 21 knocks from inside the closet, the lamp dies, the closet door creaks open
CL = F(47.5)
for k in (.02, .24, .46): put(knock(1.3, muffled=True), CL + k, .45)
for k in (.7, .74, .8, .85): put(zap(), CL + k, .1)
put(creak(.9, 150, 210), CL + .9, .1)
sfx -= np.mean(sfx)
music = make_music(CUT['duration'], F); music *= 10 ** (-27 / 20) / np.sqrt(np.mean(music ** 2))
mix = voice + sfx + music
fade = np.ones(N); fl = int(.35 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2; mix *= fade  # the picture fades to black too
mix = np.tanh(mix * 1.05) / np.tanh(1.05) * .95
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('voice rms %.1f dB | sfx rms %.1f dB peak %.2f | music rms %.1f dB | mix peak %.2f' % (db(voice), db(sfx), np.abs(sfx).max(), db(music), np.abs(mix).max()))
h = SR // 2; worst = sorted(((db(sfx[i:i + h]) - db(voice[i:i + h]), round(i / SR, 2)) for i in range(0, N - h, h // 2) if db(voice[i:i + h]) > -30), reverse=True)[:6]
print('loudest sfx relative to speech (dB, final s):', [(round(float(a), 1), b) for a, b in worst])
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
