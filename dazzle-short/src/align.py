"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("In 1917, a painter convinced the British Navy to paint their warships... like zebras. Giant black and white stripes. Zigzags. Swirls. On battleships. "
 "The admirals laughed. Son, the point is to HIDE the ship. Not turn it into a circus tent. The painter, Norman Wilkinson, just said, I'm not trying to hide it. "
 "Back then, German submarines were sinking ships almost every day. To hit one, a sub captain had to peek through a tiny periscope, guess the ship's speed and which way it was heading, and fire the torpedo where the ship was going to be. "
 "But the stripes broke up the ship's shape. Which end is the front? Is it turning? How fast is it going? Guess even a little wrong... and the torpedo sails right past. "
 "It's like trying to tell which way a spinning barber pole is moving. Soon, over two thousand ships were covered in stripes. They called it dazzle camouflage. "
 "And the admirals who laughed? They ended up painting their own ships too... because in 1917, a painter convinced the British Navy")
SPOKEN = {"1917,": "nineteen seventeen", "I'm": "im", "ship's": "ships", "It's": "its"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("wilkinson", "W IH L K IH N S AH N"), ("im", "AY M"), ("zebras", "Z IY B R AH Z"), ("zigzags", "Z IH G Z AE G Z"), ("periscope", "P EH R AH S K OW P")):
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
