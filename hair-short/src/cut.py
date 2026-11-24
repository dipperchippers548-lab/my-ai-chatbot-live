"""Find the narrator's pauses and cut them out -> build/voice_cut.wav + build/cuts.json (removed intervals, original time)"""
import numpy as np, wave, json
SR = 44100; KEEP = 0.05; XF = int(.008 * SR); TAIL = 0.45
w = wave.open('build/voice44k.wav'); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
hop = int(.01 * SR); n = len(x) // hop
rms = np.array([np.abs(x[i * hop:(i + 1) * hop]).max() for i in range(n)])  # frame peak, so soft consonant tails are kept
quiet = 20 * np.log10(rms + 1e-9) < -36
sil = []; i = 0
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        if (j - i) * .01 >= .12: sil.append((i * .01, j * .01))
        i = j
    else: i += 1
dur = len(x) / SR; cuts = []
for a, b in sil:
    if a <= .011: c = (0.0, b - KEEP)
    elif b >= dur - .02: c = (a + TAIL, dur)
    else: c = (a + KEEP, b - KEEP)
    if c[1] - c[0] > .05: cuts.append([round(c[0], 3), round(c[1], 3)])
out = np.zeros(0); pos = 0.0
for a, b in cuts + [[dur, dur]]:
    seg = x[int(pos * SR):int(a * SR)].copy()
    if len(seg) > 2 * XF: seg[:XF] *= np.linspace(0, 1, XF); seg[-XF:] *= np.linspace(1, 0, XF)
    out = np.concatenate([out, seg]); pos = b
o = wave.open('build/voice_cut.wav', 'w'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((out * 32767).astype(np.int16).tobytes()); o.close()
import subprocess, os
SPEED = 1.5  # fast deadpan pace
PITCH = 1.0  # natural pitch
os.replace('build/voice_cut.wav', 'build/voice_cut_1x.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/voice_cut_1x.wav', '-af', 'asetrate=%d,aresample=44100,atempo=%.5f' % (round(44100 * PITCH), SPEED / PITCH), 'build/voice_cut.wav'], check=True)
OFF = 0.0  # no cold open
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/voice_cut.wav', '-af', 'adelay=%d' % int(OFF * 1000), 'build/voice_cut_d.wav'], check=True); os.replace('build/voice_cut_d.wav', 'build/voice_cut.wav')
w = wave.open('build/voice_cut.wav'); fast = w.getnframes() / SR; w.close()
EXTRA = 0.6  # short hold on the last word
json.dump({'cuts': cuts, 'speed': SPEED, 'offset': OFF, 'duration': round(fast + EXTRA, 3)}, open('build/cuts.json', 'w'))
print('sped up x%s -> %.2fs' % (SPEED, fast))
print('pauses cut:', len(cuts), '| removed %.2fs | %.2fs -> %.2fs' % (sum(b - a for a, b in cuts), dur, len(out) / SR))
print(cuts)
