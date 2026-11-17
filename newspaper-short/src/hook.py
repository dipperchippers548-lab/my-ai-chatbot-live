# Hook text shown over the first ~3 s: white lines, then a bigger yellow punch line.
from PIL import Image, ImageDraw, ImageFont
F = "node_modules/@fontsource/nunito/files/nunito-latin-900-normal.woff"
LINES = [("HE WON 40 MILLION...", 84, (255, 255, 255)), ("AND WALKED AWAY", 104, (255, 214, 58))]
im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); d = ImageDraw.Draw(im); y = 150
for text, size, col in LINES:
    while True:
        f = ImageFont.truetype(F, size); w = d.textlength(text, font=f)
        if w <= 980: break
        size -= 2
    d.text(((1080 - w) / 2, y), text, font=f, fill=col, stroke_width=12, stroke_fill=(22, 18, 26)); y += int(size * 1.2)
im.save("build/hook.png")
