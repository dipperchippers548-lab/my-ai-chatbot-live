"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("He drew a town on the map... that didn't exist. "
 "A tiny dot on a dirt road in New York. He named it Agloe. "
 "His partner stared at it. Why are we putting a fake town... on a real map? "
 "You see, it's called a paper town. "
 "It's 1930. Making a map takes months. Driving every road. Measuring every turn. But copying one takes an afternoon. "
 "So if Agloe ever shows up on someone else's map... they know exactly who copied them. "
 "Years go by. Then one day, a rival company prints their new map. "
 "And right there, on that same dirt road... Agloe. "
 "Caught. They grab their lawyers and storm in. You copied our map! "
 "The rival just smiles. No we didn't. Agloe is real. "
 "They drive out to the dirt road... and there it is. A little store. With a sign on the front. "
 "Agloe General Store. "
 "Someone saw Agloe on the map, thought it was a real town... and built a store there. They named it after the town on the map. "
 "The fake town they made up to catch liars... became real. Because their own map told someone to build it.")
SPOKEN = {"didn't": "didnt", "it's": "its", "It's": "its", "1930.": "nineteen thirty", "else's": "elses", "didn't.": "didnt"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("agloe", "AE G L OW"), ("didnt", "D IH D AH N T"), ("its", "IH T S"), ("elses", "EH L S IH Z")):
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
