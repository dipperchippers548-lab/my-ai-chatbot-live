"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In this world, everybody celebrates their birthday at Mr. Cheese's Pizza Palace. "
 "Today's your birthday. You're turning thirty-one. "
 "And you, being a funkin' genius, show up alone. In a party hat. "
 "But as soon as you walk in... Mr. Cheese is getting jumped. Twelve kids. On their fourth fucking slushie. "
 "They got his tail. They got his whiskers. One kid is biting his fucking ankle. "
 "So you drop your cake... and scream: "
 "I GOOOOOT YOUUUUU MISTER CHEEEEEEESE!!! "
 "You sprint in. Slip on a slice of pizza. Slide across the whole fucking restaurant... straight into the ball pit. "
 "Now the kids are jumping you. "
 "Mr. Cheese pulls you out. Takes off his giant head... "
 "It's your dad. The one who went out for milk twenty years ago. "
 "He looks at you and says... Happy birthday, son. "
 "Then twelve kids jump both of you.")
SPOKEN = {"Mr.": "mister", "Cheese's": "cheeses", "Today's": "todays", "You're": "youre", "thirty-one.": "thirty one", "funkin'": "funkin", "GOOOOOT": "got", "YOUUUUU": "you", "MISTER": "mister", "CHEEEEEEESE!!!": "cheese", "It's": "its"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("cheeses", "CH IY Z IH Z"), ("todays", "T AH D EY Z"), ("its", "IH T S"), ("slushie", "S L AH SH IY")):
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
