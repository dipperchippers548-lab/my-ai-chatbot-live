"""Forced-align the known script to the voiceover with PocketSphinx -> build/words.json"""
import json, re, wave
from pocketsphinx import Decoder
SCRIPT = ("You get hiccups in the middle of the biggest fucking test of your life. "
 "The teacher looks up and says, Not. One. Fucking. Sound. Hic. "
 "So you hold your breath. Ten seconds. Twenty. You turn purple. "
 "HIC. Your desk jumps an inch off the floor. "
 "So you drink water upside down. It goes up your fucking nose. "
 "HIC. The whole class turns around. "
 "So your buddy tries to scare them out of you. BOO. "
 "HIC. You go straight through the fucking ceiling. "
 "The principal grabs your leg. HIC. Now he's coming with you. "
 "The school shrinks. The clouds go by. Then the sky goes black. "
 "You're floating in fucking space... with the principal... and your test. "
 "You try to hiccup. Nothing. "
 "Because in space... there's no sound. "
 "Not. One. Fucking. Sound. Fucking genius.")
SPOKEN = {"he's": "hes", "You're": "youre", "there's": "theres"}
shown = SCRIPT.split(); spoken = []; owner = []
for i, w in enumerate(shown):
    for p in (SPOKEN.get(w) or re.sub(r"[^a-z' -]", "", w.lower()).replace("-", " ")).split(): spoken.append(p); owner.append(i)
w = wave.open("build/voice16k.wav"); pcm = w.readframes(w.getnframes()); w.close()
d = Decoder(samprate=16000)
for wd, ph in (("hic", "HH IH K"), ("hes", "HH IY Z"), ("youre", "Y UH R"), ("theres", "DH EH R Z")):
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
