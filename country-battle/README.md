# Country Battle Royale

Generates a 9:16, 60 fps "Which country wins?" short: flag balls fight in a shrinking neon arena.
Collisions deal damage, crits shake the screen, and each KO heals the killer +30 HP. The arena
shrinks, sudden death starts at 30s, and the last 4 survivors hunt each other. Sound effects and
music are synthesized. Each video renders in about 1 minute.

```bash
pip install pycairo numpy pillow   # also needs ffmpeg + Noto Color Emoji
python3 battle.py                                  # 16 random countries
python3 battle.py --countries US,BR,JP,DE --seed 7
python3 battle.py --winner BR                      # searches seeds until Brazil wins
python3 battle.py --count 20 --out out/big.mp4
```
