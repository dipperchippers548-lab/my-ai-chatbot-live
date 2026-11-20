"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You broke your mom's favorite fucking vase. She's home in ten minutes. "
 "So you glue it back together. It falls the fuck apart. "
 "So you get superglue. Now the vase is fixed... and so is your fucking hand. "
 "So you try to shake it off... and the vase swings right into the fucking TV. "
 "Now two things are fucked. "
 "So you order a new vase online. Arriving in three to five business days. Fuck. "
 "So you decide to make one. Out of mud. From the fucking backyard. "
 "Not enough mud. So you grab a shovel... and dig. And dig. And fucking dig. "
 "Then you hear the car pull in. "
 "Your mom looks down the hole. You're covered in mud, with a vase glued to your fucking hand. "
 "She says, You're grounded. Well... you're already in the fucking ground. Fucking genius.")
SPOKEN = {"mom's": "moms", "She's": "shes", "TV.": "t v", "You're": "youre", "you're": "youre"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("moms", "M AA M Z"), ("shes", "SH IY Z"), ("youre", "Y UH R"), ("superglue", "S UW P ER G L UW")):
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
