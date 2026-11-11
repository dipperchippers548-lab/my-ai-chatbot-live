"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1982, a truck driver flew a lawn chair into airline traffic. "
 "Larry Walters tied more than 40 weather balloons to a garden chair. "
 "He packed sandwiches, a radio, and a pellet gun, to pop balloons when he wanted to come down. "
 "Then he took off. And shot up to around 16,000 feet. Two airline pilots reported a man in a chair. "
 "So he started shooting balloons. Then he dropped the gun. He still landed safely. "
 "And got fined $1,500 dollars. It all started when,")
SPOKEN = {"1982,": "nineteen eighty two", "40": "forty", "16,000": "sixteen thousand", "$1,500": "fifteen hundred"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("walters", "W AO L T ER Z"), ("pellet", "P EH L AH T"), ("lawn", "L AO N"), ("sandwiches", "S AE N D W IH CH IH Z"), ("balloons", "B AH L UW N Z")):
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
