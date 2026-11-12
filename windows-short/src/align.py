"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Have you ever wondered why plane windows are round? It's because square ones literally ripped planes apart. "
 "In the nineteen fifties, the first jet airliner, the de Havilland Comet, had square-ish windows. It flew higher and faster than anything before it. "
 "Then, in nineteen fifty-four, two of them broke apart in mid-air. Nobody knew why. "
 "So engineers put an entire plane into a giant water tank, and pumped it up and down, over and over, like thousands of flights. "
 "Until it split open. Right at a corner. You see, every flight, the cabin gets pumped full of air, like a balloon. "
 "And all that stress piles up at sharp corners. A curve spreads it out. "
 "That's why every window you've ever looked through on a plane is round.")
SPOKEN = {"square-ish": "square ish", "fifty-four,": "fifty four", "mid-air.": "mid air"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("havilland", "HH AE V IH L AH N D"), ("ish", "IH SH"), ("airliner", "EH R L AY N ER")):
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
