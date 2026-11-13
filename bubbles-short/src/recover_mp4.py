"""Recover frames from an MP4 whose writer was killed before the index (moov) was written.
usage: python3 src/recover_mp4.py broken.mp4 WIDTH HEIGHT START_FRAME OUT_SEQ_DIR
Re-creates the H.264 SPS/PPS with a tiny reference encode using the same x264 settings, rewrites the
length-prefixed NALs from mdat as an Annex-B stream, decodes it, and writes frames named by frame number."""
import os, re, struct, subprocess, sys, tempfile, shutil
src, W, H, start, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
tmp = tempfile.mkdtemp(); os.makedirs(out, exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'testsrc2=s={W}x{H}:r=30', '-frames:v', '5', '-c:v', 'mjpeg', '-f', 'image2pipe', f'{tmp}/ref.mjpg'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', f'{tmp}/ref.mjpg', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', f'{tmp}/ref.mp4'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{tmp}/ref.mp4', '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', f'{tmp}/ref.h264'], check=True)
ref = open(f'{tmp}/ref.h264', 'rb').read(); idx = [m.start() for m in re.finditer(b'\x00\x00\x01', ref)]
nals = [ref[s + 3:(idx[k + 1] if k + 1 < len(idx) else len(ref))].rstrip(b'\x00') for k, s in enumerate(idx)]
hdr = [n for n in nals if n and (n[0] & 31) in (7, 8)][:2]
data = open(src, 'rb').read(); pos = 0; m0 = None
while pos + 8 <= len(data):
    size, typ = struct.unpack('>I4s', data[pos:pos + 8]); hl = 8
    if size == 1: size = struct.unpack('>Q', data[pos + 8:pos + 16])[0]; hl = 16
    if typ == b'mdat': m0 = pos + hl; break
    if size == 0: break
    pos += size
o = bytearray(); [o.extend(b'\x00\x00\x00\x01' + h) for h in hdr]; p = m0; n = 0
while p + 4 <= len(data):
    L = struct.unpack('>I', data[p:p + 4])[0]
    if L == 0 or p + 4 + L > len(data): break
    o.extend(b'\x00\x00\x00\x01' + data[p + 4:p + 4 + L]); p += 4 + L; n += 1
open(f'{tmp}/rec.h264', 'wb').write(o)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', f'{tmp}/rec.h264', '-c', 'copy', f'{tmp}/rec.mp4'], check=True)
os.makedirs(f'{tmp}/seq'); subprocess.run(['ffmpeg', '-v', 'quiet', '-i', f'{tmp}/rec.mp4', '-vsync', 'passthrough', '-frame_pts', '1', '-q:v', '1', f'{tmp}/seq/%05d.jpg'])
got = sorted(int(f[:5]) for f in os.listdir(f'{tmp}/seq'))
for i in got: shutil.move(f'{tmp}/seq/{i:05d}.jpg', f'{out}/{start + i:05d}.jpg')
missing = [start + i for i in range(got[-1]) if i not in set(got)]
print(f'NALs {n}; recovered frames {start + got[0]}..{start + got[-1]} ({len(got)}); missing inside: {missing}')
shutil.rmtree(tmp)
