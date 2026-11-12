"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1990, a pilot was sucked out of his own cockpit window. And he survived. "
 "A British Airways flight had just climbed to 17,000 feet. Then the windscreen blew out. "
 "The captain, Tim Lancaster, shot halfway through the hole. Only his legs were still inside. "
 "So a flight attendant grabbed him, and held on. For about 20 minutes, the crew took turns holding him, in freezing wind. "
 "His face turned blue. They thought he was dead. But they refused to let go. "
 "Meanwhile, the co-pilot landed the plane by himself. And the captain was alive. "
 "He had frostbite and broken bones, and was back at work in under five months. "
 "The cause? 84 screws that were slightly too small. It all started when,")
SPOKEN = {"1990,": "nineteen ninety", "17,000": "seventeen thousand", "20": "twenty", "84": "eighty four", "cause?": "cause"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("lancaster", "L AE NG K AH S T ER"), ("windscreen", "W IH N D S K R IY N"), ("cockpit", "K AA K P IH T"), ("frostbite", "F R AO S T B AY T"), ("co", "K OW"), ("airways", "EH R W EY Z"), ("halfway", "HH AE F W EY"), ("meanwhile", "M IY N W AY L"), ("attendant", "AH T EH N D AH N T")):
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
