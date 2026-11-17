"""Repair + clean the voice (it clips hard) -> build/voice.wav, and a 100 Hz mouth track for lip sync -> build/mouth.json.
Mouth per frame: 'c' closed, or a shape picked from the sound: 'o' (rounded, dark vowels), 'open', 'grin' (bright 'ee'/'s'),
'scream' (loud). Some lines force a shape: OWWW and COWWW are round, AHHH is a scream."""
import numpy as np, wave, json, subprocess
SR = 44100
CHAIN = ",".join(["adeclip=w=60:o=75:a=10:t=6:n=1000", "adeclip=w=40:o=75:a=8:t=6:n=1000", "highpass=f=80", "anlmdn=s=4:p=0.002:r=0.006", "afftdn=nr=18:nf=-46:tn=1",
                  "lowpass=f=10000", "equalizer=f=140:t=q:w=1:g=3", "equalizer=f=420:t=q:w=1.2:g=-3", "equalizer=f=2900:t=q:w=1.2:g=-2.5", "equalizer=f=5500:t=q:w=1.5:g=-3.5",
                  "deesser=i=0.5", "acompressor=threshold=-20dB:ratio=3:attack=4:release=90:makeup=2", "alimiter=limit=0.89", "loudnorm=I=-15:TP=-1.5"])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/raw.mp3', '-ac', '1', '-af', CHAIN, '-ar', str(SR), 'build/voice.wav'], check=True)
w = wave.open('build/r44.wav'); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
hop = SR // 100; n = len(x) // hop; win = np.hanning(hop * 4)
lv, sh = [], []; a = -90
for i in range(n):
    seg = x[i * hop:(i + 1) * hop]; db = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9); a = db if db > a else a + (db - a) * .35
    s0 = max(0, i * hop - hop * 2); y = x[s0:s0 + hop * 4]; y = y * win[:len(y)]; X = np.abs(np.fft.rfft(y)); f = np.fft.rfftfreq(len(y), 1 / SR); cen = (f * X).sum() / (X.sum() + 1e-9)
    l = 0 if a < -38 else 1 if a < -24 else 2 if a < -12 else 3
    shape = 'c' if l == 0 else ('grin' if cen > 3600 else 'o' if cen < 1800 else ('scream' if l == 3 else 'open' if l == 2 else 'o'))
    t = i / 100
    if l and (3.7 <= t <= 5.1 or 9.4 <= t <= 10.2): shape = 'o'          # OWWW, COWWW
    if l and (13.4 <= t <= 14.55 or 14.7 <= t <= 16.1): shape = 'scream'                              # AHHH
    sh.append(shape)
json.dump({'rate': 100, 'shape': sh, 'dur': len(x) / SR}, open('build/mouth.json', 'w'))
from collections import Counter; print('mouth frames', n, Counter(sh))
