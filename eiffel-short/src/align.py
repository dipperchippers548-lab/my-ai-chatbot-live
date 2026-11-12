"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1925, a con man sold the Eiffel Tower. And it wasn't his. "
 "Victor Lustig faked government papers, and invited scrap metal dealers to a fancy hotel. "
 "He told them the tower cost too much to maintain, so the city was selling it for scrap. In secret. "
 "One dealer paid him. Lustig took the cash and ran. The dealer was too embarrassed to tell the police. "
 "So Lustig came back, and tried it again. This time, someone called the cops. And he escaped to America. It all started when,")
SPOKEN = {"1925,": "nineteen twenty five"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("lustig", "L AH S T IH G"), ("eiffel", "AY F AH L"), ("con", "K AA N"), ("dealers", "D IY L ER Z"), ("embarrassed", "IH M B EH R AH S T")):
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
