"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You have a crush on the hottest girl at your job. "
 "Problem one: she has a boyfriend. Six-foot-five. Abs on his fucking abs. "
 "Problem two... you're ugly as fuck. "
 "And you, being a funkin' genius, decide... you'll just become him. "
 "So you try a face mask. It peels off your fucking eyebrows. "
 "So you hit the gym. Day one... you drop the bar on your face. "
 "So you find a plastic surgeon. On a flyer. At a gas station. Ninety-nine bucks. "
 "You wake up... and you look exactly like her boyfriend. Abs and everything. "
 "You walk into work. She takes one look at you... and dumps him on the spot. "
 "Then she dumps you too. "
 "Because she only dates ugly guys. "
 "So now... you need to get ugly as fuck.")
SPOKEN = {"Six-foot-five.": "six foot five", "you're": "youre", "funkin'": "funkin", "you'll": "youll"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("youll", "Y UW L")):
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
