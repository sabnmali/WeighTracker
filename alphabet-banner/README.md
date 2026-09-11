# Alfabe Flamaları (yazdırılabilir)

Fotoğraftaki flama kartının (lila şerit + kahverengi konturlu harf + görsel)
Türkçe alfabenin 29 harfi için yeniden üretilmiş hâli.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `alfabe-flama-tr.pdf` | Türkçe A–Z, 29 harf (Ç Ğ İ Ö Ş Ü dâhil), 15 sayfa |
| `alfabe-flama-tr.html` | Aynı içeriğin tarayıcıdan yazdırılabilir hâli (fontlar gömülü) |
| `onizleme.png` | Tüm kartların tek sayfalık önizlemesi |
| `generate.py` | Üreteç betiği |
| `NotoColorEmoji-subset.woff2` | Vektör renkli emoji fontu (sadece kullanılan karakterler) |

## Yazdırma

1. PDF'i aç → Yazdır.
2. Kağıt: **A4 YATAY (landscape)**, ölçek: **%100 / "gerçek boyut"** (Sayfaya sığdır **kapalı**).
3. Kenar boşlukları: yok/minimum. Renkli baskı açık.

Her sayfada 2 flama var; flama boyutu **13,8 × 19,2 cm**.
Görseller vektör (COLRv1) emoji fontundan geliyor; hangi boyutta basılırsa
basılsın pikselleşmez.
Kahverengi kontur aynı zamanda kesme çizgisidir.
Üstteki iki soluk kesikli daire, ip geçirmek için delgeç noktalarıdır (baskıda
neredeyse görünmez).

## Yeniden üretme

```bash
python3 generate.py                      # HTML üretir
chrome --headless --print-to-pdf=out.pdf file://.../alfabe-flama-tr.html
```

Harf–görsel eşleşmelerini değiştirmek için `generate.py` içindeki `TR`
listesini düzenlemek yeterli.

## Harf–görsel listesi

|  |  |  |  |  |
|---|---|---|---|---|
| **A** armut | **B** balon | **C** civciv | **Ç** çilek | **D** deve |
| **E** el | **F** fil | **G** gül | **Ğ** dağ | **H** horoz |
| **I** ışık | **İ** inek | **J** jandarma | **K** kedi | **L** limon |
| **M** muz | **N** nar | **O** otobüs | **Ö** ördek | **P** portakal |
| **R** robot | **S** süt | **Ş** şemsiye | **T** tavşan | **U** uğur böceği |
| **Ü** üzüm | **V** valiz | **Y** yıldız | **Z** zürafa |

Kartların 11 tanesi elle çizilmiş SVG'dir (`generate.py` içindeki
`CUSTOM`): hayvanların çoğu, jandarma ve nar. Emoji setinde ya karşılığı yok
(nar) ya da çizimleri yeterince sevimli değildi. Ğ ile başlayan kelime olmadığından o kart
"dağ" görseliyle temsil edilir.
