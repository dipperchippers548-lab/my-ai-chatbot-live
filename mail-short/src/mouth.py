"""Lip-sync track: loudness of the edited voice every 10 ms, as 0 (closed) .. 3 (wide) -> build/mouth.json"""
import numpy as np, wave, json
w = wave.open('build/voice_cut.wav'); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
hop = sr // 100; n = len(x) // hop
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) + 1e-9) for i in range(n)]); db -= db.max()
lv = np.digitize(db, [-38, -24, -14]); lv = np.array([max(lv[max(0, i - 1):i + 2].min(), 0) if lv[i] else 0 for i in range(n)])  # drop 10 ms flickers
json.dump({'rate': 100, 'level': lv.tolist()}, open('build/mouth.json', 'w')); print('mouth frames', n, np.bincount(lv))
