# Goethe A2 Trainer (v3.0.0)

Goethe-Zertifikat A2 sınavına hazırlık için **çevrimdışı çalışan** Android uygulaması. Orijinal Google AI Studio projesinin spesifikasyonu (`docs/ORIGINAL_SPEC.md`) ve Goethe A2 kelime listesi (`data/goethe_a2_wortliste_turkce.json`) temel alınarak yeniden yazıldı ve geliştirildi.

## Kurulum

| Dosya | Ne için |
|---|---|
| `release/GoetheA2Trainer.apk` | Android 6.0+ telefonlara doğrudan kurulum |
| `release/GoetheA2Trainer.html` | Tek dosyalık web sürümü: herhangi bir tarayıcıda (iPhone dahil) açılır, internet gerekmez |

APK kurulumu: dosyayı telefona at → aç → "Bilinmeyen kaynaklardan yüklemeye izin ver" → Yükle. Uygulama Play Store'dan gelmediği için Play Protect bir uyarı gösterebilir; "Yine de yükle" seçilebilir.

## Modüller

- **Kelime müfredatı:** 1.349 kelime (1.171 alfabetik + tematik gruplar). Arama (Almanca/Türkçe), 14 tema, kelime türü, hâkimiyet durumu (Yeni / Öğreniliyor / Zayıf / Öğrenildi), yer imleri. Artikel renkleri (der/die/das), çoğul, Perfekt formları, sesli okuma, mikro quiz, kişisel not ve AI hafıza çengeli. Kendi kelimeni tek tek veya toplu ekleyebilirsin.
- **Kelime kartları:** 3B çevirme, Leitner aralıklı tekrar (1-2-4-8-16-32 gün), Almanca→Türkçe veya Türkçe→Almanca, günlük tekrar / tema / artikel / fiil / zayıf kelime / yer imi desteleri.
- **Sınav motoru (çevrimdışı):** ~190 elle yazılmış soru (gerçek öğrenci hatalarıyla Fehleranalyse, Kasus & Präpositionen, Konnektoren, Perfekt, Präteritum, Komparativ, sıfat çekimi, günlük diyaloglar, okuma, Satzbau) ve kelime listesinden otomatik üretilen binlerce soru (anlam, artikel, çoğul, Perfekt, bağlamda boşluk doldurma). Karma sınav Goethe dağılımını izler. Anında geri bildirim veya gerçek sınav modu, süre ölçer, tuzak analizi.
- **Hata hafızası:** Yanlış yapılan sorular ve kurallar kaydedilir, hata oranı hesaplanır ve sonraki sınavlarda öncelik verilir. Bir soru art arda 2 kez doğru yapılınca hata defterinden çıkar.
- **Detaylı rapor:** Kategori karnesi, CEFR teşhisi, güçlü/zayıf yönler, kişisel tavsiyeler, filtrelenebilir soru incelemesi, yanlış kelimeleri çalışma kağıdına aktarma.
- **Yazma (Schreiben):** 10 resmî formatta görev (Teil 1: SMS 20–30 kelime, Teil 2: e-posta 30–40 kelime), kelime sayacı, çevrimdışı kontrol listesi (hitap/kapanış, du/Sie tutarlılığı, bağlaç çeşitliliği, yan cümle fiil sırası), örnek cevap ve Redemittel. AI ile 4 Goethe kriterine göre 20 puan üzerinden değerlendirme.
- **Günlük çalışma kağıdı:** 5 bölüm (Wortschatz & Artikel, Lückentext, Übersetzung, Satzbau, 180–250 kelimelik Lesetext). Daktilo görünümü, A4 yazdırma / PDF kaydetme; cevap anahtarı yazdırılmaz.
- **Ayarlar:** Sınav tarihi geri sayımı, günlük hedef, koyu tema, TTS hızı, JSON yedekleme (birleştirme destekli), sıfırlama.

## Yapay zeka (isteğe bağlı)

Uygulama API anahtarı olmadan tamamen çalışır. Ayarlar'a bir **Google Gemini API anahtarı** girilirse AI sınav üretimi, yazma puanlaması, kural detaylandırma, AI çalışma kağıdı ve hafıza çengelleri açılır. Varsayılan model `gemini-2.5-flash`; Google model adını değiştirirse Ayarlar'dan güncellenebilir.

## Orijinal projeye göre değişiklikler

- Uygulama tamamen yerel ve çevrimdışı çalışıyor; sunucu (Express) gerekmiyor.
- **Firebase bulut senkronizasyonu kaldırıldı**, yerine dosya tabanlı yedek + akıllı birleştirme geldi. Firebase, proje ayarları ve hesap gerektirdiği için tek başına çalışan bir APK'ya uygun değildi.
- Seslendirme Android'in kendi TTS motoruyla yapılıyor (WebView'de Web Speech API güvenilir çalışmadığı için). Ses gelmezse: Ayarlar → Seslendirme → "Ses paketini yükle".
- Leitner aralıklı tekrar, günlük hedef/seri, sınav geri sayımı, koyu tema, kendi kelimeni ekleme, kural bazlı hata istatistikleri eklendi.
- Yazma görevlerinde kelime aralıkları resmî Goethe A2 formatına göre düzeltildi (Teil 1: 20–30, Teil 2: 30–40).
- Karma sınava %10 bağlamda kelime soruları eklendi (hata avı %25, kasus %20, gramer %20, diyalog %15, okuma/satzbau %10, kelime %10).

## Geliştirme

```bash
# Web arayüzü
cd web && npm install && npm run build      # dist/index.html (tek dosya)
npx tsx tests/validate.ts                   # soru bankası doğrulaması

# Kelime verisini yeniden üretmek için
python3 scripts/prepare_words.py

# APK (Ubuntu): sudo apt install android-sdk-platform-23 aapt apksigner zipalign dalvik-exchange
./build_apk.sh                              # release/GoetheA2Trainer.apk
```

APK, Gradle/Android Studio olmadan `aapt2 + javac + dx + apksigner` ile derlenir (`build_apk.sh`). Android tarafı (`android/`) tek bir WebView aktivitesi ve TTS, HTTP, dosya kaydetme, yazdırma ve paylaşım için bir JavaScript köprüsünden oluşur.

İmza anahtarı `android/keystore/release.jks` dosyasındadır (şifre `build_apk.sh` içinde). Sonraki sürümlerin eski kurulumun üzerine güncellenebilmesi için aynı anahtarla imzalanması gerekir; bu dosyayı silmeyin.
