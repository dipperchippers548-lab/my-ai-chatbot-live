#!/bin/bash
# Render the whole short in two halves (each well under the 2-hour job limit), sequentially.
# usage: ASPECT=16x9 bash src/render_all.sh   -> build/frames16_00000.mp4 + build/frames16_00800.mp4
cd "$(dirname "$0")/.."
S=""; [ "$ASPECT" = "16x9" ] && S="16"
for r in "0 800" "800 1600"; do set -- $r; node src/render.cjs full $1 $2 > build/render${S}_$1.log 2>&1; done
echo ALL_DONE > build/render${S}_done.flag
