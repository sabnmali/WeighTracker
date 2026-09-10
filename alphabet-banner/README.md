# Alfabe Flamaları (yazdırılabilir)

Fotoğraftaki flama kartının (lila şerit + kahverengi konturlu harf + görsel)
A'dan Z'ye tüm harfler için yeniden üretilmiş hâli.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `alphabet-banner-en.pdf` | İngilizce A–Z, 26 flama, 13 sayfa |
| `alfabe-flama-tr.pdf` | Türkçe A–Z, 29 harf (Ç Ğ İ Ö Ş Ü dâhil), 15 sayfa |
| `*.html` | Aynı içeriğin tarayıcıdan yazdırılabilir hâli (font gömülü) |
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
chrome --headless --print-to-pdf=out.pdf file://.../alphabet-banner-en.html
```

Harf–görsel eşleşmelerini değiştirmek için `generate.py` içindeki `EN` / `TR`
listelerini düzenlemek yeterli.
