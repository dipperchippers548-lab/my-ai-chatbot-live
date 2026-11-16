"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("He eats one tiny chip. And within seconds, his mouth is on fire. But nothing is actually burning. The chip is coated in Carolina Reaper and Naga Viper peppers, packed with a chemical called capsaicin. "
 "Capsaicin grabs onto the heat sensors in his tongue, and tricks his brain into thinking his mouth is burning. So his body panics. He starts sweating, to cool down. His eyes water. His nose runs. "
 "He grabs water, but water just spreads it around. Milk works better, because a protein in it pulls the capsaicin away. Then it hits his stomach. Cramps. Nausea. His heart starts racing. "
 "For most people, it passes. But in 2023, a 14 year old died after doing the challenge, and the chip was pulled from shelves for good.")
SPOKEN = {"2023,": "twenty twenty three", "14": "fourteen"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("capsaicin", "K AE P S EY S IH N"), ("naga", "N AA G AH"), ("reaper", "R IY P ER")):
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
