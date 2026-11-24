set -e
cd /home/user/my-ai-chatbot-live/diamond-short
N=$(node -e "const c=require('./build/cuts.json');console.log(Math.round(c.duration*30))")
for A in $(seq 0 450 $((N-1))); do B=$((A+450)); node src/render.cjs full $A $B > build/render.log 2>&1; echo "seg $A done" >> build/progress.txt; done
ls build/seg_*.mp4 | sort | sed "s/^/file '..\//; s/$/'/" | sed "s#'../build/#'#" > build/segs.txt
ffmpeg -v error -y -f concat -safe 0 -i build/segs.txt -c copy build/video.mp4
ffmpeg -v error -y -i build/video.mp4 -i build/mix.wav -map 0:v -map 1:a -c:v libx264 -profile:v main -level 4.0 -b:v 5M -maxrate 6M -bufsize 10M -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/how_two_miners_fooled_tiffanys.mp4
ffmpeg -v error -y -i out/how_two_miners_fooled_tiffanys.mp4 -vf scale=720:1280 -c:v libx264 -b:v 1.4M -c:a aac -b:a 128k -movflags +faststart out/how_two_miners_fooled_tiffanys_small.mp4
echo ALLDONE >> build/progress.txt
