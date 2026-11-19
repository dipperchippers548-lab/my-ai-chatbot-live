"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("A man won the lottery fourteen times... and none of it was luck. His name was Stefan Mandel, and he noticed something nobody else did. "
 "Sometimes a jackpot gets so big, it's worth more than every possible ticket put together. "
 "So in 1992, he went after the Virginia lottery. Seven million possible number combinations. One dollar each. And a jackpot of twenty-seven million. "
 "People laughed. Nobody can buy seven million tickets. So he rented a warehouse, hired a team, and started filling out tickets. Millions of them. Day and night. "
 "They ran out of time before they got every combination... but it didn't matter. The winning numbers were in the pile. "
 "Here's the math. Spend about seven million, win twenty-seven million. It's like buying every raffle ticket when the prize is worth more than all the tickets. "
 "Right after that, lotteries changed the rules. Because a man won the lottery fourteen times")
SPOKEN = {"1992,": "nineteen ninety two", "it's": "its", "didn't": "didnt", "Here's": "heres", "It's": "its", "twenty-seven": "twenty seven"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("stefan", "S T EH F AH N"), ("mandel", "M AE N D AH L"), ("didnt", "D IH D AH N T"), ("heres", "HH IY R Z")):
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
