"""Turn neural TTS speech into sung notes (WORLD vocoder): every syllable is re-timed so its vowel lands on the beat
and re-pitched to the melody (with scoop, glide and vibrato).
-> build/voc_lulu.wav, build/voc_choir.wav, build/voc_bobble.wav (dry stems, 48 kHz, song length)
-> build/words.json (every sung/spoken word with song time, for captions)"""
import os, sys, json, re, subprocess
import numpy as np, soundfile as sf, pyworld as pw
sys.path.insert(0, os.path.dirname(__file__))
import song
from tts import synth
SR = 48000; FP = 5.0; HOP = FP / 1000
os.makedirs('build/tts', exist_ok=True)
N_FR = int(song.DUR / HOP) + 1

def tts_wav(text, voice, rate='-6%', pitch='+0Hz'):
    key = re.sub(r'[^a-z0-9]+', '_', f'{voice}_{rate}_{pitch}_{text}'.lower()).strip('_')[:90]
    mp3, wav, js = f'build/tts/{key}.mp3', f'build/tts/{key}.wav', f'build/tts/{key}.json'
    if not os.path.exists(js):
        words = synth(text, voice, mp3, rate, pitch); json.dump(words, open(js, 'w'))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', str(SR), wav], check=True)
    x, _ = sf.read(wav); return x.astype(np.float64), json.load(open(js))

def analyse(x):
    f0, t = pw.harvest(x, SR, f0_floor=110, f0_ceil=800, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, SR); ap = pw.d4c(x, f0, t, SR); return f0, sp, ap

def frame_rms(x):
    h = int(HOP * SR); n = len(x) // h + 1; xp = np.pad(x, (0, n * h - len(x)))
    return np.sqrt((xp.reshape(n, h) ** 2).mean(1) + 1e-12)

def norm(w): return re.sub(r"[^a-z]", "", w.lower())

class Track:
    def __init__(self, sp_dim):
        self.f0 = np.zeros(N_FR); self.lsp = np.full((N_FR, sp_dim), np.log(1e-10)); self.ap = np.ones((N_FR, sp_dim))
    def write(self, i0, f0, lsp, ap):
        i1 = min(N_FR, i0 + len(f0)); n = i1 - i0
        if n <= 0: return
        self.f0[i0:i1] = f0[:n]; self.lsp[i0:i1] = lsp[:n]; self.ap[i0:i1] = ap[:n]
    def render(self):
        y = pw.synthesize(self.f0, np.exp(self.lsp), self.ap, SR, FP); return y[:int(song.DUR * SR)]

def take(arr, idx):
    """fractional frame indices -> linearly interpolated rows"""
    idx = np.clip(idx, 0, len(arr) - 1.001); i = np.floor(idx).astype(int); k = (idx - i)[:, None] if arr.ndim == 2 else idx - i
    return arr[i] * (1 - k) + arr[i + 1] * k

def warp_index(n_in, n_out, head, tail):
    """map n_out output frames onto n_in input frames; when stretching keep head/tail frames 1:1, stretch the middle"""
    if n_out <= 0: return np.zeros(0)
    if n_in <= 1: return np.zeros(n_out)
    if n_out <= n_in or n_in - head - tail < 2: return np.linspace(0, n_in - 1, n_out)
    mid_out = n_out - head - tail
    return np.concatenate([np.arange(head), head + np.linspace(0, n_in - head - tail - 1, mid_out), (n_in - tail) + np.arange(tail)])

def sing_line(text, notes_spec, bar, voice, track, words_out, who, rate='-6%', detune=0.0, time_jit=0.0):
    x, tw = tts_wav(text, voice, rate)
    f0, sp, ap = analyse(x); lsp = np.log(sp + 1e-16); rms = 20 * np.log10(frame_rms(x)[:len(f0)] + 1e-9)
    lyr = song.parse_notes(notes_spec)
    tw = [w for w in tw if norm(w['w'])]
    assert [norm(w['w']) for w in tw] == [norm(w['word']) for w in lyr], ([w['w'] for w in tw], [w['word'] for w in lyr])
    nfr = len(f0); peak = rms.max()
    sylls = []   # (a, b) input frames + note
    for wi, (w, L) in enumerate(zip(tw, lyr)):
        a = int(w['s'] / HOP); nxt = int(tw[wi + 1]['s'] / HOP) if wi + 1 < len(tw) else nfr
        b = min(nxt, int((w['e'] + .12) / HOP), nfr)
        while b - a > 4 and rms[b - 1] < peak - 38: b -= 1        # drop trailing silence
        while b - a > 4 and rms[a] < peak - 45: a += 1            # and leading silence
        n = len(L['syl']); cuts = [a]
        sm = np.convolve(rms, np.ones(3) / 3, 'same')
        for k in range(1, n):
            c = a + (b - a) * k / n; lo, hi = int(c - (b - a) * .18 / 1), int(c + (b - a) * .18)
            lo, hi = max(cuts[-1] + 2, lo), min(b - 2, hi)
            cuts.append(lo + int(np.argmin(sm[lo:hi])) if hi > lo else int(c))
        cuts.append(b)
        for k, s in enumerate(L['syl']): sylls.append((cuts[k], cuts[k + 1], s, L['word'], k == 0))
    # placement in song time
    plan = []
    for a, b, (stxt, midi, boff, beats), word, first in sylls:
        v = np.where(f0[a:b] > 0)[0]
        if len(v): v0, v1 = a + v[0], a + v[-1] + 1
        else: v0, v1 = a, b
        on_n, co_n = v0 - a, b - v1
        T = song.t_of(bar, boff) + time_jit; D = beats * song.BEAT
        on_out = min(on_n * HOP, .075); co_out = min(co_n * HOP, .09)
        plan.append(dict(a=a, b=b, v0=v0, v1=v1, midi=midi + detune, T=T, D=D, on_out=on_out, co_out=co_out, word=word, first=first, txt=stxt))
    for i, p in enumerate(plan):
        start = p['T'] - p['on_out']
        nxt_start = plan[i + 1]['T'] - plan[i + 1]['on_out'] if i + 1 < len(plan) else 1e9
        connected = nxt_start - (p['T'] + p['D']) < .02
        end = min(nxt_start, p['T'] + p['D'] * (1.0 if connected else .93))
        nuc_out = max(.04, end - p['T'] - p['co_out'])
        i0 = int(round(start / HOP))
        n_on, n_nuc, n_co = int(round(p['on_out'] / HOP)), int(round(nuc_out / HOP)), int(round(p['co_out'] / HOP))
        idx = np.concatenate([np.linspace(p['a'], p['v0'] - 1e-3, n_on, endpoint=False) if n_on else np.zeros(0),
                              p['v0'] + warp_index(p['v1'] - p['v0'], n_nuc, 6, 9),
                              np.linspace(p['v1'], p['b'] - 1e-3, n_co, endpoint=False) if n_co else np.zeros(0)])
        F = take(f0, idx); S = take(lsp, idx); A = take(ap, idx)
        # pitch: voiced frames -> melody note with scoop/glide, vibrato and a little of the speech's own wobble
        prev = plan[i - 1] if i > 0 else None
        from_m = prev['midi'] if (prev and p['T'] - (prev['T'] + prev['D']) < .05) else p['midi'] - .8
        tt = (np.arange(len(F)) - n_on) * HOP
        glide = np.clip(tt / .06, 0, 1); glide = glide * glide * (3 - 2 * glide)
        m = from_m + (p['midi'] - from_m) * glide
        vib_amt = np.clip((tt - .22) / .3, 0, 1) * .28
        m = m + vib_amt * np.sin(2 * np.pi * 5.6 * tt)
        vf = F > 0
        if vf.sum() > 3:
            sem = 12 * np.log2(F[vf] / np.median(F[vf])); m[vf] += np.clip(sem * .18, -.35, .35)
        Fo = np.where(vf, 440 * 2 ** ((m - 69) / 12), 0.0)
        # tiny vowels (unvoiced through the whole nucleus) stay as spoken
        S = S + np.log(1.0)
        track.write(i0, Fo, S, A)
        if p['first']:
            words_out.append({'w': p['word'], 's': round(p['T'], 3), 'e': None, 'bar': bar, 'who': who})
        words_out[-1]['e'] = round(p['T'] + nuc_out + p['co_out'], 3)

def speak_line(bar, beat, who, text, voice, rate, pitch, out, words_out):
    x, tw = tts_wav(text, voice, rate, pitch)
    i0 = int(song.t_of(bar, beat) * SR); x = x[int(.05 * SR):]           # TTS adds ~0.1 s lead-in
    out[i0:i0 + len(x)] += x[:max(0, len(out) - i0)]
    for w in tw:
        if norm(w['w']): words_out.append({'w': w['w'], 's': round(song.t_of(bar, beat) + w['s'] - .05, 3), 'e': round(song.t_of(bar, beat) + w['e'] - .05, 3), 'bar': bar, 'who': who, 'spoken': True})

if __name__ == '__main__':
    words = []
    x0, _ = tts_wav("Bubbles.", 'en-US-AnaNeural'); f0, sp, ap = analyse(x0); D = sp.shape[1]
    lulu, friend = Track(D), Track(D)
    for bar, v, text, spec in song.SUNG:
        sing_line(text, spec, bar, 'en-US-AnaNeural', lulu, words, 'lulu' if v == 'lulu' else 'choir')
        if v == 'choir':   # a second child singing along (different voice, slightly late, a few cents off)
            sing_line(text, spec, bar, 'en-GB-MaisieNeural', friend, [], 'friend', detune=.07, time_jit=.018)
    yl, yf = lulu.render(), friend.render()
    spoken = {k: np.zeros(int(song.DUR * SR)) for k in ('lulu', 'bobble')}
    for bar, beat, who, text, voice, rate, pitch in song.SPOKEN:
        speak_line(bar, beat, who, text, voice, rate, pitch, spoken[who], words)
    words.sort(key=lambda w: w['s'])
    def pk(y): return y / (np.abs(y).max() + 1e-9)
    sung_l = pk(yl) * .9
    sf.write('build/voc_lulu.wav', sung_l + pk(spoken['lulu']) * .8, SR)
    sf.write('build/voc_friend.wav', pk(yf) * .9, SR)
    sf.write('build/voc_bobble.wav', pk(spoken['bobble']) * .8, SR)
    json.dump(words, open('build/words.json', 'w'), indent=0)
    print('words', len(words), 'dur', song.DUR)
