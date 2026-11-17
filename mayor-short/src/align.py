"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("Every year, the town of Millbrook held an election for mayor. And every year, nobody cared. So when Doug got his ballot, he crossed out both names, and wrote in his own. As a joke. "
 "He thought nothing of it. Until the next morning, when his phone wouldn't stop ringing. Doug had won. Turns out, his neighbor saw the joke, and told everyone. Half the town wrote in Doug too. "
 "Doug had no plan. No speech. No idea what a mayor even does. So on his first day, he fixed the potholes, because they annoyed him. On his second day, he put free snacks at every bus stop. "
 "Then he made every Friday, Pizza Friday. The town loved him. Crime went down. Happiness went up. And at the next election, Doug won again. This time, even his opponent voted for him.")
SPOKEN = {"wouldn't": "wouldnt"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("millbrook", "M IH L B R UH K"), ("doug", "D AH G"), ("wouldnt", "W UH D AH N T"), ("potholes", "P AA T HH OW L Z")):
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
