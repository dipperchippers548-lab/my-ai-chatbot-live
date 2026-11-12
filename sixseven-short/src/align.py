"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In twenty twenty-five, two numbers took over American schools. Six. Seven. And nobody knows what they mean. "
 "Most people trace it back to a rapper called Skrilla, and his song, Doot Doot, six seven. "
 "Then people put that song over clips of basketball star LaMelo Ball. Who happens to be six foot seven. "
 "Then a kid at a basketball game yelled it into a camera, and did this. Like he was weighing two things. That clip blew up. "
 "Suddenly, every time a teacher said six, the whole class yelled seven. Page sixty-seven? Chaos. "
 "Some teachers banned it. Others started saying it themselves, to make it uncool. "
 "Then Dictionary dot com made it the word of the year. And admitted it has no definition. "
 "It's part inside joke, part signal, part performance. So if you don't get it, that's kind of the point. It all started when,")
SPOKEN = {"sixty-seven?": "sixty seven"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("skrilla", "S K R IH L AH"), ("doot", "D UW T"), ("lamelo", "L AH M EH L OW"), ("uncool", "AH N K UW L"), ("dictionary", "D IH K SH AH N EH R IY")):
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
