"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You're in a packed elevator. Fourteen floors to go. And you feel it coming. "
 "And you, being a funkin' genius, figure... if you let it out slow, nobody will know. "
 "It is not slow. It sounds like a fucking trombone. "
 "Everyone turns around. So you point at the old lady. "
 "The old lady points at you. Then the whole fucking elevator points at you. "
 "So you pull out your cologne and spray. Twelve times. "
 "Now it smells like a fart wearing a tuxedo. "
 "Someone coughs. A kid starts crying. The guy next to you starts praying. "
 "Then... the elevator stops. Between floors. Power's out. "
 "Three hours. Same elevator. Same fucking air. "
 "When the firefighters finally pry the doors open... they step back... and one of them throws up on his own boots. "
 "The news calls it The Floor Nine Incident. "
 "Now every time you step into an elevator... everyone takes the stairs. "
 "You finally have the whole elevator to yourself. Fourteen floors to go. "
 "And you feel it coming.")
SPOKEN = {"You're": "youre", "funkin'": "funkin", "Power's": "powers"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("powers", "P AW ER Z")):
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
