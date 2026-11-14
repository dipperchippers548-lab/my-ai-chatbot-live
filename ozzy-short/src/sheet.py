import sys, glob
from PIL import Image
fs = sorted(glob.glob('build/test/*.jpg')); cols = int(sys.argv[1]) if len(sys.argv) > 1 else 6
tw, th = 300, 533; rows = (len(fs) + cols - 1) // cols
s = Image.new('RGB', (tw * cols, th * rows))
for i, f in enumerate(fs): s.paste(Image.open(f).resize((tw, th), Image.LANCZOS), ((i % cols) * tw, (i // cols) * th))
s.save('build/sheet.jpg', quality=88); print(len(fs), fs[0], fs[-1])
