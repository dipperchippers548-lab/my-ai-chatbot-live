"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Seven years ago, Benny bet his entire life savings that he could beat one guy in a boxing match. He lost. In nine seconds. "
 "So he bet again. And lost. And again. Every year, same ring, same guy, same result. Benny sold his car. Then his couch. Then his other couch. "
 "His wife left. His dog left. His goldfish... looked like it was thinking about it. This year, Benny trained like a madman. Four AM runs. Raw eggs. Punching frozen meat. "
 "He steps into the ring, looks the champ dead in the eye, and says, You're going down. The champ just laughs. Hahaha. Good luck, pal. You're gonna need it. "
 "The bell rings. Benny swings... and the champ hits the floor. Out cold. After the fight, the champ hands him a dusty old shoebox. Inside is every dollar Benny ever lost. "
 "I kept it all, he says. Figured you'd need it when you finally got good. Benny cried. Then he spent all of it... on a rematch.")
SPOKEN = {"Hahaha.": "ha ha ha", "AM": "ayem", "You're": "youre", "you'd": "youd"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("ayem", "EY EH M"), ("benny", "B EH N IY"), ("youre", "Y UH R"), ("youd", "Y UW D"), ("goldfish", "G OW L D F IH SH"), ("shoebox", "SH UW B AA K S")):
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
