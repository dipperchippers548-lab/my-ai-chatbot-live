"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Pirates didn't wear gold earrings to look cool. Back then, if a sailor died at sea, he was sewn into a sheet and dropped overboard. "
        "No grave. No funeral. So some started wearing a gold earring. Not as jewelry. As payment. "
        "If his body ever washed up on a beach, whoever found it could take the gold, and use it to pay for a proper burial. "
        "Historians aren't sure how common this really was. But archaeologists have found plenty of sailors' jewelry made to be spent. "
        "Because for a pirate, that tiny ring was a funeral, already paid for.")
SPOKEN = {}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("overboard", "OW V ER B AO R D"),):
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
