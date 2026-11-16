"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("He slices his hand open, and now his skin has a gap. Left alone, it would heal slowly and leave a bigger scar. "
 "So a doctor numbs it, and pushes a curved needle in on one side, under the skin, and out the other. She pulls the thread tight, and the two edges touch. "
 "Then she ties a knot. And does it again. And again. But here's the thing. The stitches don't actually heal anything. They just hold the edges together. "
 "Underneath, blood forms a clot, and cells start building new fibers called collagen, weaving across the gap like a bridge. "
 "After a week or two, the doctor snips the thread and pulls it out. But the skin is still weak. It can take months to get its strength back. "
 "And the bridge never looks exactly the same. That's your scar. And it all started when")
SPOKEN = {}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("collagen", "K AA L AH JH AH N"), ("snips", "S N IH P S"), ("numbs", "N AH M Z")):
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
