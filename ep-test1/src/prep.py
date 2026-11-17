"""Clean the voice clip (repair clipping, close-mic tone) -> build/voice.wav, and a 100 Hz mouth-opening track
for lip sync -> build/mouth.json (level 0 closed .. 3 wide open)."""
import numpy as np, wave, json, subprocess
SR = 44100
CHAIN = ",".join([
    "adeclip=w=60:o=75:a=10:t=8:n=1000",          # rebuild the clipped peaks of the yell
    "highpass=f=80", "anlmdn=s=4:p=0.002:r=0.006", "afftdn=nr=20:nf=-48:tn=1",   # two noise-reduction passes
    "lowpass=f=10500",                             # the fizz from the clipping lives up here
    "equalizer=f=140:t=q:w=1:g=3", "equalizer=f=420:t=q:w=1.2:g=-3", "equalizer=f=2800:t=q:w=1.2:g=-1.5", "equalizer=f=6000:t=q:w=1.5:g=-3",
    "deesser=i=0.5", "acompressor=threshold=-22dB:ratio=4:attack=3:release=80:makeup=3", "alimiter=limit=0.89", "loudnorm=I=-15:TP=-1.5"])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/line_raw.mp3', '-ac', '1', '-af', CHAIN, '-ar', str(SR), 'build/voice.wav'], check=True)
w = wave.open('build/l44.wav'); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
hop = SR // 100; env = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(len(x) // hop)])
db = 20 * np.log10(env + 1e-9); sm = np.zeros_like(db); a = -90
for i, v in enumerate(db): a = v if v > a else a + (v - a) * .35; sm[i] = a   # fast attack, quick release
lvl = np.select([sm < -38, sm < -26, sm < -16], [0, 1, 2], 3).tolist()
json.dump({'rate': 100, 'level': lvl, 'dur': len(x) / SR}, open('build/mouth.json', 'w'))
print('mouth frames', len(lvl), 'levels used', sorted(set(lvl)))
