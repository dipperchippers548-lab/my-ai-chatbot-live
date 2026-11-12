"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Our town is built on a sleeping giant. Every time he breathes in, our houses rise. Every time he breathes out, they bounce back down. "
 "You get used to it. We only have three rules. Never run. Never shout. And never, ever sneeze. "
 "Because if he wakes up, he rolls over, and we all fall off. Mornings are the worst. "
 "He snores so loud, the windows rattle and the chickens lift off the ground. Grandma says he's been asleep for three hundred years. "
 "Last night, someone sneezed. The whole town froze. The giant scratched his belly. Right where the bakery used to be. "
 "So now we have four rules. And no more bakery. And this morning, for the first time ever, he opened one eye.")
SPOKEN = {}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("snores", "S N AO R Z"), ("sneezed", "S N IY Z D"), ("bakery", "B EY K ER IY")):
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
