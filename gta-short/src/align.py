"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("SHIIIIIIIT!!! "
 "GTA 6 came out last week. Everybody's playing it. And you're broke as shit. "
 "It's seventy bucks. You have four dollars... and an arcade token. "
 "And you, being a funkin' genius, get a job. "
 "Day one at Burger Barn. You drop the fries. You drop the burgers. You drop the fucking manager. "
 "Fired. "
 "So you sell lemonade. Nobody buys it. It's November. "
 "So you sell your PlayStation... to buy the game. "
 "Now you have GTA 6... and nothing to fucking play it on. "
 "So you figure... if you can't play GTA... live it. "
 "You steal a shopping cart. Cops chase you. Top speed: three miles an hour. "
 "They catch you in eleven seconds. "
 "The judge calls it Grand Theft Shopping Cart. Six months. "
 "First day in prison... the rec room has a PlayStation. With GTA 6. "
 "Best six months of your fucking life.")
SPOKEN = {"SHIIIIIIIT!!!": "shit", "GTA": "g t a", "6": "six", "6.": "six", "6...": "six", "Everybody's": "everybodys", "you're": "youre", "It's": "its", "funkin'": "funkin", "can't": "cant", "GTA...": "g t a"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("everybodys", "EH V R IY B AA D IY Z"), ("its", "IH T S"), ("cant", "K AE N T"), ("playstation", "P L EY S T EY SH AH N")):
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
