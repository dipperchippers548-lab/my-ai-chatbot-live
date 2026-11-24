"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("HOLYYYY FUUUUUCK! MYYYYYY HAIRRRRRR IS A MESS! "
 "You look in the mirror. Your hair looks like a bird's nest. With an actual bird in it. "
 "And you, being a funkin' genius, book the cheapest barber in town. Five dollars. Cash only. No reviews. "
 "Next day you walk in. He's wearing sunglasses. Indoors. He shakes your hand... with clippers. "
 "You say, Just a little off the sides. "
 "He says, Say less. "
 "One hour later... he spins the chair around. "
 "He fucked your shit up. "
 "The front is a big golden M. The back... is a chicken. "
 "You look like a fast food war. "
 "So you wear a hat. The wind takes it. A pigeon sees the chicken. The pigeon attacks. "
 "You run home. Lock the door. Finally safe. "
 "Then someone knocks. You open the door... it's a guy in his car. "
 "He looks at your head and says... Can I get a number four?")
SPOKEN = {"HOLYYYY": "holy", "FUUUUUCK!": "fuck", "MYYYYYY": "my", "HAIRRRRRR": "hair", "bird's": "birds", "funkin'": "funkin", "He's": "hes", "it's": "its", "M.": "m"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("birds", "B ER D Z"), ("hes", "HH IY Z"), ("its", "IH T S")):
    if d.lookup_word(wd) is None: d.add_word(wd, ph, True)
print("missing from dictionary:", [p for p in set(spoken) if d.lookup_word(p) is None])
d.set_align_text(" ".join(spoken)); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
segs = [(re.sub(r"\(\d+\)", "", s.word), s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ("<sil>", "(NULL)", "<s>", "</s>") and not s.word.startswith("+")]
got = [s[0] for s in segs]
if got != spoken:
    import difflib; print("DIFF", [d for d in difflib.ndiff(spoken, got) if d[0] in "+-"][:20]); raise SystemExit(1)
out = []
for i, word in enumerate(shown):
    idx = [k for k, o in enumerate(owner) if o == i]; out.append({"w": word, "s": round(segs[idx[0]][1], 2), "e": round(segs[idx[-1]][2], 2)})
json.dump(out, open("build/words.json", "w"), indent=0)
print(" ".join(f'{o["s"]:.2f}:{o["w"]}' for o in out))
