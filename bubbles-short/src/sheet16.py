"""landscape contact sheet: python3 src/sheet16.py out.jpg cols imgs... (tiles at 480x270 with shot labels)"""
import sys
from PIL import Image, ImageDraw
out, cols, fs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw, th = 480, 270; rows = (len(fs) + cols - 1) // cols; s = Image.new('RGB', (tw * cols, th * rows), 'white'); d = ImageDraw.Draw(s)
for i, f in enumerate(fs):
    x, y = (i % cols) * tw, (i // cols) * th; s.paste(Image.open(f).resize((tw, th)), (x, y)); d.rectangle([x, y, x + 110, y + 16], fill='black'); d.text((x + 3, y + 2), f'#{i} {f.split("/")[-1][1:-4]}', fill='white')
s.save(out, quality=88)
