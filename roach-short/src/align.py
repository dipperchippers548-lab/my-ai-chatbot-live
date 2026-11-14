"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("This man woke up at 3 a.m. to a scratching sound. And it was coming from inside his head. He sat up, and it got louder. Something was crawling in his ear. "
 "A cockroach had crawled in while he was asleep, looking for somewhere dark and warm. Panicking, he grabbed a cotton swab. Big mistake. That just pushed it deeper, right up against his eardrum. "
 "Every time it moved, it sounded like thunder. So he tried to rinse it out with water. But that only made it panic. Then he remembered one trick. "
 "He tilted his head and poured in a few drops of baby oil. The cockroach stopped moving. And at the hospital, a doctor pulled it out in one piece. And it all started when")
SPOKEN = {"3": "three", "a.m.": "a m"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("eardrum", "IH R D R AH M"),):
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
