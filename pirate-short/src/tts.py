"""Make the narration locally with the Kokoro text-to-speech model (open-source) -> audio/voiceover.wav"""
import sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
D = sys.argv[1]
TEXT = ("Pirates didn't wear gold earrings to look cool. Back then, if a sailor died at sea, he was sewn into a sheet and dropped overboard. "
        "No grave. No funeral. So some started wearing a gold earring. Not as jewelry. As payment. "
        "If his body ever washed up on a beach, whoever found it could take the gold, and use it to pay for a proper burial. "
        "Historians aren't sure how common this really was. But archaeologists have found plenty of sailors' jewelry made to be spent. "
        "Because for a pirate, that tiny ring was a funeral, already paid for.")
k = Kokoro(f"{D}/kokoro.onnx", f"{D}/voices-v1.0.bin")
voice = sys.argv[2] if len(sys.argv) > 2 else "am_michael"
samples, sr = k.create(TEXT, voice=voice, speed=1.08, lang="en-us")
sf.write("audio/voiceover_raw.wav", samples, sr); print(voice, sr, round(len(samples) / sr, 2), "s")
