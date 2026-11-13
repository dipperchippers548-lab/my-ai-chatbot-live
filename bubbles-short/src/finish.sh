#!/bin/bash
# Assemble the picture from rendered segments (by frame number), then mux with the mix:
# a clean version and one with the sing-along lyrics burned in.   ASPECT=16x9 bash src/finish.sh for landscape.
set -e
cd "$(dirname "$0")/.."
ASPECT=${ASPECT:-9x16}; S=""; NAME="the-bubble-song"
[ "$ASPECT" = "16x9" ] && S="16" && NAME="the-bubble-song-16x9"
SEQ=build/seq$S; LYR=build/lyrics$S; BASE=build/base$S.mp4
mkdir -p out $SEQ
N=$(python3 -c "import json, math; t=json.load(open('build/timeline.json')); print(math.ceil(t['dur']*t['fps']))")
# decode every readable segment into frame-numbered images (later segments override earlier frames)
for f in $(ls build/frames${S}_*.mp4 | sort); do
  s=$((10#$(basename "$f" .mp4 | sed "s/frames${S}_//")))
  ffprobe -v error "$f" >/dev/null 2>&1 || { echo "skipping unreadable $f"; continue; }
  ffmpeg -v error -i "$f" -start_number "$s" -q:v 1 "$SEQ/%05d.jpg"
done
# fill any gap with the previous frame (keeps picture and sound in sync)
python3 - "$N" "$SEQ" <<'PY'
import os, shutil, sys
n, d = int(sys.argv[1]), sys.argv[2]; prev = None; filled = []
for i in range(n):
    p = f'{d}/{i:05d}.jpg'
    if os.path.exists(p): prev = p; continue
    src = prev or next(f'{d}/{j:05d}.jpg' for j in range(i + 1, n) if os.path.exists(f'{d}/{j:05d}.jpg'))
    shutil.copy(src, p); filled.append(i)
print('filled frames:', filled)
PY
ffmpeg -v error -y -framerate 30 -i $SEQ/%05d.jpg -frames:v "$N" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p $BASE
ffmpeg -v error -y -i $BASE -i build/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/$NAME-no-lyrics.mp4
[ -d $LYR ] || ASPECT=$ASPECT node src/render.cjs lyrics
ffmpeg -v error -y -i $BASE -framerate 30 -i $LYR/%05d.png -i build/mix.wav \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 2:a:0 \
  -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/$NAME.mp4
ls -la out
