"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave, sys
from pocketsphinx import Decoder
SCRIPT = ("If you could turn invisible, you'd instantly go blind. You see, your eyes work by catching light. "
 "But if light passes straight through you, it passes straight through your retinas too. "
 "So you'd be stumbling around in total darkness. Naked. Because clothes don't turn invisible. "
 "Luckily, nobody can see you. Except your lunch, which floats in mid-air for about four hours while your stomach empties. "
 "And you still give off about a hundred watts of heat, so any thermal camera sees a glowing naked idiot. Sorry. Which is why,")
shown = SCRIPT.split()
norm = [re.sub(r"[^a-z']", "", w.lower().replace("-", " ").replace("mid air", "mid air")) for w in shown]
# words that expand to several dictionary words
spoken = []; owner = []
for i, w in enumerate(shown):
    parts = re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ").split()
    for p in parts: spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
d.add_word("retinas", "R EH T AH N AH Z", True)
missing = [p for p in set(spoken) if d.lookup_word(p) is None]
print("missing from dictionary:", missing)
d.set_align_text(" ".join(spoken))
d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
segs = [(s.word, s.start_frame/100, (s.end_frame+1)/100) for s in d.seg() if s.word not in ("<sil>", "(NULL)", "<s>", "</s>") and not s.word.startswith("+")]
print(len(segs), len(spoken))
segs = [(re.sub(r"\(\d+\)", "", a), b, c) for a, b, c in segs]
assert [s[0] for s in segs] == spoken, [ (a[0],b) for a,b in zip(segs,spoken) if a[0]!=b][:5]
out = []
for i, word in enumerate(shown):
    idx = [k for k, o in enumerate(owner) if o == i]
    out.append({"w": word, "s": round(segs[idx[0]][1], 2), "e": round(segs[idx[-1]][2], 2)})
json.dump(out, open("build/words.json", "w"), indent=0)
for o in out: print(f'{o["s"]:6.2f} {o["e"]:6.2f} {o["w"]}')
