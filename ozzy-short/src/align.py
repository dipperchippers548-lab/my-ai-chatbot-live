"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1982, Ozzy Osbourne bit the head off a real bat. On stage. In front of thousands of fans. "
 "It was January 20th in Des Moines, Iowa. Fans loved throwing stuff at Ozzy, so when something small and black landed on stage, he picked it up. "
 "He thought it was a rubber toy. So he did what any rock star would do. He bit it. Then he realized, rubber doesn't crunch. That bat was real. "
 "A 17 year old fan had brought it to the show. After the concert, Ozzy was rushed to the hospital for rabies shots. And he had to keep getting them on tour. "
 "But here's the crazy part. It wasn't even his first time. The year before, he bit the head off a dove in a meeting with record bosses. And it all started when")
SPOKEN = {"1982,": "nineteen eighty two", "20th": "twentieth", "17": "seventeen"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("ozzy", "AA Z IY"), ("osbourne", "AA Z B AO R N"), ("moines", "M OY N"), ("rabies", "R EY B IY Z")):
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
