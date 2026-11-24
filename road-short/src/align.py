"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You're in your fucking car. The light's been green for ten seconds. "
 "And the guy in front of you... is just sitting there. Not moving. On a green fucking light. "
 "So you, being a funkin' genius, lay on the horn. Loud as shit. "
 "The guy slowly turns around... and stares right fucking at you. Dead in the eyes. "
 "So you get out the car. You yank his door open. And you start swinging. Like a fucking windmill. "
 "You hit the steering wheel. You hit the airbag. The airbag hits you back. "
 "You're lying in the road. Then you look up... and see why he stopped. "
 "A mama duck. And eleven baby ducks. Crossing the street. One at a time. "
 "Someone filmed the whole thing. Now you're on the news. Man Punches Airbag Over Ducks. "
 "Twelve million views. Your mom saw it. Your boss saw it. The ducks saw it. "
 "The next day... you're at a green light. Ducks crossing. You wait. "
 "The car behind you honks. "
 "You slowly turn around... and stare right fucking at him.")
SPOKEN = {"You're": "youre", "you're": "youre", "light's": "lights", "funkin'": "funkin"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("lights", "L AY T S")):
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
