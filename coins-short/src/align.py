"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In the 1690s, a man in London got rich... by shaving coins. Back then, coins were made of real silver. So he'd clip a tiny sliver off the edge, spend the coin like normal, and melt the shavings down. "
 "One coin, nobody notices. But thousands of people were doing it. England's money was literally shrinking. So the government called in the smartest man in the country. Isaac Newton. "
 "The coin gangs laughed. What's a science guy gonna do? Calculate us? Newton put on disguises, went undercover in taverns, and listened. "
 "Then came the real fix: new coins with ridges stamped all around the edge. Shave off even a sliver, and the ridges vanish. One look, and you know it's been cut. "
 "That's why your quarter still has ridges today. And the gangs who laughed at Newton? They ended up in prison. All except one... a man in London who got rich")
SPOKEN = {"1690s,": "sixteen nineties", "he'd": "hed", "England's": "englands", "What's": "whats", "gonna": "gonna", "That's": "thats"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("nineties", "N AY N T IY Z"), ("hed", "HH IY D"), ("englands", "IH NG G L AH N D Z"), ("whats", "W AH T S"), ("thats", "DH AE T S"), ("newton", "N UW T AH N")):
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
