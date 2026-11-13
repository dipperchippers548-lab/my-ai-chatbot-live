#!/bin/bash
# Assemble the picture from rendered segments (by frame number), then mux with the mix:
# a clean version and one with the sing-along lyrics burned in.
#   build/seq/%05d.jpg  - frames named by frame number (recovered segments decoded with -frame_pts)
set -e
cd "$(dirname "$0")/.."
mkdir -p out build/seq
N=$(python3 -c "import json; t=json.load(open('build/timeline.json')); import math; print(math.ceil(t['dur']*t['fps']))")
# any later segment overrides earlier frames (frames_<start>.mp4 starts at frame <start>)
for f in $(ls build/frames_*.mp4 | sort); do
  s=$((10#$(basename "$f" .mp4 | sed 's/frames_//')))
  [ "$s" -eq 0 ] && continue
  ffmpeg -v error -i "$f" -start_number "$s" -q:v 1 "build/seq/%05d.jpg"
done
# fill any gap with the previous frame (keeps picture and sound in sync)
python3 - "$N" <<'EOF'
import os, shutil, sys
n = int(sys.argv[1]); prev = None; filled = []
for i in range(n):
    p = f'build/seq/{i:05d}.jpg'
    if os.path.exists(p): prev = p; continue
    src = prev or next(f'build/seq/{j:05d}.jpg' for j in range(i + 1, n) if os.path.exists(f'build/seq/{j:05d}.jpg'))
    shutil.copy(src, p); filled.append(i)
print('filled frames:', filled)
EOF
ffmpeg -v error -y -framerate 30 -i build/seq/%05d.jpg -frames:v "$N" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p build/base.mp4
ffmpeg -v error -y -i build/base.mp4 -i build/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/the-bubble-song-no-lyrics.mp4
[ -d build/lyrics ] || node src/render.cjs lyrics
ffmpeg -v error -y -i build/base.mp4 -framerate 30 -i build/lyrics/%05d.png -i build/mix.wav \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 2:a:0 \
  -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/the-bubble-song.mp4
ls -la out
