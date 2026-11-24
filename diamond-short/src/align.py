"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("He scattered diamonds across an empty field... by hand. "
 "His partner held the bag. We're throwing away diamonds... in the dirt? "
 "You see, it's called salting. "
 "It's 1872. Two broke miners. Their field has nothing in it but rocks. "
 "So they spend their last dollars on cheap gems... and bury them. "
 "Then they walk into a bank in San Francisco with a bag of diamonds. And the richest men in America lose their minds. "
 "They send the best expert in the country. Tiffany's own jeweler. "
 "He looks at the stones. These are real. You boys are rich. "
 "The investors pay six hundred thousand dollars. The miners disappear. "
 "But a young geologist goes to see the field for himself. And he notices something. "
 "The diamonds are only where the ground has been dug up. And one diamond... has already been cut by a jeweler. "
 "Nature doesn't cut diamonds. "
 "The biggest diamond rush in America... was two guys and a shovel.")
SPOKEN = {"We're": "were", "it's": "its", "It's": "its", "1872.": "eighteen seventy two", "Tiffany's": "tiffanys", "doesn't": "doesnt"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("were", "W ER"), ("its", "IH T S"), ("tiffanys", "T IH F AH N IY Z"), ("doesnt", "D AH Z AH N T")):
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
