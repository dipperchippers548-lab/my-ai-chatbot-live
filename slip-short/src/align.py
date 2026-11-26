"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("AHHHHHHHHHHHH! MYYYYYYYYYY CHEEEEEEKSSSSSSS! "
 "It's 6 AM. You're at your fucking job. You haven't had coffee. You haven't had breakfast. You haven't had a single good day since 2019. "
 "You walk into the bathroom... and there it is. A little yellow sign. CAUTION. WET FLOOR. "
 "And you, being a funkin' genius, decide you're too smart for the sign. You tiptoe around it. Like a fucking ninja. "
 "One step. Two steps. Three- "
 "Your feet go up. Your soul leaves your body. You land straight on your ass. "
 "AHHHHHHHH! MY FUCKING ASSSSS HURTSSSSS! "
 "So you limp to your boss. My ass hurts. He gives you a hundred dollars. "
 "You tell your coworkers. My ass hurts. They give you a hundred dollars. "
 "You tell the janitor! The mailman! The pizza guy! Your grandma! A random dude at the bus stop! YOU TELL THE WHOLE FUCKING WORLD YOUR ASS HURTS! "
 "And every single one of them feels so bad... they give you a hundred dollars. "
 "By Friday you have forty thousand dollars and a bruise shaped like Texas. "
 "So the next morning, you walk into the bathroom. You see the wet floor sign... and you run straight at it. "
 "Genius.")
SPOKEN = {"AHHHHHHHHHHHH!": "ah", "MYYYYYYYYYY": "my", "CHEEEEEEKSSSSSSS!": "cheeks", "AHHHHHHHH!": "ah", "ASSSSS": "ass", "HURTSSSSS!": "hurts", "funkin'": "funkin", "It's": "its", "You're": "youre", "you're": "youre", "haven't": "havent", "6": "six", "AM.": "a m", "2019.": "twenty nineteen", "Three-": "three", "coworkers.": "coworkers"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("funkin", "F AH NG K IH N"), ("youre", "Y UH R"), ("its", "IH T S"), ("havent", "HH AE V AH N T"), ("coworkers", "K OW W ER K ER Z")):
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
