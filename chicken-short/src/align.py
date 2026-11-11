"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1945, a farmer chopped off a chicken's head. And the chicken just walked away. "
 "You see, the axe missed most of his brain stem, which is the part that runs breathing and heartbeat. "
 "So Mike kept living. For eighteen months. The farmer fed him with an eyedropper, straight down the neck. "
 "Then he took him on tour, and people paid to stare at a headless chicken. Which is fair. "
 "Until one night in a motel, Mike choked. Sorry. And it all started when,")
SPOKEN = {"1945,": "nineteen forty five", "eyedropper,": "eye dropper", "heartbeat.": "heart beat"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
print("missing from dictionary:", [p for p in set(spoken) if d.lookup_word(p) is None])
d.set_align_text(" ".join(spoken)); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
segs = [(re.sub(r"\(\d+\)", "", s.word), s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ("<sil>", "(NULL)", "<s>", "</s>") and not s.word.startswith("+")]
assert [s[0] for s in segs] == spoken
out = []
for i, word in enumerate(shown):
    idx = [k for k, o in enumerate(owner) if o == i]; out.append({"w": word, "s": round(segs[idx[0]][1], 2), "e": round(segs[idx[-1]][2], 2)})
json.dump(out, open("build/words.json", "w"), indent=0)
print(" ".join(f'{o["s"]:.2f}:{o["w"]}' for o in out))
