"""contact sheet: python3 src/sheet.py out.jpg cols img1 img2 ...  (labels each tile with its time)"""
import sys
from PIL import Image, ImageDraw
out, cols, fs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f) for f in fs]; w, h = ims[0].size; tw, th = w // 2, h // 2
rows = (len(ims) + cols - 1) // cols; s = Image.new('RGB', (tw * cols, th * rows), 'white'); d = ImageDraw.Draw(s)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * tw, (i // cols) * th; s.paste(im.resize((tw, th)), (x, y)); d.rectangle([x, y, x + 70, y + 18], fill='black'); d.text((x + 4, y + 3), f.split('/')[-1][1:-4], fill='white')
s.save(out, quality=88)
