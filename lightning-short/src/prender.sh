#!/bin/sh
# render the video in N parallel chunks, then join them -> build/video.mp4
N=${1:-3}; rm -f build/part_*.mp4 build/parts.txt
for k in $(seq 0 $((N-1))); do node src/render.cjs part $k $N > build/render_$k.log 2>&1 & done; wait
for k in $(seq 0 $((N-1))); do echo "file 'part_$k.mp4'" >> build/parts.txt; done
ffmpeg -v error -y -f concat -safe 0 -i build/parts.txt -c copy build/video.mp4 && echo "joined $N parts"
