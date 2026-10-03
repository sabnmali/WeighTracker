"""Launcher ikonlarını (mipmap PNG) üretir. Gereksinim: Pillow."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android", "res")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def render(size: int) -> Image.Image:
    s = 4  # süper örnekleme
    W = size * s
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(W * 0.22)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=r, fill=(30, 58, 95, 255))
    # Alman bayrağı şeridi
    band_h = int(W * 0.06)
    y0 = int(W * 0.74)
    x0, x1 = int(W * 0.2), int(W * 0.8)
    for i, col in enumerate([(20, 20, 20), (221, 0, 0), (255, 206, 0)]):
        d.rectangle([x0, y0 + i * band_h, x1, y0 + (i + 1) * band_h], fill=col + (255,))
    font = ImageFont.truetype(FONT, int(W * 0.42))
    text = "A2"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((W - tw) / 2 - bbox[0], W * 0.40 - th / 2 - bbox[1]), text, font=font, fill=(245, 242, 234, 255))
    return img.resize((size, size), Image.LANCZOS)


for dens, px in SIZES.items():
    out = os.path.join(RES, f"mipmap-{dens}")
    os.makedirs(out, exist_ok=True)
    render(px).save(os.path.join(out, "ic_launcher.png"))
print("icons ok")
