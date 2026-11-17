"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Every Friday, Earl bought one lottery ticket. Same store. Same numbers. For twenty years. This Friday, he checked the winning numbers on his phone, and every single one matched. His hands started shaking. "
 "He ran into the store, slammed the ticket on the counter, and said, I think I just won. The cashier scanned it. Beep. He looked up and said, Sorry, man. Not a winner. Better luck next time. "
 "Earl stared at the ticket for a long time. Then he sighed, and said, Ah, I guess I'll see better days. And he walked away. A few minutes later, the cashier noticed something. The scanner had been broken all week. "
 "It had told everyone, not a winner. He typed in Earl's numbers by hand. Jackpot. Forty million dollars. He sprinted outside, and found Earl sitting on the curb, eating a hot dog. Earl, you're gonna want to sit down. Earl looked at him and said, I am sitting down.")
SPOKEN = {"I'll": "ill", "Earl's": "earls", "you're": "youre"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("earl", "ER L"), ("earls", "ER L Z"), ("ill", "AY L"), ("youre", "Y UH R"), ("jackpot", "JH AE K P AA T")):
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
