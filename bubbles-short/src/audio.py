"""Backing track (ukulele, glockenspiel, soft bass, light kit), synthesized SFX and the final stereo mix.
-> build/mix.wav (48 kHz stereo, -14 LUFS), build/stems/*.wav, build/timeline.json (bars, words, events, mouth curves)"""
import os, sys, json
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter, fftconvolve
sys.path.insert(0, os.path.dirname(__file__))
import song
SR = 48000; N = int(song.DUR * SR); FPS = 30
rs = np.random.RandomState(11)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
tt = lambda d: np.arange(int(d * SR)) / SR
def lp(x, f, o=2): b, a = butter(o, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def put(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(buf) - i)
    if n > 0: buf[i:i + n] += sig[:n] * g
def sweep(f0, f1, d):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------------- instruments ----------------
def pluck(m, d=1.2, bright=.5):
    """Karplus-Strong ukulele string"""
    f = hz(m); L = max(2, int(SR / f)); buf = (rs.rand(L) * 2 - 1); buf = lp(buf, 2000 + 5000 * bright, 1)
    n = int(d * SR); out = np.zeros(n); y = buf.copy(); i = 0; damp = .996
    while i < n:
        k = min(L, n - i); out[i:i + k] = y[:k]
        y = damp * .5 * (y + np.roll(y, -1)); i += L
    return out * np.minimum(1, tt(d)[:n] / .002)
_pluck_cache = {}
def pluck_c(m, bright):
    k = (m, round(bright, 1))
    if k not in _pluck_cache: _pluck_cache[k] = pluck(m, 1.1, bright)
    return _pluck_cache[k]
def glock(m, d=1.3):
    t = tt(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9) + .12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 20)) * np.exp(-t * 3.2) * np.minimum(1, t / .001)
def bass(m, d):
    t = tt(d); f = hz(m); x = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t) + .1 * np.sin(6 * np.pi * f * t)
    return x * np.exp(-t * 2.2) * np.minimum(1, t / .006) * np.minimum(1, (d - t) / .03)
def kick(): t = tt(.22); return np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-t * 30)) / SR) * np.exp(-t * 14)
def clap():
    d = .18; n = rs.randn(int(d * SR)); env = np.zeros(int(d * SR))
    for k, o in enumerate((0, .011, .022)): i = int(o * SR); env[i:] += np.exp(-np.arange(len(env) - i) / SR * (60 if k < 2 else 22))
    return bp(n, 900, 5000) * env * .6
def shaker(): d = .06; return hp(rs.randn(int(d * SR)), 6000) * np.exp(-tt(d) * 70) * np.minimum(1, tt(d) / .01)
def snare(): d = .16; t = tt(d); return (bp(rs.randn(len(t)), 1500, 7000) * .7 + np.sin(2 * np.pi * 190 * t) * .5) * np.exp(-t * 26)
def tamb(): d = .12; return bp(rs.randn(int(d * SR)), 5000, 12000) * np.exp(-tt(d) * 30)

QUAL = {'maj': (0, 4, 7), 'min': (0, 3, 7), 'dom7': (0, 4, 7, 10)}
def uke_voicing(root, q):
    pcs = [(root + i) % 12 for i in QUAL[q]]; notes = []
    for base in range(60, 72):
        if base % 12 in pcs: notes.append(base)
    notes = notes[:4]
    if len(notes) < 4: notes.append(notes[0] + 12)
    return sorted(notes)
def chord_at(bar, beat):
    ch = song.CHORDS.get(bar, [(0, 48, 'maj')]); cur = ch[0]
    for c in ch:
        if c[0] <= beat + 1e-6: cur = c
    return cur[1], cur[2]

def make_music():
    st = {k: np.zeros(N) for k in ('uke', 'glock', 'bass', 'kick', 'clap', 'shaker', 'snare', 'tamb')}
    B = song.BEAT
    PAT = [(0, 1, 1.0), (1, 1, .8), (1.5, -1, .55), (2.5, -1, .6), (3, 1, .8), (3.5, -1, .55)]
    for bar in range(1, song.NBARS + 1):
        t0 = song.t_of(bar)
        drums = 3 <= bar <= 22; full = bar >= 19
        # ukulele strum
        if bar <= 23:
            pat = PAT if bar not in (23,) else [(0, 1, 1.0)]
            for b, dirn, g in pat:
                r, q = chord_at(bar, b); notes = uke_voicing(r, q)[::dirn]
                for k, m in enumerate(notes): put(st['uke'], pluck_c(m, .55 if dirn > 0 else .4), t0 + b * B + k * .011, g * (1 if dirn > 0 else .8))
        if bar == 24:
            for k, m in enumerate(uke_voicing(48, 'maj') + [72]): put(st['uke'], pluck(m, 2.5, .5), t0 + k * .03, .9)
        # bass
        if bar >= 2 and bar <= 23:
            for b in ((0, 2) if bar != 23 else (0,)):
                r, q = chord_at(bar, b); m = r - 12 + (0 if b == 0 or len(song.CHORDS.get(bar, [])) > 1 else 7)
                put(st['bass'], bass(m + 12, B * 1.8), t0 + b * B)
        # kit
        if drums:
            for b in (0, 2): put(st['kick'], kick(), t0 + b * B)
            for b in (1, 3): put(st['clap'], clap(), t0 + b * B, .9 if full else .65)
            for k in range(8): put(st['shaker'], shaker(), t0 + k * B / 2, .9 if k % 2 else .45)
            if full:
                for k in range(4): put(st['tamb'], tamb(), t0 + (k + .5) * B, .5)
        if bar in (2, 18, 22):   # fills into the choruses / the POP
            for k in range(4 if bar == 2 else 8): put(st['snare'], snare(), t0 + (2 + k * (.5 if bar == 2 else .25)) * B, .35 + .08 * k)
        if bar == 23: put(st['kick'], kick(), t0); put(st['clap'], clap(), t0, 1.0)
    # glockenspiel: sparkly intro arpeggio, doubles the melody (octave up) in the choruses, a tag at the end
    for k, m in enumerate([72, 76, 79, 84, 79, 76, 72, 76]): put(st['glock'], glock(m), song.t_of(1) + k * B / 2, .55)
    for k, m in enumerate([79, 77, 76, 74]): put(st['glock'], glock(m), song.t_of(2, 2) + k * B / 2, .5)
    for bar, v, text, spec in song.SUNG:
        g = .55 if bar in range(3, 7) or bar >= 19 else .22
        for w in song.parse_notes(spec):
            for s, m, b, d in w['syl']: put(st['glock'], glock(m + 12, 1.0), song.t_of(bar, b), g)
    for k, m in enumerate([72, 76, 79, 84, 88]): put(st['glock'], glock(m, 2.2), song.t_of(24) + k * .09, .6)
    # band stops (the POPs)
    gate = np.ones(N); t = np.arange(N) / SR
    for b0, bt0, b1, bt1 in song.STOPS:
        a, b = song.t_of(b0, bt0), song.t_of(b1, bt1); gate *= 1 - np.clip((t - a) / .03, 0, 1) * np.clip((b - t) / .03, 0, 1)
    for k in st: st[k] *= gate
    return st

# ---------------- sound effects ----------------
def pop_s(f=1.0):
    d = .09; t = tt(d); x = sweep(500 * f, 1700 * f, d) * np.exp(-t * 45) + hp(rs.randn(len(t)), 2500) * np.exp(-t * 160) * .5
    return x
def popbig():
    d = .35; t = tt(d); x = sweep(220, 900, d) * np.exp(-t * 18) + bp(rs.randn(len(t)), 800, 6000) * np.exp(-t * 40) * .7
    return x + np.pad(sparkle() * .4, (int(.05 * SR), 0))[:len(x)]
def popall():
    o = np.zeros(int(.9 * SR))
    for k in range(14): put(o, pop_s(.8 + rs.rand() * .7), rs.rand() * .22, .5 + rs.rand() * .5)
    put(o, popbig(), 0, .9); return o
def sparkle():
    o = np.zeros(int(1.4 * SR))
    for k, m in enumerate([84, 88, 91, 96, 100]): put(o, glock(m, 1.0) * (1 + .3 * np.sin(2 * np.pi * 14 * tt(1.0))), k * .055, .5)
    return o
def chime():
    o = np.zeros(int(2.2 * SR))
    for k, m in enumerate([84, 91, 96]): put(o, glock(m, 2.0), k * .02, .6)
    return o
def breath(d):
    t = tt(d); x = bp(rs.randn(len(t)), 700, 3500) * np.sin(np.pi * t / d) ** 1.5; return x / np.abs(x).max()
def blips(d, n, lo=900, hi=2200):
    o = np.zeros(int(d * SR))
    for k in range(n): f = lo + rs.rand() * (hi - lo); s = sweep(f * .7, f, .05) * np.exp(-tt(.05) * 60); put(o, s, rs.rand() * (d - .06), .25 + rs.rand() * .3)
    return o
def blow(): x = breath(.7) * .5; put(x, blips(.6, 6), .15); return x
def blowlong(): d = 1.8; x = breath(d) * .45 + sweep(180, 420, d) * np.sin(np.pi * tt(d) / d) * .12; return x
def wobble():
    d = .5; t = tt(d); return np.sin(2 * np.pi * np.cumsum(140 + 60 * np.sin(2 * np.pi * 9 * t)) / SR) * np.sin(np.pi * t / d) * .8
def yip(f0=720):
    d = .16; t = tt(d); f = f0 * (1 - .35 * t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR; saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    v = bp(saw, 800, 1300) + .7 * bp(saw, 1600, 2600) + .2 * bp(rs.randn(len(t)), 2000, 6000) * np.exp(-t * 60)
    return v * np.minimum(1, t / .008) * np.exp(-t * 9)
def bark(): return yip(700 + rs.rand() * 80)
def slide_up(): d = .45; return sweep(400, 1500, d) * np.sin(np.pi * tt(d) / d) * .5
def land(): d = .25; t = tt(d); return (sweep(160, 70, d) + .3 * lp(rs.randn(len(t)), 300)) * np.exp(-t * 18)
def snap(): d = .05; return bp(rs.randn(int(d * SR)), 1200, 4000) * np.exp(-tt(d) * 90)
def sneeze():
    a = .26; t = tt(a); f = 600 + 400 * t / a; ph = 2 * np.pi * np.cumsum(f) / SR
    ah = (bp(2 * ((ph / (2 * np.pi)) % 1) - 1, 900, 1500) + .3 * bp(rs.randn(len(t)), 1500, 5000)) * np.sin(np.pi * t / a * .5) * .7
    c = .2; tc = tt(c); choo = bp(rs.randn(len(tc)), 2500, 8000) * np.exp(-tc * 18); y = yip(900); choo[:len(y)] += y[:len(choo)] * .5
    return np.concatenate([ah, choo])
def whoosh(): d = .45; return bp(rs.randn(int(d * SR)), 500, 3000) * np.sin(np.pi * tt(d) / d) ** 2 * .6
def harp():
    o = np.zeros(int(2.0 * SR))
    for k, m in enumerate([60, 64, 67, 72, 76, 79, 84, 88]): put(o, pluck(m + 12, 1.4, .7), k * .07, .45)
    return o
SFX = {'pop': pop_s, 'popbig': popbig, 'popall': popall, 'sparkle': sparkle, 'chime': chime, 'blow': blow, 'blowlong': blowlong,
       'bubbles': lambda: blips(song.BAR, 10), 'wobble': wobble, 'bark': bark, 'jump': slide_up, 'land': land, 'snap': snap,
       'sneeze': sneeze, 'whoosh': whoosh, 'rainbow': harp, 'blink': lambda: np.zeros(10)}
SFX_GAIN = {'pop': .55, 'popbig': .8, 'popall': .9, 'sparkle': .35, 'chime': .5, 'blow': .45, 'blowlong': .45, 'bubbles': .35,
            'wobble': .45, 'bark': .55, 'jump': .4, 'land': .5, 'snap': .5, 'sneeze': .6, 'whoosh': .3, 'rainbow': .35, 'blink': 0}

def reverb_ir(d=1.6, decay=3.2, seed=4):
    r = np.random.RandomState(seed); t = tt(d); ir = r.randn(len(t)) * np.exp(-t * decay); ir = lp(ir, 6000); ir[0] = 0; return ir / np.sqrt((ir ** 2).sum())
def comp(x, thr=.25, ratio=3.0):
    a = np.abs(x); e = lfilter([1 - np.exp(-1 / (.01 * SR))], [1, -np.exp(-1 / (.01 * SR))], a)
    g = np.where(e > thr, (thr + (e - thr) / ratio) / (e + 1e-9), 1.0); return x * g

if __name__ == '__main__':
    os.makedirs('build/stems', exist_ok=True)
    ld = lambda f: np.pad(sf.read(f)[0], (0, N))[:N]
    lulu, friend, bobble = ld('build/voc_lulu.wav'), ld('build/voc_friend.wav'), ld('build/voc_bobble.wav')
    # vocal chain: high-pass, presence lift, gentle compression
    def vchain(x): x = hp(x, 140); x = x + .35 * hp(x, 3000); return comp(x, .2, 3)
    lulu, friend, bobble = vchain(lulu), vchain(friend), vchain(bobble)
    bob_w = bobble + .5 * np.roll(bobble, int(.012 * SR))         # a bubbly doubled voice for Bobble
    st = make_music()
    sfx = np.zeros(N)
    for bar, beat, kind in song.EVENTS: put(sfx, SFX[kind](), song.t_of(bar, beat), SFX_GAIN[kind])
    ir = reverb_ir()
    def rev(x, amt): return fftconvolve(x, ir)[:N] * amt
    music_L = st['uke'] * .32 + st['glock'] * .16 + st['bass'] * .30 + st['kick'] * .42 + st['clap'] * .18 + st['shaker'] * .07 + st['snare'] * .22 + st['tamb'] * .07
    music_R = st['uke'] * .26 + st['glock'] * .22 + st['bass'] * .30 + st['kick'] * .42 + st['clap'] * .18 + st['shaker'] * .10 + st['snare'] * .22 + st['tamb'] * .10
    MG = .67   # band sits ~3.5 dB under the singing
    music_L, music_R = music_L * MG, music_R * MG
    voc = lulu * .95 + bob_w * .7
    vL = voc + friend * .45 + rev(voc, .12) + rev(friend, .06)
    vR = voc + friend * .6 + rev(voc, .12) + rev(friend, .07)
    mrev = rev(st['uke'] * .3 + st['glock'] * .2, .18) * MG
    sL, sR = sfx + rev(sfx, .1), sfx + rev(sfx, .1)
    L = vL + music_L + mrev + sL; R = vR + music_R + mrev + sR
    mix = np.stack([L, R], 1); SC = .89 / np.abs(mix).max(); mix = mix * SC
    # fade out tail
    fo = int(1.0 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    sf.write('build/mix_raw.wav', mix, SR)
    for k, v in [('vocals', np.stack([vL, vR], 1)), ('music', np.stack([music_L + mrev, music_R + mrev], 1)), ('sfx', np.stack([sL, sR], 1))]:
        sf.write(f'build/stems/{k}.wav', v * SC, SR)
    # mouth curves for lip-sync (per video frame)
    def mouth(x):
        h = SR // FPS; n = int(song.DUR * FPS) + 1; xp = np.pad(np.abs(hp(x, 200)), (0, n * h))[:n * h].reshape(n, h)
        r = np.sqrt((xp ** 2).mean(1)); r = r / (np.percentile(r[r > 1e-4], 95) + 1e-9) if (r > 1e-4).any() else r
        out = np.zeros(n); v = 0
        for i in range(n): v = max(r[i], v * .55); out[i] = v
        return np.clip(out, 0, 1).round(3).tolist()
    words = json.load(open('build/words.json'))
    def spoken_lines(words):
        sw = [w for w in words if w.get('spoken')]; out = []; i = 0
        for bar, beat, who, text, *_ in sorted(song.SPOKEN, key=lambda x: song.t_of(x[0], x[1])):
            n = len(text.split()); ws = sw[i:i + n]; i += n
            out.append({'text': text, 'who': who, 's': ws[0]['s'], 'e': ws[-1]['e']})
        assert i == len(sw), (i, len(sw)); return out
    tl = {'fps': FPS, 'dur': song.DUR, 'bpm': song.BPM, 'beat': song.BEAT, 'pre': song.PRE, 'nbars': song.NBARS,
          'bars': [round(song.t_of(b), 4) for b in range(1, song.NBARS + 2)],
          'events': [{'bar': b, 'beat': bt, 'kind': k, 't': round(song.t_of(b, bt), 4)} for b, bt, k in song.EVENTS],
          'sung': [{'bar': b, 'who': v, 'text': tx, 'notes': [[s, m, round(song.t_of(b, o), 4), round(d * song.BEAT, 4)] for w in song.parse_notes(sp) for s, m, o, d in w['syl']]} for b, v, tx, sp in song.SUNG],
          'spoken': spoken_lines(words), 'words': words, 'mouth': {'lulu': mouth(lulu), 'bobble': mouth(bobble)}}
    json.dump(tl, open('build/timeline.json', 'w'))
    print('mix written', mix.shape, 'peak', np.abs(mix).max().round(3))
