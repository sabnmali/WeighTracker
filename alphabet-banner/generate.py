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
    ("A", "🍐", "armut"), ("B", "🎈", "balon"), ("C", "svg:civciv", "civciv"),
    ("Ç", "🍓", "çilek"), ("D", "svg:deve", "deve"), ("E", "🐘", "el"),
    ("F", "🐠", "fil"), ("G", "🌹", "gül"), ("Ğ", "🏔", "dağ"),
    ("H", "svg:hamster", "hamster"), ("I", "💡", "ışık"), ("İ", "svg:inek", "inek"),
    ("J", "svg:jandarma", "jandarma"), ("K", "🐱", "kedi"), ("L", "🍋", "limon"),
    ("M", "🍌", "muz"), ("N", "svg:nar", "nar"), ("O", "🚌", "otobüs"),
    ("Ö", "svg:ordek", "ördek"), ("P", "🍊", "portakal"), ("R", "🤖", "robot"),
    ("S", "🥛", "süt"), ("Ş", "☂", "şemsiye"), ("T", "svg:tavsan", "tavşan"),
    ("U", "svg:ugurbocegi", "uğur böceği"), ("Ü", "🍇", "üzüm"), ("V", "🧳", "valiz"),
    ("Y", "⭐", "yıldız"), ("Z", "svg:zurafa", "zürafa"),
]
# Türkçe listede görsel/harf uyumu: F=fil, E=el olacak şekilde düzeltilir
TR[5] = ("E", "✋", "el")
TR[6] = ("F", "svg:fil", "fil")

# --- Elle çizilen görseller ---
# Unicode'da nar emojisi yok; aynı düz/renkli emoji diliyle çizildi.
# 100x100 kutu içinde, emoji glifleriyle aynı ölçeğe oturtulur.
CUSTOM = {
    "svg:nar": ((9, 4, 91, 98), """
  <path d="M40 27 L42.5 13 L47 20 L50 7 L53 20 L57.5 13 L60 27 Z"
        fill="#93302a" stroke="#93302a" stroke-width="3"
        stroke-linejoin="round"/>
  <ellipse cx="50" cy="60" rx="41" ry="38" fill="#d3382d"/>
  <path d="M50 22 a41 38 0 0 0 -41 38 a41 38 0 0 0 16 30
           a46 46 0 0 1 14 -58 a44 44 0 0 1 11 -10 Z" fill="#e6604f"/>
  <ellipse cx="27" cy="42" rx="8" ry="12" fill="#f4978a"
           transform="rotate(-28 27 42)"/>
  <circle cx="52" cy="62" r="25" fill="#fdeee6"/>
  <circle cx="52" cy="62" r="25" fill="none" stroke="#f3cdba" stroke-width="2"/>
  <g fill="#c92f26">
    <circle cx="43" cy="54" r="5.8"/><circle cx="55" cy="51" r="5.8"/>
    <circle cx="65" cy="58" r="5.8"/><circle cx="44" cy="66" r="5.8"/>
    <circle cx="55" cy="63" r="5.8"/><circle cx="65" cy="70" r="5.8"/>
    <circle cx="46" cy="77" r="5.8"/><circle cx="56" cy="75" r="5.8"/>
  </g>
  <g fill="#ffffff" opacity="0.55">
    <circle cx="41" cy="52" r="1.7"/><circle cx="53" cy="49" r="1.7"/>
    <circle cx="63" cy="56" r="1.7"/><circle cx="42" cy="64" r="1.7"/>
    <circle cx="53" cy="61" r="1.7"/><circle cx="63" cy="68" r="1.7"/>
    <circle cx="44" cy="75" r="1.7"/><circle cx="54" cy="73" r="1.7"/>
  </g>
  <ellipse cx="50" cy="60" rx="41" ry="38" fill="none"
           stroke="#9a2b22" stroke-width="2.6"/>
"""),

    # Emoji setindeki hayvanların sevimli yüzlü karşılığı olmadığı için
    # kedi/inek/hamster gliflerinin diliyle (yuvarlak portre, iri gözler,
    # pembe yanak) yeniden çizildi.
    "svg:fil": ((2, 25, 98, 95), """
  <ellipse cx="19" cy="44" rx="17" ry="19" fill="#9fabb3"/>
  <ellipse cx="81" cy="44" rx="17" ry="19" fill="#9fabb3"/>
  <ellipse cx="20" cy="45" rx="10" ry="12" fill="#c3a3a8"/>
  <ellipse cx="80" cy="45" rx="10" ry="12" fill="#c3a3a8"/>
  <ellipse cx="50" cy="48" rx="31" ry="30" fill="#aeb9c0"/>
  <path d="M50 68 q-10 0 -10 11 l0 12 q0 9 9 9 q8 0 8 -8"
        fill="none" stroke="#aeb9c0" stroke-width="15"
        stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="34" cy="63" rx="7" ry="5" fill="#f2a3ae" opacity="0.65"/>
  <ellipse cx="66" cy="63" rx="7" ry="5" fill="#f2a3ae" opacity="0.65"/>
  <circle cx="38" cy="46" r="5.4" fill="#2b2b2b"/>
  <circle cx="62" cy="46" r="5.4" fill="#2b2b2b"/>
  <circle cx="36.3" cy="44" r="1.9" fill="#ffffff"/>
  <circle cx="60.3" cy="44" r="1.9" fill="#ffffff"/>
  <path d="M20 30 q6 -7 13 -4 M80 30 q-6 -7 -13 -4" fill="none"
        stroke="#8e9aa2" stroke-width="2.4" stroke-linecap="round"/>
"""),

    "svg:ordek": ((21, 2, 79, 89), """
  <ellipse cx="50" cy="74" rx="29" ry="15" fill="#f7c948"/>
  <path d="M50 10 q-4 -6 2 -8 q4 6 -2 8" fill="#f0a830"/>
  <circle cx="50" cy="45" r="31" fill="#ffd84d"/>
  <ellipse cx="34" cy="58" rx="7" ry="5" fill="#f7a8b0" opacity="0.7"/>
  <ellipse cx="66" cy="58" rx="7" ry="5" fill="#f7a8b0" opacity="0.7"/>
  <circle cx="39" cy="40" r="5.4" fill="#2b2b2b"/>
  <circle cx="61" cy="40" r="5.4" fill="#2b2b2b"/>
  <circle cx="37.3" cy="38" r="1.9" fill="#ffffff"/>
  <circle cx="59.3" cy="38" r="1.9" fill="#ffffff"/>
  <ellipse cx="50" cy="56" rx="16" ry="10" fill="#f5972e"/>
  <path d="M36 56 q14 7 28 0" fill="none" stroke="#d97f1d"
        stroke-width="2.2" stroke-linecap="round"/>
"""),

    "svg:zurafa": ((19, 1, 81, 86), """
  <path d="M35 20 q-3 -12 3 -13 q6 1 4 13 Z" fill="#c98b32"/>
  <path d="M65 20 q3 -12 -3 -13 q-6 1 -4 13 Z" fill="#c98b32"/>
  <circle cx="36" cy="7" r="6" fill="#a9701f"/>
  <circle cx="64" cy="7" r="6" fill="#a9701f"/>
  <rect x="38" y="62" width="24" height="24" rx="11" fill="#f2b23e"/>
  <ellipse cx="50" cy="45" rx="31" ry="29" fill="#ffc857"/>
  <g fill="#d08f2b" opacity="0.85">
    <ellipse cx="30" cy="30" rx="7" ry="6"/>
    <ellipse cx="68" cy="28" rx="6.5" ry="5.5"/>
    <ellipse cx="25" cy="50" rx="6" ry="6.5"/>
    <ellipse cx="74" cy="49" rx="6" ry="6"/>
    <ellipse cx="44" cy="80" rx="5.5" ry="5.5"/>
    <ellipse cx="58" cy="73" rx="5.5" ry="5.5"/>
  </g>
  <ellipse cx="50" cy="57" rx="17" ry="13" fill="#ffe0a3"/>
  <ellipse cx="31" cy="58" rx="6.5" ry="4.5" fill="#f79aa6" opacity="0.7"/>
  <ellipse cx="69" cy="58" rx="6.5" ry="4.5" fill="#f79aa6" opacity="0.7"/>
  <circle cx="39" cy="41" r="5.4" fill="#2b2b2b"/>
  <circle cx="61" cy="41" r="5.4" fill="#2b2b2b"/>
  <circle cx="37.3" cy="39" r="1.9" fill="#ffffff"/>
  <circle cx="59.3" cy="39" r="1.9" fill="#ffffff"/>
  <ellipse cx="44" cy="54" rx="2.4" ry="1.8" fill="#c98b32"/>
  <ellipse cx="56" cy="54" rx="2.4" ry="1.8" fill="#c98b32"/>
  <path d="M43 61 q7 6 14 0" fill="none" stroke="#c98b32"
        stroke-width="2.4" stroke-linecap="round"/>
"""),

    "svg:deve": ((4, 6, 92, 96), """
  <g fill="#e3a968">
    <rect x="36" y="72" width="11" height="24" rx="5.5"/>
    <rect x="52" y="74" width="11" height="22" rx="5.5"/>
    <rect x="70" y="72" width="11" height="24" rx="5.5"/>
  </g>
  <path d="M30 66 C30 40 46 38 49 60 C53 34 74 34 84 64 Z" fill="#e8b478"/>
  <ellipse cx="57" cy="66" rx="29" ry="19" fill="#e8b478"/>
  <path d="M34 64 q-10 -20 -8 -34" fill="none" stroke="#e8b478"
        stroke-width="17" stroke-linecap="round"/>
  <path d="M88 58 q8 4 4 14" fill="none" stroke="#d79857"
        stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="24" cy="25" rx="16" ry="13" fill="#f0c48c"/>
  <ellipse cx="12" cy="31" rx="10" ry="8" fill="#f8dcb4"/>
  <path d="M32 14 q5 -8 9 -1 q-3 5 -8 5 Z" fill="#d79857"/>
  <circle cx="9" cy="29" r="1.7" fill="#b9803f"/>
  <path d="M7 35 q6 4 11 -1" fill="none" stroke="#c0894a"
        stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="30" cy="32" rx="6" ry="4.5" fill="#f79aa6" opacity="0.6"/>
  <circle cx="25" cy="22" r="5" fill="#2b2b2b"/>
  <circle cx="23.4" cy="20.3" r="1.8" fill="#ffffff"/>
  <path d="M19 14 q3 -4 6 -2 M26 12 q3 -3 6 0" fill="none"
        stroke="#2b2b2b" stroke-width="1.8" stroke-linecap="round"/>
"""),

    "svg:civciv": ((10, 4, 90, 96), """
  <path d="M52 22 q-12 -6 -6 -14 q1 6 8 8 q-6 -9 2 -12
           q0 8 6 11 q4 5 -2 8 Z" fill="#f0a830"/>
  <ellipse cx="50" cy="56" rx="34" ry="35" fill="#ffd84d"/>
  <ellipse cx="19" cy="60" rx="10" ry="15" fill="#f7c948"
           transform="rotate(12 19 60)"/>
  <ellipse cx="81" cy="60" rx="10" ry="15" fill="#f7c948"
           transform="rotate(-12 81 60)"/>
  <g fill="#f5972e">
    <path d="M40 88 l-6 8 M40 88 l0 9 M40 88 l6 8" stroke="#f5972e"
          stroke-width="3.4" stroke-linecap="round" fill="none"/>
    <path d="M60 88 l-6 8 M60 88 l0 9 M60 88 l6 8" stroke="#f5972e"
          stroke-width="3.4" stroke-linecap="round" fill="none"/>
  </g>
  <ellipse cx="29" cy="66" rx="7.5" ry="5.5" fill="#f7929c" opacity="0.75"/>
  <ellipse cx="71" cy="66" rx="7.5" ry="5.5" fill="#f7929c" opacity="0.75"/>
  <circle cx="38" cy="50" r="6.4" fill="#2b2b2b"/>
  <circle cx="62" cy="50" r="6.4" fill="#2b2b2b"/>
  <circle cx="36" cy="47.6" r="2.3" fill="#ffffff"/>
  <circle cx="60" cy="47.6" r="2.3" fill="#ffffff"/>
  <path d="M42 62 L50 56 L58 62 L50 69 Z" fill="#f5972e"/>
  <path d="M42 62 L58 62" stroke="#dd7f1c" stroke-width="1.6"/>
"""),

    "svg:hamster": ((6, 6, 94, 92), """
  <circle cx="22" cy="24" r="14" fill="#e39a55"/>
  <circle cx="78" cy="24" r="14" fill="#e39a55"/>
  <circle cx="22" cy="25" r="8" fill="#f2a6b4"/>
  <circle cx="78" cy="25" r="8" fill="#f2a6b4"/>
  <ellipse cx="50" cy="52" rx="44" ry="39" fill="#f0ad67"/>
  <ellipse cx="50" cy="62" rx="33" ry="27" fill="#fbe3c6"/>
  <ellipse cx="50" cy="34" rx="22" ry="12" fill="#fbe3c6" opacity="0.55"/>
  <ellipse cx="17" cy="62" rx="8" ry="6" fill="#f5949f" opacity="0.8"/>
  <ellipse cx="83" cy="62" rx="8" ry="6" fill="#f5949f" opacity="0.8"/>
  <circle cx="34" cy="48" r="6.6" fill="#2b2b2b"/>
  <circle cx="66" cy="48" r="6.6" fill="#2b2b2b"/>
  <circle cx="31.8" cy="45.5" r="2.4" fill="#ffffff"/>
  <circle cx="63.8" cy="45.5" r="2.4" fill="#ffffff"/>
  <ellipse cx="50" cy="62" rx="5" ry="3.6" fill="#8a5a33"/>
  <path d="M50 66 q-7 8 -13 1 M50 66 q7 8 13 1" fill="none"
        stroke="#8a5a33" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M14 54 l-12 -4 M14 62 l-13 2 M86 54 l12 -4 M86 62 l13 2"
        fill="none" stroke="#d9a273" stroke-width="2" stroke-linecap="round"/>
"""),

    "svg:inek": ((4, 5, 96, 94), """
  <ellipse cx="14" cy="44" rx="14" ry="10" fill="#d8dade"
           transform="rotate(-18 14 44)"/>
  <ellipse cx="86" cy="44" rx="14" ry="10" fill="#d8dade"
           transform="rotate(18 86 44)"/>
  <path d="M26 20 q-8 -12 2 -14 q7 2 6 13 Z" fill="#e8d3a8"/>
  <path d="M74 20 q8 -12 -2 -14 q-7 2 -6 13 Z" fill="#e8d3a8"/>
  <ellipse cx="50" cy="50" rx="38" ry="34" fill="#f7f7f7"/>
  <path d="M24 30 q10 -10 20 -2 q-6 10 -20 9 Z" fill="#8f9398"/>
  <ellipse cx="74" cy="34" rx="12" ry="9" fill="#8f9398"
           transform="rotate(18 74 34)"/>
  <ellipse cx="50" cy="70" rx="26" ry="19" fill="#f7b9c4"/>
  <ellipse cx="40" cy="68" rx="4" ry="5" fill="#e08b9c"/>
  <ellipse cx="60" cy="68" rx="4" ry="5" fill="#e08b9c"/>
  <path d="M40 79 q10 7 20 0" fill="none" stroke="#e08b9c"
        stroke-width="2.6" stroke-linecap="round"/>
  <ellipse cx="20" cy="60" rx="7" ry="5" fill="#f5949f" opacity="0.7"/>
  <ellipse cx="80" cy="60" rx="7" ry="5" fill="#f5949f" opacity="0.7"/>
  <circle cx="35" cy="47" r="6.4" fill="#2b2b2b"/>
  <circle cx="65" cy="47" r="6.4" fill="#2b2b2b"/>
  <circle cx="32.8" cy="44.6" r="2.3" fill="#ffffff"/>
  <circle cx="62.8" cy="44.6" r="2.3" fill="#ffffff"/>
"""),

    "svg:tavsan": ((10, 2, 90, 94), """
  <ellipse cx="34" cy="26" rx="11" ry="24" fill="#eff0f4"
           transform="rotate(-9 34 26)"/>
  <ellipse cx="66" cy="26" rx="11" ry="24" fill="#eff0f4"
           transform="rotate(9 66 26)"/>
  <ellipse cx="34" cy="27" rx="6" ry="17" fill="#f7b3bd"
           transform="rotate(-9 34 27)"/>
  <ellipse cx="66" cy="27" rx="6" ry="17" fill="#f7b3bd"
           transform="rotate(9 66 27)"/>
  <ellipse cx="50" cy="63" rx="36" ry="31" fill="#f7f8fb"/>
  <ellipse cx="19" cy="70" rx="8" ry="6" fill="#f7949f" opacity="0.8"/>
  <ellipse cx="81" cy="70" rx="8" ry="6" fill="#f7949f" opacity="0.8"/>
  <circle cx="36" cy="58" r="6.6" fill="#2b2b2b"/>
  <circle cx="64" cy="58" r="6.6" fill="#2b2b2b"/>
  <circle cx="33.8" cy="55.5" r="2.4" fill="#ffffff"/>
  <circle cx="61.8" cy="55.5" r="2.4" fill="#ffffff"/>
  <path d="M45 70 L55 70 L50 76 Z" fill="#f38ba0"/>
  <path d="M50 76 q-7 8 -13 1 M50 76 q7 8 13 1" fill="none"
        stroke="#cf7c8c" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M16 64 l-13 -3 M16 72 l-13 3 M84 64 l13 -3 M84 72 l13 3"
        fill="none" stroke="#cfd3dc" stroke-width="2" stroke-linecap="round"/>
"""),

    # Jandarma: polis mavisi yerine haki üniforma ve kırmızı-sarı arma.
    "svg:ugurbocegi": ((14, 8, 86, 94), """
  <path d="M50 22 q-11 -5 -14 -11 M50 22 q11 -5 14 -11" fill="none"
        stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
  <circle cx="34" cy="9" r="4.5" fill="#2b2b2b"/>
  <circle cx="66" cy="9" r="4.5" fill="#2b2b2b"/>
  <circle cx="50" cy="58" r="36" fill="#e0443a"/>
  <g fill="#2b2b2b">
    <circle cx="28" cy="63" r="7.5"/><circle cx="72" cy="63" r="7.5"/>
    <circle cx="37" cy="83" r="6"/><circle cx="63" cy="83" r="6"/>
  </g>
  <path d="M50 24 q-1 0 -1 68" stroke="#a82a22" stroke-width="2.4" fill="none"/>
  <path d="M50 55 a27 27 0 0 1 -27 -27 a27 27 0 0 1 54 0 a27 27 0 0 1 -27 27 Z"
        fill="#2b2b2b"/>
  <ellipse cx="28" cy="36" rx="6.5" ry="4.5" fill="#f5949f" opacity="0.75"/>
  <ellipse cx="72" cy="36" rx="6.5" ry="4.5" fill="#f5949f" opacity="0.75"/>
  <circle cx="39" cy="28" r="7" fill="#ffffff"/>
  <circle cx="61" cy="28" r="7" fill="#ffffff"/>
  <circle cx="40" cy="29" r="3.6" fill="#2b2b2b"/>
  <circle cx="62" cy="29" r="3.6" fill="#2b2b2b"/>
  <path d="M43 40 q7 6 14 0" fill="none" stroke="#ffffff"
        stroke-width="2.6" stroke-linecap="round"/>
"""),

    "svg:jandarma": ((14, 16, 86, 96), """
  <circle cx="50" cy="46" r="27" fill="#f7c77a"/>
  <path d="M18 96 q2 -24 32 -24 q30 0 32 24 Z" fill="#6e7a4f"/>
  <path d="M38 73 q12 12 24 0 l6 3 -18 12 -18 -12 Z" fill="#8b9668"/>
  <path d="M50 72 l-6 6 6 6 6 -6 Z" fill="#c0392b"/>
  <path d="M20 30 q30 -20 60 0 q2 6 -4 6 l-52 0 q-6 0 -4 -6 Z"
        fill="#5f6b45"/>
  <path d="M14 36 q36 -8 72 0 q2 7 -6 7 l-60 0 q-8 0 -6 -7 Z"
        fill="#4b553a"/>
  <rect x="30" y="26" width="40" height="9" rx="4" fill="#c0392b"/>
  <circle cx="50" cy="24" r="7.5" fill="#c0392b"/>
  <path d="M52 19.5 a5 5 0 1 0 0 9 a4 4 0 1 1 0 -9 Z" fill="#ffffff"/>
  <path d="M56.5 21.4 l.8 1.9 2 .2 -1.5 1.4 .4 2 -1.7 -1 -1.7 1
           .4 -2 -1.5 -1.4 2 -.2 Z" fill="#ffffff"/>
  <ellipse cx="33" cy="56" rx="6.5" ry="4.5" fill="#f2918f" opacity="0.6"/>
  <ellipse cx="67" cy="56" rx="6.5" ry="4.5" fill="#f2918f" opacity="0.6"/>
  <circle cx="40" cy="49" r="4.8" fill="#2b2b2b"/>
  <circle cx="60" cy="49" r="4.8" fill="#2b2b2b"/>
  <circle cx="38.4" cy="47.3" r="1.7" fill="#ffffff"/>
  <circle cx="58.4" cy="47.3" r="1.7" fill="#ffffff"/>
  <path d="M43 60 q7 6 14 0" fill="none" stroke="#b9763c"
        stroke-width="2.6" stroke-linecap="round"/>
"""),
}

# --- Flama geometrisi (mm) ---
W, H, TIP = 92.0, 128.0, 30.0   # SVG birim: flama oranı
CARD_W, CARD_H = 138.0, 192.0    # baskı boyutu (mm) - sayfa başına 2 flama
SW = 1.4                        # çizgi kalınlığı


def picture(emoji: str, band_bottom: float) -> str:
    """Kartın görseli: emoji glifi ya da elle çizilmiş SVG."""
    if emoji in CUSTOM:
        (x0, y0, x1, y1), art = CUSTOM[emoji]
        # Emoji glifleriyle aynı kutuya oturt: üst kenar şeridin hemen altı,
        # yükseklik 60 birim, genişlik en fazla 68 birim.
        k = min(60.0 / (y1 - y0), 68.0 / (x1 - x0))
        tx = W / 2 - (x0 + x1) / 2 * k
        ty = band_bottom + 1.0 - y0 * k
        return (f'<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.4f})">'
                f'{art}</g>')
    return (f'<text class="pic" x="{W / 2}" y="{band_bottom + 54}" '
            f'text-anchor="middle">{emoji}</text>')


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
  {picture(emoji, band_y + band_h)}
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
