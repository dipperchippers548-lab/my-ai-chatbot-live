"""Close-mic "radio" treatment of the raw recording, then the same pause cuts + speed-up as cut.py
-> build/voice_close.wav (same timing as build/voice_cut.wav, so the picture does not change).
Chain: rumble cut, noise reduction, gate (drops the room between words), proximity warmth, less mud,
presence + air, de-esser, heavy compression, limiter, loudness normalise."""
import numpy as np, wave, json, subprocess
SR = 44100; XF = int(.008 * SR)
CHAIN = ",".join([
    "highpass=f=75", "afftdn=nr=16:nf=-42:tn=1",
    "agate=threshold=0.025:ratio=4:range=0.08:attack=2:release=140",
    "equalizer=f=140:t=q:w=1.0:g=4.5", "equalizer=f=420:t=q:w=1.2:g=-3.5", "equalizer=f=900:t=q:w=1.5:g=-1.5",
    "equalizer=f=3500:t=q:w=1.4:g=3", "highshelf=f=9000:g=2.5", "deesser=i=0.5:m=0.5:f=0.5",
    "acompressor=threshold=-26dB:ratio=5:attack=3:release=70:makeup=5", "alimiter=limit=0.89",
    "loudnorm=I=-15:TP=-1.2:LRA=5"])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/voiceover_raw.mp3', '-ac', '1', '-af', CHAIN, '-ar', str(SR), 'build/voice_close_full.wav'], check=True)
C = json.load(open('build/cuts.json'))
w = wave.open('build/voice_close_full.wav'); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
dur = len(x) / SR; out = np.zeros(0); pos = 0.0
for a, b in C['cuts'] + [[dur, dur]]:
    seg = x[int(pos * SR):int(a * SR)].copy()
    if len(seg) > 2 * XF: seg[:XF] *= np.linspace(0, 1, XF); seg[-XF:] *= np.linspace(1, 0, XF)
    out = np.concatenate([out, seg]); pos = b
o = wave.open('build/voice_close_1x.wav', 'w'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()); o.close()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/voice_close_1x.wav', '-af', 'atempo=%s' % C['speed'], 'build/voice_close.wav'], check=True)
print('done', round(len(out) / SR / C['speed'], 2), 's')
