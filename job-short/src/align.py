"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You walk into your first fucking job interview. Your suit is two sizes too small, your tie is on backwards, and you're sweating like a fucking sinner in church. "
 "So... tell me about yourself. "
 "And you, being a funkin' genius, decide honesty is the best fucking policy. "
 "Well, I got fired from my last three jobs. One for sleeping. One for stealing. And one for sleeping while I was stealing. "
 "He writes something down. You think that's a good sign. "
 "What's your biggest weakness? "
 "Waking up. And Mondays. And Tuesdays. Honestly? Work. "
 "Why do you want to work here? "
 "I don't. My mom said if I don't get a job, she's turning my room into a fucking gym. "
 "Where do you see yourself in five years? "
 "In your chair, bro. I'm taking your fucking job. "
 "He puts down his pen. Takes a deep breath. Looks you dead in the eyes... "
 "FUCK NO! YOU ARE NOT GETTING THIS JOB! "
 "And then he sprints out of his own fucking office! Leaves his coffee! Leaves his laptop! Leaves YOU! "
 "So you sit in his chair. Feet up on the desk. Congratulations... you're the boss now.")
SPOKEN = {"funkin'": "funkin", "you're": "youre", "that's": "thats", "What's": "whats", "don't.": "dont", "don't": "dont", "she's": "shes", "I'm": "im", "you're": "youre"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("thats", "DH AE T S"), ("whats", "W AH T S"), ("dont", "D OW N T"), ("shes", "SH IY Z"), ("im", "AY M")):
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
