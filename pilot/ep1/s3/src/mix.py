"""Scene 3 sound + original music -> build/mix.wav. Event times on the voice clock, mapped through the pause cuts with F()."""
import json, sys
import sys; sys.path.insert(0, "src"); from synth import *    # shared synth helpers from the cold open
C = json.load(open('build/cuts.json')); DUR = C['duration']; N = int(DUR * SR); out = np.zeros(N)
def F(t): return t - sum(min(t, b) - a for a, b in C['cuts'] if t > a)
def put(sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    sig = sig[:N - i]; out[i:i + len(sig)] += sig * g
def saw(m, d): x = tt(d); ph = (hz(m) * x) % 1; return (2 * ph - 1)
def brass(ms, d=.35, g=1.0): return norm(sum(lp(saw(m, d) + saw(m + .08, d), 2600) for m in ms)) * env(d, .012, .18) * g
def kick(): return thud(55, .25)
def snare(): return norm(bp(noise(.16), 900, 5000) * np.exp(-tt(.16) * 22) + sweep(240, 180, .16) * np.exp(-tt(.16) * 30) * .4)
def hat(): return norm(hp(noise(.05), 7000)) * np.exp(-tt(.05) * 70)
def crash(d=1.6): return norm(hp(noise(d), 4000)) * np.exp(-tt(d) * 2.6)
KEY = 57                      # A (the key you sang in)
I, VI, IV, V5 = [0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]
PROG = [I, VI, IV, V5]
def vamp(t0, t1, bpm=120, g=1.0, calliope=False, drums=True):
    b = 60 / bpm; k = 0; t = t0
    while t < t1 - .05:
        ch = PROG[(k // 4) % 4]; root = KEY + ch[0] - 24
        if k % 2 == 0: put(pluck(root, b * .9, .2) + .6 * pluck(root - 12, b * .9, .1), t, .5 * g)          # oom
        else:
            for m in ch: put((sq if calliope else pluck)(KEY + m, b * .5) * (.35 if calliope else 1), t, .14 * g)   # pah
        if drums: put(kick(), t, .22 * g) if k % 2 == 0 else put(snare(), t, .1 * g); put(hat(), t + b / 2, .05 * g)
        if calliope and k % 2 == 1: put(sq(KEY + 12 + [0, 4, 7, 12, 7, 4, 2, 4][(k // 2) % 8], b * .45) * .3, t + b / 2, .09 * g)
        t += b; k += 1
# ---- 1: wind, then BANG - spotlight slams on, confetti cannon
put(norm(bp(noise(DUR), 300, 1200)) * env(DUR, .5, .5), 0, .010)
B = F(3.7); put(thud(48, .8), B, .5); put(norm(bp(noise(.5), 2000, 7000)) * np.exp(-tt(.5) * 9), B, .12)
for k in range(10): put(blip(300, 900, .06), B + .03 + k * .025, .03)
# ---- 2: Tee rockets in... SCREEECH
put(norm(sweep(1600, 300, 1.0) * .6 + bp(noise(1.0), 400, 3000)) * env(1.0, .3, .1), F(4.15), .1); put(norm(bp(noise(.4), 2500, 6000) * sweep(1, 1, .4)) * env(.4, .01, .2), F(5.15), .07)
put(thud(80, .3), F(5.2), .2)
# under the dialogue: a little calliope vamp
vamp(F(5.6), F(38.6), bpm=124, g=.55, calliope=True, drums=False)
# pokes, the loop-de-loop, the crane up
for k in range(4): put(norm(sweep(500, 900, .12)) * np.exp(-tt(.12) * 18), F(16.85) + .175 + k * .698, .07)
put(whoosh(1.2, 300, 2500), F(19.5), .08); put(whoosh(.9, 300, 2500), F(20.9), .06)
put(norm(sweep(200, 900, 3.0)) * env(3.0, 1.0, .5) * .5, F(28.2), .05)
put(brass([KEY + 12 + m for m in I], .9), F(36.6), .12)                         # "...your HOST!" ta-daa
# lights go DOWN (power-down), then the spotlight SLAM that starts the song
put(norm(sweep(400, 40, 1.4)) * env(1.4, .02, .5), F(38.6), .12); put(thud(40, .9), F(42.75), .55); put(crash(), F(42.75), .06)
# ---- the SONG: showtune backing, brass stab on every line, drops out for "Seriously...", big finish
S0, S1 = F(42.75), F(87.6); DROP0, DROP1 = F(75.0), F(78.35)
vamp(S0, DROP0, bpm=120, g=1.0); vamp(DROP1, F(83.6), bpm=120, g=1.05)
LINES = [42.9, 45.5, 48.3, 50.6, 53.6, 57.6, 60.1, 63.6, 67.4, 71.2, 78.5]
for i, l in enumerate(LINES): put(brass([KEY + 12 + m for m in PROG[i % 4]], .32), F(l), .1)
put(crash(), F(45.5), .05); put(crash(), F(57.9), .07)
for c in (F(57.9), F(85.3)):                                                       # fireworks
    for k in range(4): put(thud(90, .35), c + k * .35, .1); put(crackle(1.2), c + k * .35 + .1, .05)
d = DROP1 - DROP0; put(np.sin(2 * np.pi * hz(KEY - 24) * tt(d)) * env(d, .2, .3), DROP0, .18)      # "Seriously..." - just a low hum
for k in np.arange(DROP0 + .3, DROP1, .85): put(thud(50, .2), k, .12); put(thud(50, .2), k + .22, .08)   # ...and a heartbeat
fin0 = F(83.6); put(crash(), DROP1, .06)
for k in np.arange(fin0, F(86.9), .07): put(snare(), k, .035 + .05 * (k - fin0) / 3.3)      # drum roll
put(brass([KEY + 12 + m for m in I] + [KEY + 24], 1.8), F(86.9), .2); put(crash(2.4), F(86.9), .1); put(kick(), F(86.9), .4)
# canned applause from nowhere... then crickets
d = 2.6; put(norm(bp(noise(d), 800, 5000) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 11 * tt(d))))) * env(d, .1, 1.0), F(87.9), .05)
for k in np.arange(F(90.6), F(93.3), .45): put(np.sin(2 * np.pi * 4300 * tt(.12)) * (np.sin(2 * np.pi * 30 * tt(.12)) > 0) * env(.12), k, .02)
vamp(F(93.6), F(101.9), bpm=124, g=.45, calliope=True, drums=False)
# the screen glitch... "Come, come!" and they ROCKET off
put(bitcrush(.35, 180), F(101.95), .08); put(norm(bp(noise(.35), 500, 6000)), F(101.95), .05)
put(norm(sweep(300, 1800, 1.2) * .6 + bp(noise(1.2), 400, 3000)) * env(1.2, .05, .5), F(106.3), .12)
# ---- voice on top
w = wave.open('build/voice.wav'); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close(); v = v / np.abs(v).max() * .9
music_db = 20 * np.log10(np.sqrt(np.mean(out ** 2)) + 1e-9)
out = out * 10 ** ((-26 - music_db) / 20)                    # music + sfx sit well under the voice
put(v, 0, 1.0)
mix = np.clip(np.tanh(out * 1.05) / np.tanh(1.05) * .95, -.98, .98)
fade = np.ones(N); fl = int(.8 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5; mix *= fade
print('peak %.2f' % np.abs(mix).max())
st = np.stack([mix, mix], 1); o = wave.open('build/mix.wav', 'w'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((st * 32767).astype(np.int16).tobytes()); o.close()
