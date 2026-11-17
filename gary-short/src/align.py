"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Every morning, the whole street woke up to the same thing. Every single lawn, was perfectly mowed. Nobody knew who was doing it. Some people thought it was a prank. Some thought it was the city. "
 "Mrs. Patel thought it was ghosts. So one night, Dave set up a camera. At exactly 3 AM, someone walked out. It was Gary. The quiet guy next door. Pushing a lawn mower, in his pajamas. With his eyes closed. "
 "Gary was sleepwalking. For two years, he'd been mowing the entire street, in his sleep. He even trimmed the hedges. One night, he mowed a giant smiley face into the park. Another night, he mowed straight into Dave's pool. "
 "And he still didn't wake up. Every morning, Gary woke up wondering, why his slippers were covered in grass. When Dave showed him the video, Gary just stared at it. Then he said, That explains a lot. "
 "Now the whole street pays him twenty bucks a month. And Gary still doesn't remember doing it.")
SPOKEN = {"3": "three", "AM,": "a m", "Mrs.": "missus", "Dave's": "daves"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("patel", "P AH T EH L"), ("daves", "D EY V Z")):
    if d.lookup_word(wd) is None: d.add_word(wd, ph, True)
print("missing from dictionary:", [p for p in set(spoken) if d.lookup_word(p) is None])
d.set_align_text(" ".join(spoken)); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
segs = [(re.sub(r"\(\d+\)", "", s.word), s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ("<sil>", "(NULL)", "<s>", "</s>") and not s.word.startswith("+")]
assert [s[0] for s in segs] == spoken
out = []
for i, word in enumerate(shown):
    idx = [k for k, o in enumerate(owner) if o == i]; out.append({"w": word, "s": round(segs[idx[0]][1], 2), "e": round(segs[idx[-1]][2], 2)})
json.dump(out, open("build/words.json", "w"), indent=0)
print(" ".join(f'{o["s"]:.2f}:{o["w"]}' for o in out))
