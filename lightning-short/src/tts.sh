#!/bin/sh
# narration with the free Microsoft neural voice service (edge-tts) -> audio/voiceover_raw.mp3
edge-tts --proxy "$HTTPS_PROXY" --voice en-US-AndrewNeural --rate=+8% --text "$(cat src/script.txt)" --write-media audio/voiceover_raw.mp3
