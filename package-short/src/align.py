"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("He heard a knock on the door. He walked over and opened it, but nobody was there. Just a small box on the doormat, with his name on it. No stamp. No return address. "
 "He brought it inside and shook it. Something was ticking. He slowly opened the box, and inside was an old phone. Then it started ringing. "
 "He picked it up, and a voice whispered, look out your window. He looked outside, and saw a man across the street, holding the exact same box. "
 "The man smiled, and pointed at him. Then he heard another knock. But this time, it came from inside his closet.")
SPOKEN = {}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
print("missing from dictionary:", [p for p in set(spoken) if d.lookup_word(p) is None])
d.set_align_text(" ".join(spoken)); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
segs = [(re.sub(r"\(\d+\)", "", s.word), s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ("<sil>", "(NULL)", "<s>", "</s>") and not s.word.startswith("+")]
assert [s[0] for s in segs] == spoken
out = []
for i, word in enumerate(shown):
    idx = [k for k, o in enumerate(owner) if o == i]; out.append({"w": word, "s": round(segs[idx[0]][1], 2), "e": round(segs[idx[-1]][2], 2)})
for i, o in enumerate(out):  # the aligner puts "He" (picked it up) inside the pause before it
    if o["w"] == "He" and out[i + 1]["w"] == "picked": o["s"], o["e"] = out[i + 1]["s"], out[i + 1]["s"] + .12; out[i + 1]["s"] += .12
json.dump(out, open("build/words.json", "w"), indent=0)
print(" ".join(f'{o["s"]:.2f}:{o["w"]}' for o in out))
