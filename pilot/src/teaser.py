"""Shorts teaser cut from the finished cold open: starts mid-fall, tighter, big captions + a hook line, ends on COMING SOON.
-> out/loaded_in_teaser_short.mp4 (uses build/video.mp4 + build/mix.wav, no re-render)."""
from PIL import Image, ImageDraw, ImageFont
import subprocess, os
FONT = 'node_modules/@fontsource/nunito/files/nunito-latin-900-normal.woff'
W, H = 1080, 1920
SEGS = [(13.9, 24.2), (24.85, 30.1), (30.1, 33.0), (35.4, 37.9)]          # source (start, end)
def to_teaser(t):
    acc = 0
    for a, b in SEGS:
        if a <= t <= b: return acc + t - a
        acc += b - a
    raise ValueError(t)
# (text, source start, source end, position) ; position 'top' = the hook line
CAPS = [("HIS VR HEADSET\nGLITCHED...", None, None, 'top'),
        ("OWWW", 15.35, 16.6, 'low'), ("WHAT THE FREAK", 17.25, 18.35, 'low'), ("WHERE AM I", 18.75, 20.15, 'low'),
        ("AHHH!", 21.25, 22.2, 'low'), ("IS THAT A COW??", 22.25, 24.2, 'low'), ("moo.", 25.1, 26.0, 'low'),
        ("IS THAT MY HANDS", 28.25, 30.1, 'low'), ("my hands...", 30.15, 31.2, 'low'), ("hands...", 31.25, 32.3, 'low'), ("hands...", 32.35, 33.0, 'low'),
        ("COMING SOON", 35.9, 37.9, 'low')]
os.makedirs('teaser', exist_ok=True); inputs, chain, last = [], [], '[v]'
for k, (txt, a, b, pos) in enumerate(CAPS):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img); size = 92 if pos == 'top' else (110 if len(txt) < 12 else 96)
    f = ImageFont.truetype(FONT, size); y0 = int(H * (.13 if pos == 'top' else .68))
    lines = txt.split('\n'); lh = size * 1.12
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=f); x = (W - tw) / 2; y = y0 + i * lh
        fill = (255, 226, 31, 255) if (pos == 'top' or 'SOON' in ln) else (255, 255, 255, 255)
        d.text((x, y), ln, font=f, fill=fill, stroke_width=10, stroke_fill=(0, 0, 0, 255))
    p = f'teaser/cap{k}.png'; img.save(p); inputs += ['-i', p]
    s, e = (0.0, 2.6) if a is None else (to_teaser(a), to_teaser(b))
    chain.append(f"{last}[{k + 2}:v]overlay=0:0:enable='between(t,{s:.2f},{e:.2f})'[o{k}]"); last = f'[o{k}]'
vparts = ''.join(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];" for i, (a, b) in enumerate(SEGS))
aparts = ''.join(f"[1:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.03:.3f}:d=0.03[a{i}];" for i, (a, b) in enumerate(SEGS))
n = len(SEGS); total = sum(b - a for a, b in SEGS)
fc = vparts + aparts + ''.join(f'[v{i}][a{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=1[v][acat];' + ';'.join(chain) + f";{last}fade=t=out:st={total - .4:.2f}:d=0.4[vout];[acat]afade=t=out:st={total - .4:.2f}:d=0.4[aout]"
cmd = ['ffmpeg', '-v', 'error', '-y', '-i', 'build/video.mp4', '-i', 'build/mix.wav'] + inputs + ['-filter_complex', fc, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', 'out/loaded_in_teaser_short.mp4']
subprocess.run(cmd, check=True); print('teaser', round(total, 2), 's')
