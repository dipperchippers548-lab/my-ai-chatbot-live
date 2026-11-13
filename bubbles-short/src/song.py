"""The Bubble Song - an original nursery-style song (C major, 112 BPM, 24 bars).
Everything in the short is timed from this file: lyrics + melody, spoken lines, SFX events, chords.
Note syntax per line: 'word-with-syl-la-bles:midi/beats,midi/beats ...'  ('_:0/beats' = rest)."""
BPM = 112
BEAT = 60 / BPM
BAR = 4 * BEAT
PRE = 0.30            # seconds of silence before bar 1
NBARS = 24
TAIL = 1.6            # ring-out after the last bar
DUR = PRE + NBARS * BAR + TAIL

def t_of(bar, beat=0.0):
    """song time (s) of a 1-indexed bar + beat offset"""
    return PRE + ((bar - 1) * 4 + beat) * BEAT

CHORUS = [
    ("Bubbles, bubbles, round and round,",   "Bub-bles:67/.5,64/.5 bub-bles:67/.5,64/.5 round:65/.75 and:64/.25 round:62/1"),
    ("floating up and floating down,",        "float-ing:62/.5,64/.5 up:65/.75 and:67/.25 float-ing:69/.5,67/.5 down:64/1"),
    ("bubbles, bubbles, in the air,",         "bub-bles:67/.5,64/.5 bub-bles:67/.5,64/.5 in:65/.75 the:64/.25 air:62/1"),
    ("bubbles, bubbles, everywhere!",         "bub-bles:62/.5,64/.5 bub-bles:65/.5,62/.5 ev-ery-where:64/.5,62/.5,60/1"),
]
# sung lines: (bar, voice, text, notes)   voice 'lulu' = solo, 'choir' = Lulu + friend double
SUNG = [
    *[(3 + i, 'lulu', a, b) for i, (a, b) in enumerate(CHORUS)],
    (7,  'lulu', "Tiny bubbles, one, two, three,",   "Ti-ny:64/.5,64/.5 bub-bles:67/.5,67/.5 one:69/.5 two:67/.5 three:64/1"),
    (8,  'lulu', "floating up above the tree!",      "float-ing:65/.5,65/.5 up:62/.75 a-bove:62/.25,64/.5 the:65/.5 tree:67/1"),
    (9,  'lulu', "Lulu pops them, pop, pop, pop!",   "Lu-lu:67/.5,64/.5 pops:67/.5 them:64/.5 pop:67/.5 pop:69/.5 pop:72/1"),
    (11, 'lulu', "One big bubble, big and round,",   "One:60/.5 big:64/.5 bub-ble:67/.5,67/.5 big:69/.75 and:67/.25 round:64/1"),
    (12, 'lulu', "wobble, wobble, off the ground!",  "wob-ble:65/.5,62/.5 wob-ble:65/.5,62/.5 off:64/.75 the:62/.25 ground:60/1"),
    (14, 'lulu', "Then it goes... POP!",             "Then:67/.5 it:67/.5 goes:69/1 POP:72/1"),
    (15, 'lulu', "Biscuit jumps to catch one too,",  "Bis-cuit:64/.5,64/.5 jumps:67/.5 to:67/.5 catch:69/.75 one:67/.25 too:64/1"),
    (16, 'lulu', "bubble on his nose, achoo!",       "bub-ble:65/.5,65/.5 on:62/.5 his:62/.5 nose:64/.75 a-choo:65/.25,67/1"),
    *[(19 + i, 'choir', a, b) for i, (a, b) in enumerate(CHORUS)],
    (23, 'choir', "POP!",                            "POP:72/1.5"),
]
# spoken lines: (bar, beat, who, text, tts voice, rate, pitch)
SPOKEN = [
    (1, 0.25, 'lulu',   "Hi!",                  'en-US-AnaNeural', '+0%', '+0Hz'),
    (1, 1.6,  'lulu',   "I'm Lulu!",            'en-US-AnaNeural', '+0%', '+0Hz'),
    (2, 0.0,  'lulu',   "Let's blow bubbles!",  'en-US-AnaNeural', '+0%', '+0Hz'),
    (13, 0.0, 'bobble', "Hello!",               'en-US-AnaNeural', '+5%', '+45Hz'),
    (13, 1.5, 'bobble', "I'm Bobble!",          'en-US-AnaNeural', '+5%', '+45Hz'),
    (17, 0.0, 'lulu',   "Bless you, Biscuit!",  'en-US-AnaNeural', '+0%', '+0Hz'),
    (10, 1.0, 'lulu',   "Hee hee hee!",         'en-US-AnaNeural', '+0%', '+20Hz'),
]
# chords: bar -> [(beat, root midi, quality)]
C, Dm, F, G, G7, Am = (48, 'maj'), (50, 'min'), (53, 'maj'), (43, 'maj'), (43, 'dom7'), (45, 'min')
_CH_CHORUS = [[(0, *C)], [(0, *F), (2, *C)], [(0, *C)], [(0, *G7), (3, *C)]]
CHORDS = {1: [(0, *C)], 2: [(0, *G)],
          **{3 + i: c for i, c in enumerate(_CH_CHORUS)},
          7: [(0, *C)], 8: [(0, *Dm), (2, *G)], 9: [(0, *C)], 10: [(0, *G7)],
          11: [(0, *C)], 12: [(0, *Dm), (2, *G), (3, *C)], 13: [(0, *Am), (2, *F)], 14: [(0, *G), (2, *C)],
          15: [(0, *C)], 16: [(0, *Dm), (2, *G)], 17: [(0, *F), (2, *G)], 18: [(0, *G7)],
          **{19 + i: c for i, c in enumerate(_CH_CHORUS)},
          23: [(0, *C)], 24: [(0, *C)]}
STOPS = [(14, 3.0, 14, 4.0), (23, 1.5, 24, 0.0)]   # band drops out: (bar, beat) -> (bar, beat)
# SFX / story events: (bar, beat, kind)
EVENTS = [
    (1, 0.0, 'sparkle'),            # title shimmer
    (2, 0.6, 'bark'), (2, 1.6, 'bark'),
    (2, 3.0, 'blow'),               # first big blow into the chorus
    (3, 0.0, 'bubbles'), (5, 0.0, 'bubbles'),
    (9, 2.0, 'pop'), (9, 2.5, 'pop'), (9, 3.0, 'popbig'),
    (10, 0.0, 'bark'), (10, 2.5, 'pop'), (10, 3.0, 'pop'),
    (11, 0.0, 'blowlong'),
    (12, 0.0, 'wobble'), (12, 2.0, 'wobble'),
    (13, 3.2, 'blink'),
    (14, 3.0, 'popbig'), (14, 3.05, 'sparkle'),
    (15, 0.5, 'jump'), (15, 2.5, 'snap'),
    (16, 2.0, 'land'), (16, 3.5, 'sneeze'), (16, 3.6, 'pop'),
    (18, 0.0, 'bark'), (18, 1.0, 'bark'), (18, 2.0, 'whoosh'),
    (19, 0.0, 'bubbles'), (21, 0.0, 'bubbles'),
    (21, 0.0, 'rainbow'),
    (23, 0.0, 'popall'), (23, 0.05, 'sparkle'),
    (24, 0.0, 'chime'),
]

def parse_notes(spec):
    """-> list of words: {'word', 'syl': [(text, midi, beat_off, beats)]}"""
    words, b = [], 0.0
    for tok in spec.split():
        w, ns = tok.split(':'); notes = ns.split(',')
        syl = w.split('-')
        if w == '_':
            b += float(notes[0].split('/')[1]); continue
        assert len(syl) == len(notes), (w, notes)
        ent = {'word': w.replace('-', ''), 'syl': []}
        for s, n in zip(syl, notes):
            m, d = n.split('/'); ent['syl'].append((s, int(m), b, float(d))); b += float(d)
        words.append(ent)
    assert b <= 4.01, (spec, b)
    return words
