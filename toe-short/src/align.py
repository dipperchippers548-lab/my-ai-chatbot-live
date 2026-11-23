"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("FUUUUUUUUCK!!! "
 "You stubbed your fucking pinky toe on the bed frame at six in the morning. "
 "And you, being a funkin' genius, figure... no toe, no problem. "
 "So you grab your mom's pizza cutter. "
 "You get one roll in... and pass the fuck out. "
 "You wake up in the hospital. Good news: they saved your toe. "
 "Bad news: the doctor was a fucking intern. "
 "He sewed it on your forehead. "
 "Now you wear a sock on your head. Every. Fucking. Day. "
 "At school they call you Toe-nicorn. "
 "Your crush finally looks your way... and the toe wiggles at her. "
 "She throws up in her backpack. "
 "So you grow out your bangs to hide it. Three months later... perfect bangs. Nobody can tell. "
 "You finally walk up to your crush to say hi... trip on your fucking shoelace... "
 "and slam your forehead toe right into her locker door.")
SPOKEN = {"FUUUUUUUUCK!!!": "fuck", "funkin'": "funkin", "mom's": "moms", "Toe-nicorn.": "toe nicorn"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("moms", "M AA M Z"), ("nicorn", "N IH K AO R N")):
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
out.append({"w": "FUUUUUUUUCK!!!", "s": 55.8, "e": 56.9})   # final yell (too stretched for the aligner): placed by its energy
json.dump(out, open("build/words.json", "w"), indent=0)
print(" ".join(f'{o["s"]:.2f}:{o["w"]}' for o in out))
