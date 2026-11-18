"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("A cat named Biscuit came home every single night... a little fatter. At first, nobody noticed, because who weighs their cat? "
 "By the end of the month, Biscuit couldn't fit through the cat door. So the family put him on a diet. Half a scoop. No treats. Biscuit got fatter. "
 "They took him to the vet. The vet looked at Biscuit, then at the dad, and said, Sir... are you feeding him cheeseburgers? "
 "They hid every crumb of food in the house, but Biscuit kept growing, until he was basically a beanbag with legs. "
 "So the dad clipped a tiny camera onto Biscuit's collar. That night, Biscuit squeezed under the fence, waddled two houses down, and scratched on a door. "
 "A lady opened it and said, There you are, Mr. Whiskers! and set down a giant bowl of salmon. "
 "Turns out, for six years, Biscuit had two families, two names, and two dinners. Now both families split the vet bill. Biscuit still eats twice.")
SPOKEN = {"Biscuit's": "biscuits", "couldn't": "couldnt", "Mr.": "mister"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("biscuit", "B IH S K IH T"), ("biscuits", "B IH S K IH T S"), ("couldnt", "K UH D AH N T"), ("beanbag", "B IY N B AE G"), ("cheeseburgers", "CH IY Z B ER G ER Z"), ("waddled", "W AA D AH L D")):
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
