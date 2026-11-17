"""Scene 3 voice: repair + clean, trim long pauses, TV-speaker filter on Tee's lines -> build/voice.wav,
build/cuts.json (removed intervals, original clock) and build/mouth.json (10 ms: level 0-3, shape, speaker)."""
import numpy as np, wave, json, subprocess
SR = 44100
CLEAN = ",".join(["adeclip=w=60:o=75:a=10:t=6:n=1000", "adeclip=w=40:o=75:a=8:t=6:n=1000", "highpass=f=80", "anlmdn=s=4:p=0.002:r=0.006", "afftdn=nr=18:nf=-46:tn=1",
                  "lowpass=f=10000", "equalizer=f=140:t=q:w=1:g=3", "equalizer=f=420:t=q:w=1.2:g=-3", "equalizer=f=2900:t=q:w=1.2:g=-2.5", "equalizer=f=5500:t=q:w=1.5:g=-3.5",
                  "deesser=i=0.5", "acompressor=threshold=-20dB:ratio=3:attack=4:release=90:makeup=2", "alimiter=limit=0.89"])
TV = "highpass=f=260,lowpass=f=5200,equalizer=f=1700:t=q:w=1:g=4,acrusher=bits=9:mix=.18:mode=log,aecho=0.8:0.5:14:0.18"
def ff(src, dst, af): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', str(SR), '-af', af, dst], check=True)
def rd(p): w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close(); return x
ff('audio/raw.mp3', 'build/clean.wav', CLEAN); ff('build/clean.wav', 'build/tv.wav', TV)
x, tv = rd('build/clean.wav'), rd('build/tv.wav'); n = min(len(x), len(tv)); x, tv = x[:n], tv[:n]
# who speaks when (original clock)
TEE = [(4.0, 10.1), (17.4, 23.3), (28.3, 38.6), (42.7, 87.6), (94.0, 96.8), (101.9, 107.2)]
m = np.zeros(n)
for a, b in TEE: m[int(a * SR):int(b * SR)] = 1
k = int(.03 * SR); m = np.convolve(m, np.ones(k) / k, 'same')
tvn = tv * (np.sqrt(np.mean(x[m > .5] ** 2)) / (np.sqrt(np.mean(tv[m > .5] ** 2)) + 1e-9))
v = x * (1 - m) + tvn * m
# trim: lead-in, long pauses (keep a beat), the lights-down gap before the song
segs = [(4.2, 6.9), (7.6, 9.9), (10.6, 13.2), (14.4, 16.1), (17.6, 18.6), (19.6, 23.1), (23.6, 27.3), (28.5, 32.9), (34.1, 38.4), (42.9, 87.4), (90.7, 92.8), (94.2, 96.6), (97.8, 100.5), (102.1, 106.9)]
cuts = [[0.0, 2.6]]
for (a0, b0), (a1, b1) in zip(segs, segs[1:]):
    gap = a1 - b0; keep = 1.7 if b0 == 38.4 else 1.0 if b0 == 87.4 else .45
    if gap > keep + .05: cuts.append([round(b0 + keep / 2, 3), round(a1 - keep / 2, 3)])
end = 107.6; cuts.append([end, n / SR])
keepm = np.ones(n, bool)
for a, b in cuts: keepm[int(a * SR):int(b * SR)] = False
# 8 ms fades at every splice
o = v[keepm]; 
v = o / (np.abs(o).max() + 1e-9) * .9
w = wave.open('build/voice_pre.wav', 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype(np.int16).tobytes()); w.close()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/voice_pre.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', str(SR), 'build/voice.wav'], check=True)
json.dump({'cuts': cuts[:-1], 'speed': 1.0, 'duration': round(len(v) / SR + .3, 3)}, open('build/cuts.json', 'w'))
# mouth track on the final clock
ms = m[keepm]; hop = SR // 100; N = len(v) // hop; win = np.hanning(hop * 4); a = -90; lv, sh, sp = [], [], []
for i in range(N):
    seg = v[i * hop:(i + 1) * hop]; db = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9); a = db if db > a else a + (db - a) * .35
    s0 = max(0, i * hop - hop * 2); y = v[s0:s0 + hop * 4]; y = y * win[:len(y)]; X = np.abs(np.fft.rfft(y)); f = np.fft.rfftfreq(len(y), 1 / SR); cen = (f * X).sum() / (X.sum() + 1e-9)
    l = 0 if a < -36 else 1 if a < -24 else 2 if a < -13 else 3
    lv.append(l); sh.append('c' if l == 0 else ('grin' if cen > 3600 else 'o' if cen < 1800 else ('scream' if l == 3 else 'open' if l == 2 else 'o'))); sp.append('T' if ms[i * hop] > .5 else 'L')
json.dump({'rate': 100, 'level': lv, 'shape': sh, 'spk': ''.join(sp)}, open('build/mouth.json', 'w'))
print('cuts', cuts[:-1]); print('final %.2fs' % (len(v) / SR))
