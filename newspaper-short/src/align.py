"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Every morning at 5 AM, an old man named Walt steals every newspaper on his street. Every single one. And nobody knows it's him. "
 "The neighbors buy cameras. Walt wears a raincoat and a Halloween mask. They call the police. The officer says, Sir... it's a newspaper. Just read it online. "
 "For twenty years, nobody catches him. Until a kid checks his doorbell camera, and sees Walt lift the mask to sneeze. "
 "The whole street storms Walt's porch, screaming. Walt doesn't argue. He just says, Okay. I'll stop. And he does. "
 "The next week, the Millers go on vacation. Their newspapers pile up on the porch. And their house gets robbed. Then the Parkers. Then the Lees. "
 "Turns out, burglars look for one thing. A pile of newspapers. It means nobody's home. "
 "For twenty years, Walt took every paper on the street, so no house ever looked empty. Not one break-in. Ever. "
 "Now every morning, the whole street walks their newspaper over to Walt's porch. He still doesn't read them.")
SPOKEN = {"I'll": "ill", "5": "five", "AM,": "ayem", "Walt's": "walts"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("ill", "AY L"), ("ayem", "EY EH M"), ("walt", "W AO L T"), ("walts", "W AO L T S"), ("millers", "M IH L ER Z"), ("parkers", "P AA R K ER Z"), ("lees", "L IY Z"), ("okay", "OW K EY")):
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
