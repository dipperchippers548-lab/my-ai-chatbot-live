"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1964, a man mailed himself across the world... in a wooden box. "
 "His name was Reg Spiers. An Australian athlete, stuck in London. Broke. No money for a ticket home. "
 "His friend laughed. You can't mail a person. Reg said, Watch me. "
 "So they built a crate. Just big enough for one man. Some food. Some water. A blanket. "
 "And the best part? He sent it cash on delivery. The person at the other end would pay for it. "
 "Reg climbed in. The lid was nailed shut. And the box was loaded onto a cargo plane. "
 "Then things went wrong. In Paris, the plane was delayed. Reg's crate sat on the hot runway for over a day. No air. No room to move. "
 "Sixty-three hours later... the plane landed in Perth, Australia. "
 "That night, Reg cut his way out of the crate... and walked out of the airport. Nobody stopped him. "
 "He made it home. He'd mailed himself across the world. "
 "Here's why it worked. Back then, airport security checked people, not boxes. Cargo only got weighed and checked for paperwork. Nobody opened it. "
 "It's like a club bouncer checking everyone's ID at the door... while somebody walks in through the back with the deliveries. "
 "And that's how, in 1964, a man mailed himself across the world... in a")
SPOKEN = {"1964,": "nineteen sixty four", "Spiers.": "spiers", "can't": "cant", "Reg's": "regs", "Sixty-three": "sixty three", "He'd": "hed", "Here's": "heres", "It's": "its", "that's": "thats", "ID": "i d"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("spiers", "S P IY R Z"), ("cant", "K AE N T"), ("regs", "R EH JH Z"), ("reg", "R EH JH"), ("hed", "HH IY D"), ("heres", "HH IY R Z"), ("thats", "DH AE T S"), ("perth", "P ER TH")):
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
