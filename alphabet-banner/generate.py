#!/usr/bin/env python3
"""Alfabe flama (pennant banner) üreteci.

Fotoğraftaki karta benzer flamaları Türkçe alfabenin 29 harfi için üretir
ve yazdırılabilir tek bir HTML dosyası oluşturur (A4 yatay, sayfa başına 2).
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).parent
FONT = HERE / "Quicksand-Bold.ttf"
# Vektör (COLRv1) renkli emoji - sistemdeki bitmap Noto'nun aksine büyütünce
# pikselleşmez. Google Fonts'tan sadece kullanılan karakterlerle indirildi.
EMOJI_FONT = HERE / "NotoColorEmoji-subset.woff2"

PER_PAGE = 2

# --- Renkler (fotoğraftaki kartla eşleşecek şekilde) ---
INK = "#6b5a51"        # kahverengi çizgi rengi
BAND = "#d5cbe9"       # lila şerit
BAND_EDGE = "#c7bbe2"

# --- Harf listesi (Türkçe alfabe, 29 harf) ---
TR = [
    ("A", "🍐", "armut"), ("B", "🎈", "balon"), ("C", "🐥", "civciv"),
    ("Ç", "🍓", "çilek"), ("D", "🐫", "deve"), ("E", "🐘", "el"),
    ("F", "🐠", "fil"), ("G", "🌹", "gül"), ("Ğ", "🏔", "dağ"),
    ("H", "🐓", "horoz"), ("I", "💡", "ışık"), ("İ", "🐮", "inek"),
    ("J", "✈", "jet"), ("K", "🐱", "kedi"), ("L", "🍋", "limon"),
    ("M", "🍌", "muz"), ("N", "👵", "nine"), ("O", "🚌", "otobüs"),
    ("Ö", "🦆", "ördek"), ("P", "🍊", "portakal"), ("R", "🤖", "robot"),
    ("S", "🥛", "süt"), ("Ş", "☂", "şemsiye"), ("T", "🐰", "tavşan"),
    ("U", "🐞", "uğur böceği"), ("Ü", "🍇", "üzüm"), ("V", "⛴", "vapur"),
    ("Y", "⭐", "yıldız"), ("Z", "🦒", "zürafa"),
]
# Türkçe listede görsel/harf uyumu: F=fil, E=el olacak şekilde düzeltilir
TR[5] = ("E", "🤚", "el")
TR[6] = ("F", "🐘", "fil")

# --- Flama geometrisi (mm) ---
W, H, TIP = 92.0, 128.0, 30.0   # SVG birim: flama oranı
CARD_W, CARD_H = 138.0, 192.0    # baskı boyutu (mm) - sayfa başına 2 flama
SW = 1.4                        # çizgi kalınlığı


def flag_svg(upper: str, emoji: str) -> str:
    """Tek bir flamanın SVG'si (mm biriminde viewBox)."""
    lower = upper.lower()
    if upper == "I":       # Türkçe: I'nın küçüğü ı
        lower = "ı"
    if upper == "İ":
        lower = "i"
    label = upper + lower

    body = H - TIP
    inset = SW / 2
    path = (
        f"M{inset},{inset} L{W - inset},{inset} L{W - inset},{body} "
        f"L{W / 2},{H - inset} L{inset},{body} Z"
    )
    band_y, band_h = 21.0, 20.0

    return f"""<svg class="flag" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="clip{upper.encode('ascii', 'replace').decode()}{ord(upper)}">
      <path d="{path}"/>
    </clipPath>
  </defs>
  <path d="{path}" fill="#ffffff"/>
  <g clip-path="url(#clip{upper.encode('ascii', 'replace').decode()}{ord(upper)})">
    <rect x="0" y="{band_y}" width="{W}" height="{band_h}" fill="{BAND}"/>
    <line x1="0" y1="{band_y}" x2="{W}" y2="{band_y}" stroke="{BAND_EDGE}" stroke-width="0.4"/>
    <line x1="0" y1="{band_y + band_h}" x2="{W}" y2="{band_y + band_h}" stroke="{BAND_EDGE}" stroke-width="0.4"/>
  </g>
  <text class="letter" x="{W / 2}" y="{band_y + band_h - 1.5}" text-anchor="middle">{label}</text>
  <text class="pic" x="{W / 2}" y="{band_y + band_h + 54}" text-anchor="middle">{emoji}</text>
  <circle cx="{W * 0.18}" cy="9" r="2.2" fill="none" stroke="#c9c0ba" stroke-width="0.35" stroke-dasharray="1 1"/>
  <circle cx="{W * 0.82}" cy="9" r="2.2" fill="none" stroke="#c9c0ba" stroke-width="0.35" stroke-dasharray="1 1"/>
  <path d="{path}" fill="none" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>
</svg>"""


def build(letters, title, subtitle, out_path):
    font_b64 = base64.b64encode(FONT.read_bytes()).decode()
    emoji_b64 = base64.b64encode(EMOJI_FONT.read_bytes()).decode()

    # Her sayfa kendi .sheet bloğunda
    sheets = []
    for i in range(0, len(letters), PER_PAGE):
        cells = "\n".join(
            f'  <div class="cell">{flag_svg(u, e)}</div>'
            for u, e, _ in letters[i:i + PER_PAGE]
        )
        sheets.append(f'<div class="sheet">\n{cells}\n</div>')
    cards = "\n".join(sheets)

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
  @font-face {{
    font-family: 'BannerLetter';
    src: url(data:font/ttf;base64,{font_b64}) format('truetype');
    font-weight: 700;
  }}
  @font-face {{
    font-family: 'EmojiVector';
    src: url(data:font/woff2;base64,{emoji_b64}) format('woff2');
  }}
  @page {{ size: A4 landscape; margin: 5mm; }}
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; padding: 0; background: #fff; }}
  body {{ font-family: 'BannerLetter', sans-serif; }}

  .sheet {{
    display: grid;
    grid-template-columns: {CARD_W}mm {CARD_W}mm;
    grid-auto-rows: {CARD_H}mm;
    justify-content: center;
    align-content: center;
    gap: 4mm;
    height: 200mm;
  }}
  .cell {{ width: {CARD_W}mm; height: {CARD_H}mm; }}
  .flag {{ width: {CARD_W}mm; height: {CARD_H}mm; display: block; }}

  .letter {{
    font-family: 'BannerLetter', sans-serif;
    font-weight: 700;
    font-size: 27px;            /* SVG kullanıcı birimi */
    fill: #ffffff;
    stroke: {INK};
    stroke-width: 1.4;
    stroke-linejoin: round;
    paint-order: stroke fill;
    letter-spacing: 0.5px;
  }}
  .pic {{
    font-family: 'EmojiVector', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
    font-size: 60px;            /* SVG kullanıcı birimi */
  }}

  @media screen {{
    body {{ background: #eceaf3; padding: 8mm 0; }}
    .sheet {{ background: #fff; padding: 5mm; margin: 0 auto 8mm; width: 297mm; box-shadow: 0 2px 12px rgba(0,0,0,.12); }}
  }}
  .sheet {{ break-after: page; page-break-after: always; }}
  .sheet:last-child {{ break-after: auto; page-break-after: auto; }}
  @media print {{
    .cell {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>
{cards}
</body>
</html>
"""
    out_path.write_text(html, encoding="utf-8")
    print(f"yazıldı: {out_path}  ({len(letters)} flama)")


if __name__ == "__main__":
    build(TR, "Alfabe Flamaları A-Z", "yazdırılabilir flama kartları",
          HERE / "alfabe-flama-tr.html")
