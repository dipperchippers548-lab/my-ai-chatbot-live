"""TTS helper: synth(text, voice, out_mp3, rate, pitch) -> list of word boundaries [{w, s, e}] (seconds)"""
import asyncio, edge_tts, json, sys, os, ssl
import edge_tts.communicate as _ec
if os.path.exists("/root/.ccr/ca-bundle.crt"): _ec._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")  # session proxy CA
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
async def _run(text, voice, out, rate, pitch):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary", proxy=PROXY); words = []
    with open(out, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "e": (ch["offset"] + ch["duration"]) / 1e7})
    return words
def synth(text, voice, out, rate="+0%", pitch="+0Hz"): return asyncio.run(_run(text, voice, out, rate, pitch))
if __name__ == "__main__": print(json.dumps(synth(sys.argv[1], sys.argv[2], sys.argv[3])))
