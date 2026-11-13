#!/bin/bash
# Mux the rendered picture with the mix: a clean version and one with the sing-along lyrics burned in.
set -e
cd "$(dirname "$0")/.."
mkdir -p out
ffmpeg -v error -y -i build/frames_00000.mp4 -i build/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/the-bubble-song-no-lyrics.mp4
[ -d build/lyrics ] || node src/render.cjs lyrics
ffmpeg -v error -y -i build/frames_00000.mp4 -framerate 30 -i build/lyrics/%05d.png -i build/mix.wav \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 2:a:0 \
  -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/the-bubble-song.mp4
ls -la out
