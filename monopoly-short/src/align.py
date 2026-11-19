"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("For twelve years, the biggest winners of McDonald's Monopoly all shared one secret... they were in on it. "
 "The million-dollar game pieces weren't being won. They were being handed out. "
 "By one man. Jerry Jacobson. A former cop... and the head of security for the company that made the game pieces. "
 "His job was to protect the big winners. So on the way from the printer... he'd slip them into his pocket. "
 "Then he'd find a lucky stranger. Claim this million-dollar prize... and kick me back a cut. "
 "For twelve years, it worked. Around twenty-four million dollars in prizes. "
 "Then, in 2000, a tip reached the FBI. Agents followed the winners, one by one... and every trail led back to Uncle Jerry. "
 "The man guarding the game... was the one rigging it. "
 "Here's why it worked. One person had all the power, and nobody was checking on him. It's like a bank where the only guard is also the robber. "
 "And that's why, for twelve years, the biggest winners of McDonald's Monopoly all shared one secret")
SPOKEN = {"McDonald's": "mcdonalds", "million-dollar": "million dollar", "weren't": "werent", "he'd": "hed", "2000,": "two thousand", "FBI.": "f b i", "Here's": "heres", "It's": "its", "that's": "thats", "twenty-four": "twenty four"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("mcdonalds", "M AH K D AA N AH L D Z"), ("monopoly", "M AH N AA P AH L IY"), ("jacobson", "JH EY K AH B S AH N"), ("werent", "W ER N T"), ("hed", "HH IY D"), ("heres", "HH IY R Z"), ("thats", "DH AE T S")):
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
