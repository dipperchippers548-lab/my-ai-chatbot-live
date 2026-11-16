"""Original horror bed written in code: a low detuned drone, a slightly out-of-tune music-box figure for the
set-up, a dissonant high pad and a slow heartbeat pulse that build after the phone rings, then everything drops out on
"But this time," and comes back as one hit when the eyes appear. Times are final (edited) seconds via F()."""
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def make_music(dur, F):
    N = int(dur * SR); t = np.arange(N) / SR; rs = np.random.RandomState(7)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    def win(a, b, e0=.3, e1=.3): return np.clip((t - a) / e0, 0, 1) * np.clip((b - t) / e1, 0, 1)
    saw = lambda f: 2 * ((t * f) % 1) - 1
    out = np.zeros(N)
    END = F(44.55)                      # everything stops on "But this time,"
    EYES = F(47.5) + 1.25               # ...and comes back as one hit
    # drone: D1/D2 + a flat fifth, slowly breathing filter
    drone = saw(hz(26)) + saw(hz(26) * 1.004) + .7 * saw(hz(38) * .997) + .4 * saw(hz(44))
    drone = lp(drone, 220) * (.8 + .2 * np.sin(2 * np.pi * .15 * t))
    out += drone * .55 * win(0, END, .6, .06)
    # music box: D minor figure with a wrong note, slightly detuned, only during the set-up
    notes = [74, 77, 81, 80, 74, 77, 82, 81]; step = .42; mb = np.zeros(N)
    for i, k in enumerate(np.arange(.2, F(21.1), step)):
        m = notes[i % len(notes)]; d = 1.2; tt = np.arange(int(d * SR)) / SR; f = hz(m) * (1 + .004 * np.sin(i))
        s = (np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 12) + .25 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 20)) * np.exp(-tt * 4.5)
        j = int(k * SR); mb[j:j + len(s)] += s[:N - j] if j < N else 0
    out += mb * .16 * win(0, F(21.1), .5, 1.5)
    # dissonant high pad: a cluster that swells after the ring
    pad = sum(np.sin(2 * np.pi * hz(m) * t + .4 * np.sin(2 * np.pi * (.17 + .05 * k) * t)) for k, m in enumerate((74, 75, 81, 86))) / 4
    swell = np.clip((t - F(25.7)) / (F(42.5) - F(25.7)), 0, 1) ** 1.5
    out += pad * .3 * swell * win(F(25.7), END, .8, .05)
    # a pulse like a slow heartbeat, getting a little faster
    pulse = np.zeros(N); k = F(19.05); per = .82
    while k < END:
        d = .25; tt = np.arange(int(d * SR)) / SR; s = np.sin(2 * np.pi * (48 + 40 * np.exp(-tt * 25)) * tt) * np.exp(-tt * 14)
        for off, g in ((0, 1), (.16, .6)):
            j = int((k + off) * SR)
            if j < N: pulse[j:j + len(s)] += (s * g)[:N - j]
        k += per; per = max(.55, per - .012)
    out += pulse * .7 * win(F(19.05), END, .5, .05)
    # stingers: the stranger appears, the pointing, and the eyes
    def hit(at, g=1.0, d=2.6):
        tt = np.arange(int(d * SR)) / SR; boom = np.sin(2 * np.pi * (34 + 60 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 1.6)
        scr = hp(rs.randn(len(tt)), 2500) * np.exp(-tt * 2.2) * .25 + sum(np.sin(2 * np.pi * f * tt * (1 + .01 * np.sin(2 * np.pi * 6 * tt))) for f in (hz(86), hz(87), hz(93))) / 3 * np.exp(-tt * 1.2) * .35
        s = (boom + scr) * g; j = int(at * SR)
        if j < N: out[j:j + len(s)] += s[:N - j]
    hit(F(33.7) + .55, .8); hit(F(40.1) + .15, .9); hit(EYES, 1.3, 3)
    out = lp(out, 9000)
    return out / np.abs(out).max()
