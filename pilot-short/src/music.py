"""Backing track written in code: a tense D-minor thriller pulse (about 129 BPM) that follows the story - calm for the
climb, silence before the bang, a drop when they think he is dead, a build as they refuse to let go, and a heroic
lift for the landing. 20 bars exactly fill the video so it loops."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def make_music(dur, tm):
    N = int(dur * SR); rs = np.random.RandomState(9); BARS = 20; beat = dur / (BARS * 4); bar = beat * 4
    hz = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
    stems = {k: np.zeros(N + SR) for k in ('kick', 'snare', 'hat', 'hat2', 'bass', 'arp', 'lead', 'pad', 'fx')}
    def put(stem, sig, t, g=1.0):
        i = int(t * SR)
        if 0 <= i < N: stems[stem][i:i + len(sig)] += sig[:len(stems[stem]) - i] * g
    def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
    def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
    def kick(): t = tt(.18); f = 44 + 96 * np.exp(-t * 32); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 17)
    def snare(): t = tt(.14); return (hp(rs.randn(len(t)), 1300) * .7 + np.sin(2 * np.pi * 190 * t) * .45) * np.exp(-t * 26)
    def hat(): t = tt(.03); return hp(rs.randn(len(t)), 7500) * np.exp(-t * 130)
    def bass(m, d): t = tt(d); f = hz(m); x = 2 * ((f * t) % 1) - 1; return lp(x + np.sin(2 * np.pi * f * t), 520) * np.minimum(1, t / .004) * np.exp(-t * 6)
    def pluck(m, d=.2): t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .35 * np.sign(np.sin(2 * np.pi * f * t))) * np.exp(-t * 19) * np.minimum(1, t / .002)
    def horn(m, d): t = tt(d); f = hz(m) * (1 + .005 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .15)); ph = 2 * np.pi * np.cumsum(f) / SR; x = sum(np.sin(k * ph) / k for k in (1, 2, 3, 4)); return lp(x, 2400) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .06)
    def pad(ms, d, a=.2, r=.35): t = tt(d); return sum(np.sin(2 * np.pi * hz(m) * t * (1 + .002 * k)) + .3 * (2 * ((hz(m) * t) % 1) - 1) for k, m in enumerate(ms)) / len(ms) * np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
    CH = [(38, (62, 65, 69)), (34, (62, 65, 70)), (41, (60, 65, 69)), (36, (60, 64, 67))]      # Dm | Bb | F | C
    MEL = [[74, 0, 0, 77, 0, 76, 74, 0], [77, 0, 0, 82, 0, 81, 77, 0], [81, 0, 0, 84, 0, 81, 77, 0], [79, 0, 76, 0, 79, 0, 84, 0]]
    for b in range(BARS):
        root, tones = CH[b % 4]; t0 = b * bar; e = beat / 2; s = beat / 4
        for k in range(4): put('kick', kick(), t0 + k * beat)
        for k in (1, 3): put('snare', snare(), t0 + k * beat)
        for k in range(8): put('hat', hat(), t0 + k * e, .5 if k % 2 else .25)
        for k in range(16): put('hat2', hat(), t0 + k * s, .4 if k % 4 else .15)
        for k in range(8): put('bass', bass(root + (12 if k in (3, 7) else 0), e * .85), t0 + k * e)
        for k in range(8): put('arp', pluck(tones[(0, 1, 2, 1, 0, 2, 1, 2)[k]] + (12 if k % 4 == 3 else 0)), t0 + k * e, .8 if k % 2 == 0 else .55)
        for k, m in enumerate(MEL[b % 4]):
            if m: put('lead', horn(m, e * (2.8 if (k + 2 < 8 and MEL[b % 4][k + 1] == 0 and MEL[b % 4][k + 2] == 0) else 1.9 if (k + 1 < 8 and MEL[b % 4][k + 1] == 0) else .95)), t0 + k * e)
    t = np.arange(N + SR) / SR
    def win(a, b, e0=.06, e1=None): return np.clip((t - tm(a)) / e0, 0, 1) * np.clip((tm(b) - t) / (e1 or e0), 0, 1)
    calm = win(6.65, 11.3); hush = win(11.3, 12.5, .05, .01); slow = win(13.45, 15.8); dead = win(29.75, 33.7, .1, .05); build = win(33.7, 36.2, .05, .02)
    hero = win(36.2, 40.55); alive = win(40.55, 42.6, .04); hosp = win(42.6, 45.35); work = win(45.35, 48.25); why = win(48.25, 52.95); panic = win(12.5, 29.75) * (1 - slow)
    quiet = (1 - hush) * (1 - dead) * (1 - alive)
    # one-off moments
    put('fx', kick() * 1.5, tm(12.5)); put('pad', pad((26, 38, 45), tm(13.45) - tm(12.5) + .2, .01), tm(12.5), .6)     # the bang
    put('pad', pad((38, 45, 50, 53), tm(15.8) - tm(13.45), .1), tm(13.45), .4)                                         # slow motion
    put('pad', pad((38, 41, 45), tm(33.7) - tm(29.75), .4, .3), tm(29.75), .7)                                         # cold, still D minor
    BD = tm(36.2) - tm(33.7); r = tt(BD); put('fx', np.sin(2 * np.pi * np.cumsum(180 * 3.2 ** (r / BD)) / SR) * (r / BD) ** 2, tm(33.7), .45)   # riser
    for k in range(int(BD / (beat / 4))): put('fx', snare(), tm(33.7) + k * beat / 4, .5 * (k * (beat / 4) / BD) ** 1.5)                         # snare roll
    put('fx', kick() * 1.4, tm(34.36)); put('fx', kick() * 1.4, tm(36.2))
    put('pad', pad((50, 54, 57, 62, 66), tm(42.6) - tm(41.67) + .25, .03), tm(41.67), .9)                              # D major: he is alive
    put('pad', pad((45, 52, 57), tm(41.67) - tm(40.55), .1, .1), tm(40.55), .4)
    put('pad', pad((53, 57, 60, 65), tm(45.35) - tm(42.6), .2), tm(42.6), .35)                                         # hospital: gentle F
    put('fx', kick() * 1.2, tm(51.8))
    mix = (stems['kick'] * (1 - .6 * calm) * (1 - slow) * (1 - hosp) * (1 - .5 * why) * (1 - build) * .9
           + stems['snare'] * (1 - calm) * (1 - slow) * (1 - hosp) * (1 - why) * (1 - build) * .3
           + stems['hat'] * (1 - slow) * (1 - .5 * hosp) * .22 + stems['hat2'] * (panic + hero) * .16
           + stems['bass'] * (1 - .45 * calm) * (1 - .4 * hosp) * (.5 + .12 * panic + .12 * hero)
           + stems['arp'] * (1 - .3 * panic) * (1 - slow) * (1 - build) * .3
           + stems['lead'] * (hero + .8 * work + .5 * win(0, 5.05) + .5 * win(52.95, 56)) * .3) * quiet + stems['pad'] * .5 + stems['fx'] * .5
    mix = lp(mix, 7500)[:N]; return mix / np.abs(mix).max()
