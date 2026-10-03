# İçerik güncellemeleri (`content.json`)

Uygulama açılışta, internet geldiğinde ve 6 saatte bir bu dosyayı okur:
`https://raw.githubusercontent.com/sabnmali/WeighTracker/main/goethe-a2/content/content.json`
(bulunamazsa `ccr-ec1b1133-dmzxke` dalındaki kopya). Ayarlar → İçerik güncellemeleri → Gelişmiş bölümünden başka bir adres girilebilir.

Yeni içerik eklemek için dosyayı düzenle ve **`contentVersion` değerini 1 artır**. Cihazlar yeni sürümü indirip saklar; internet olmasa da kullanır.

| Alan | Açıklama |
|---|---|
| `words` | Yeni kelimeler veya mevcut bir kelimenin düzeltmesi (aynı `id`). Biçim `web/src/data/words.json` ile aynı. |
| `questions` | Yeni sorular. `category`: error_detection, prepositions_kasus, grammar, dialogue, reading, sentence_syntax, vocabulary. `correctAnswer` şıklardan biriyle birebir aynı olmalı; `sentence_build` için `sentenceParts` doğru sırada. |
| `longTexts` | Okuma metinleri (`web/src/data/readingTexts.ts` içindeki `LongText` biçimi). Çalışma kağıdı ve sınavda kullanılır. |
| `writingTasks` | Yazma görevleri (`WritingTask` biçimi). |
| `removeQuestionIds` / `removeWordIds` | Hatalı bulunan soru veya kelimeleri devre dışı bırakır. |
| `app` | `latestVersion` uygulama sürümünden büyükse kullanıcıya „Yeni sürüm“ bildirimi ve `apkUrl` indirme düğmesi gösterilir. |

Geçersiz kayıtlar (ör. doğru cevabı şıklarda olmayan soru) uygulama tarafından sessizce atlanır.
