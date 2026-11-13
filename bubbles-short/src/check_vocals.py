import sys, os, numpy as np, soundfile as sf, pyworld as pw
sys.path.insert(0, 'src'); import song
x, sr = sf.read('build/voc_lulu.wav'); f0, t = pw.harvest(x, sr, f0_floor=110, f0_ceil=900, frame_period=5)
errs = []; rep = []
for bar, v, text, spec in song.SUNG:
    for w in song.parse_notes(spec):
        for s, m, b, d in w['syl']:
            T = song.t_of(bar, b); i0, i1 = int((T + .07) / .005), int((T + d * song.BEAT * .8) / .005)
            seg = f0[i0:i1]; seg = seg[seg > 0]
            if len(seg) < 3: rep.append(f'{bar}:{s}?unvoiced'); continue
            got = 69 + 12 * np.log2(np.median(seg) / 440); errs.append(got - m)
            if abs(got - m) > .5: rep.append(f'{bar}:{s} want {m} got {got:.1f}')
errs = np.array(errs); print('syllables', len(errs), 'median |err| %.2f st, p90 %.2f st' % (np.median(abs(errs)), np.percentile(abs(errs), 90)))
print('off/odd:', rep[:30])
# clicks: sample-to-sample jumps far above the local signal level
d = np.abs(np.diff(x)); env = np.convolve(np.abs(x), np.ones(480) / 480, 'same') + 1e-4
print('click candidates:', int((d > 12 * env[1:]).sum()), ' peak', np.abs(x).max().round(3))
for f in ['voc_lulu', 'voc_friend', 'voc_bobble']:
    y, _ = sf.read(f'build/{f}.wav'); print(f, 'len %.2f' % (len(y) / sr), 'rms %.3f' % np.sqrt((y ** 2).mean()))
