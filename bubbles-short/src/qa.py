"""QA a finished video: black/white frames, frozen spans, single-frame pops, loudness. Usage: python3 src/qa.py video.mp4"""
import sys, subprocess, numpy as np
src = sys.argv[1]; w, h = 135, 240
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32) / 255
n = len(fr); mean = fr.mean((1, 2)); diff = np.r_[0, np.abs(np.diff(fr, axis=0)).mean((1, 2))]
print(f'frames {n} ({n / 30:.2f}s)  luma min {mean.min():.3f} max {mean.max():.3f} median {np.median(mean):.3f}')
bad = [i for i in range(n) if mean[i] < .04 or mean[i] > .97]; print('black/white frames:', bad[:20])
frozen, run = [], 0
for i in range(1, n):
    run = run + 1 if diff[i] < .0012 else 0
    if run == 12: frozen.append(i - 11)
print('frozen spans (>=12 f) starting at:', frozen)
pops = [i for i in range(1, n - 1) if diff[i] > .06 and diff[i + 1] > .06 and abs(mean[i] - mean[i - 1]) > .03 and abs(mean[i + 1] - mean[i - 1]) < .01]
print('single-frame pops:', pops)
cuts = [i for i in range(1, n) if diff[i] > .08]; print('hard cuts at frames:', cuts)
o = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print('loudness:', ' | '.join(l.strip() for l in o.split('Summary:')[-1].splitlines() if l.strip().startswith(('I:', 'Peak:', 'LRA:'))))
