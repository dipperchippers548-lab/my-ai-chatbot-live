"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You can't hold your pee forever, and it's not your fault. You see, your bladder is a stretchy bag. "
 "At around two hundred milliliters, about a cup, stretch sensors in the wall text your brain. That's the first urge. "
 "And you can ignore it, because you control one muscle at the exit. But there's a second muscle you don't control. "
 "At around five hundred milliliters, your bladder starts squeezing by itself and forces that one open. "
 "So now one muscle is holding back everything. Which never lasts. Luckily, it almost never bursts. Sorry. And that's why,")
SPOKEN = {}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("milliliters", "M IH L AH L IY T ER Z"), ("stretchy", "S T R EH CH IY")):
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
