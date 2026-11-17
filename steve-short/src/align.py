"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("When Mark moved to a tiny new town, his neighbor came over to say hi. Hi, I'm Steve. Then the mailman showed up. His name was also Steve. The barber? Steve. The mayor? Steve. "
 "Even the mayor's dog, was named Steve. Every single person in the town was named Steve. Nobody knew how it started. Some people said it was a tradition. Others said the first guy who moved there just really liked the name. "
 "Mark thought it was a prank. Until he went to the grocery store, yelled Steve! and forty people turned around. Phone calls were a nightmare. Birthday parties were chaos. Every cake just said, Happy Birthday, Steve. "
 "Mark tried to stay himself. He lasted six months. Then one day, a new family moved in next door. Mark walked over, smiled, and said, Hi. I'm Steve.")
SPOKEN = {"mayor's": "mayors"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("mayors", "M EY ER Z"),):
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
