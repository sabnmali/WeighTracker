# GOETHE-ZERTIFIKAT A2 MASTER UYGULAMA MİMARİSİ VE SİSTEM PROMPTU
> **Versiyon:** 2.4.0 (Full-Stack A2/B1 Sınav ve Öğrenim Ekosistemi)  
> **Hedef Kitle:** Goethe-Institut A2 Almanca sınavına hazırlanan öğrenciler, mühendisler ve dil öğrenicileri.  
> **Teknoloji Yığını:** React 19 + TypeScript + Vite + Tailwind CSS + Express (Node.js) + Firebase Firestore + Google Gemini AI.

---

## 1. UYGULAMANIN TEMEL VİZYONU VE PEDAGOJİK MANTIĞI

Bu uygulama, klasik ezber yöntemlerini ortadan kaldıran, resmi **Goethe-Zertifikat A2** sınav müfredatına (1.171+ resmi kelime havuzu) dayalı; hata hafızası, çok boyutlu sınav analizleri, otantik sınav tipi yazma değerlendirmesi ve daktilo formatında basılabilir çalışma kağıtları sunan **bütüncül bir Almanca sınav hazırlık platformudur**.

### Temel Pedagojik İlkeler:
1. **Soru Çeşitliliği & Anti-Monotoni:** Karma testler asla yalnızca tekil kelime veya basit artikel (`der/die/das`) sormaz. Sınavlar; hata avlama (*Fehleranalyse*), yönelme/durum edatları (*Wechselpräpositionen*), bağlaçlar (*weil, dass, obwohl, wenn, deshalb, trotzdem*), zamanlar (*Perfekt mit haben/sein, Modalverben im Präteritum*) ve gündelik diyalogları harmanlar.
2. **Gerçekçi Öğrenci Hataları (Real Learner Traps):** Hata tespiti sorularında rastgele anlamsız şıklar yerine, A2/B1 düzeyinde öğrencilerin gerçekten yaptığı tipik hatalar kullanılır (Örn: `*Ich habe nach Köln gefahren*`, `*..., weil er hat keine Zeit*`, `*Ich warte für den Bus*`, `*mit die Straßenbahn*`).
3. **Akıllı Hata Hafızası (Error Memory & Tracking):** Öğrencinin yanlış cevapladığı kelime ve kurallar anında kayıt altına alınır, hata oranı (%0-100) hesaplanır ve sonraki testlerde bu kelimelere otomatik öncelik verilir.
4. **Resmi CEFR Değerlendirme Kriterleri:** Sınav ve yazma modüllerinde Goethe Enstitüsü'nün resmi puanlama rubrikleri (Erfüllung der Aufgabenstellung, Kohärenz, Wortschatz, Formale Richtigkeit) uygulanır.

---

## 2. MODÜLLER VE DETAYLI İŞLEVLERİ

### 2.1. Müfredat Tarayıcısı (Curriculum Browser)
* **Kelime Havuzu:** Goethe A2 temel kelime listesi, genişletilmiş A2 listesi, tematik gruplar ve kullanıcı tarafından içe aktarılan kelimeler (toplam 1.500+ kelime).
* **Filtreleme & Arama:**
  * 12 resmi Goethe teması (Wohnen, Arbeit & Beruf, Gesundheit, Reisen & Verkehr vb.).
  * Seviyeye göre (A2.1, A2.2, A2, B1-Prep).
  * Hakimiyet durumuna göre (Yeni, Öğreniliyor, Zayıf/Hatalı, Öğrenildi).
  * Yer imleri (Bookmarks) filtresi.
* **Seslendirme (TTS):** Web Speech API tabanlı yüksek kaliteli Almanca telaffuz.
* **Hızlı Değerlendirme Modalı:** Kelimenin artikeli, anlamı ve örnek cümleleri üzerinden mikro quiz.

### 2.2. Sınav & Test Motoru (Exam & Testing Engine)
Uygulama, hem sunucu/istemci taraflı **Gemini AI** ile canlı soru üretebilir hem de çevrimdışı/yedek çalışan **zenginleştirilmiş yerel müfredat motoruna** sahiptir.

#### Soru Türleri & Kategorileri:
1. **🔍 Fehleranalyse (Hata Tespiti & Ayıklama):** Gerçek hatalı yapıların tespit edildiği zorlayıcı sorular.
2. **📍 Kasus & Edat Hakimiyeti:** *wo (Dativ)* vs *wohin (Akkusativ)*, *mit + Dativ*, *für + Akkusativ*, fiil edatları (*warten auf, sich freuen auf/über, träumen von*).
3. **⚙️ Gramer & Konnektörler:** Yan cümleler (*weil, dass, obwohl, wenn*), devrik cümle bağlaçları (*deshalb, trotzdem*), *Perfekt* yardımcı fiil ayrımı (*haben vs. sein*), *Modalverben im Präteritum*.
4. **💬 Alltagsdialog & Situasyon:** Doktor, tren istasyonu, lokanta, ev kiralama gibi otantik Goethe A2 diyalogları.
5. **🧱 Satzbau & Inversion:** Etkileşimli sözcük sürükleme/tıklama ile cümle dizilimi; zaman zarfıyla başlandığında fiilin 2. sırada kalması kuralı.
6. **📖 Leseverstehen:** Otantik duyuru, ilan ve e-posta okuma parçaları.

#### Sınav Sırasında ve Sonrasında:
* **Canlı Süreölçer & Sesli Okuma:** Soru metnini ve okuma parçalarını seslendirme.
* **Anlık Açıklama & Tuzak Analizi:** Her sorunun altında doğru cevap, gramer kuralı (`targetRule`) ve öğrenciyi yanıltabilecek tuzak analizi (`errorTrap`).
* **AI Kural Detaylandırma:** Gemini API ile sorunun gramer kuralını derinlemesine açıklatma.

#### Detaylı Değerlendirme Raporu (Test Results Modal):
* **Çok Boyutlu Kriter Karnesi:** Ölçülen tüm kategoriler için başarı yüzdesi, doğru/yanlış dağılımı ve yetkinlik durumu (*Mükemmel, İyi, Geliştirilmeli, Kritik Tekrar Gerekli*).
* **CEFR A2 Yetkinlik Teşhisi:** Yüzdeye göre detaylı seviye rozeti (Örn: *Goethe A2.2+ Üstün Yetkinlik - B1 Hazırlığa Uygun*).
* **Güçlü ve Zayıf Yönler Analizi:** Hangi dilbilgisi kalıplarında başarı sağlandığı ve hangi tuzaklara düşüldüğü.
* **Kişiselleştirilmiş Çalışma Tavsiyeleri:** Sınav performansına özel 2-3 somut aksiyon adımı.
* **Akıllı Filtreleme:** Soru listesini *Tümü*, *Sadece Yanlışlar*, *Gramer & Kasus* ve *Hata Avlama* olarak inceleme.
* **Daktilo Kağıdına Aktarma:** Yanlış yapılan kelimeleri tek tıkla Günlük Çalışma Kağıdına aktarma.

### 2.3. Goethe A2 Yazma Modülü (Schreiben Teil 1 & Teil 2)
* **Resmi Senaryolar:**
  * **Teil 1:** SMS veya iş arkadaşına/yöneticiye kısa not (min. 30 kelime, 3 yönlendirici madde).
  * **Teil 2:** Resmi/yarı-resmi e-posta veya davet mektubu (min. 40 kelime, 3 yönlendirici madde).
* **Yapay Zeka Değerlendirici (AI Writing Evaluator):**
  * Toplam 20 puan üzerinden 4 Goethe kriterine göre puanlama:
    1. *Aufgabenerfüllung* (Görev Tamamlama - 5 puan)
    2. *Kohärenz & Textaufbau* (Bağlantı ve Metin Düzeni - 5 puan)
    3. *Wortschatz* (Kelime Dağarcığı ve Uygunluk - 5 puan)
    4. *Formale Richtigkeit* (Gramer ve Yazım Kuralları - 5 puan)
  * **Düzeltilmiş Metin:** Öğrencinin yazdığı metnin hatasız, akıcı A2 Almanca versiyonu.
  * **Hata Tablosu:** Hatalı ifade, doğru Almancası ve Türkçe gramer gerekçesi.
  * **Önerilen Kelimeler:** Konuyla ilgili kullanılabilir 5 resmi Goethe A2 kelimesi.

### 2.4. Günlük Daktilo Çalışma Kağıdı (Tagesarbeitsblatt)
Öğrencinin ekrandan kopup kağıt üzerinde daktilo estetiğinde pratik yapmasını sağlayan, A4 baskı ve PDF formatına tam uyumlu modül.

#### 5 Pedagojik Bölüm Kuralı:
1. **Bölüm 1 - Kelime ve Artikeller (Wortschatz und Artikel):**
   * 15 kelime sıralanır. İsimlerin başında artikel **KESİNLİKLE YAZILMAZ**, yerine `[ ]` kutucuğu bırakılır (Örn: `<li>1. [ ] Teppich, -e = __________________</li>`).
2. **Bölüm 2 - Boşluk Doldurma (Lückentext):**
   * Başlıkta verilen kelime havuzu ile cümlelerdeki boşluklar birebir eşleşir. Cümle içinde ipucu veya cevap verilmez.
3. **Bölüm 3 - Cümle Çevirisi (Übersetzung):**
   * Günün kelimelerini içeren otantik A2 cümlelerinin Türkçeye çevirisi.
4. **Bölüm 4 - Cümle Kurma ve Pekiştirme (Satzbau & Anwendung):**
   * Özgün cümle kurma, zıt anlam ve günlük durum yönergeleri. Mantık hatası içermez (Örn: `hässlich` zıttı `schön`dür, `hell` değil).
5. **Bölüm 5 - Metin Okuma, Sindirme ve Kalıp Pekiştirme (Lesetext & Vertiefung):**
   * E-posta, diyalog, duyuru veya blog formatında 180-250 kelimelik akıcı okuma metni ve metne bağlı anlama soruları.
* **Cevap Anahtarı:** Sayfanın altına yalnızca modülde görünecek ve kağıda basılmayacak gizlenebilir çözüm anahtarı.

### 2.5. Kelime Kartları (Flashcards)
* 3D kart çevirme animasyonu, sesli telaffuz ve örnek cümleler.
* "Biliyorum" / "Tekrar Et" değerlendirmesi ile kelime hafızasına doğrudan veri aktarımı.

### 2.6. Kelime Ekleme & Akıllı Öneri Merkezi
* Kullanıcının kendi kelimelerini veya dış kaynaklı kelime paketlerini içe aktarması.
* Müfredat dışı kelimeler için yapay zeka hafıza çengelleri (*memory hooks*) ve öğrenme tavsiyeleri.

### 2.7. Çapraz Cihaz Bulut Eşitleme (Cloud Sync Architecture)
* **Firebase Firestore Entegrasyonu:**
  * Çift yönlü akıllı birleştirme (*two-way merge*): Yerel hafıza ile bulut hafızası birleştirilir; hiçbir cihazdaki ilerleme silinmez.
  * **Yarış Durumu Koruması (Race Condition Guard):** Yeni bir tarayıcı açıldığında boş yerel durumun buluttaki veriyi ezmesini engelleyen `isInitialCloudSyncedRef` kontrolü.
  * **Canlı Dinleyici & Kalp Atışı:** `visibilitychange` ve 12 saniyelik arka plan kontrolü ile açık sekmeler arasında anlık senkronizasyon.
  * **Manuel Yedekleme:** JSON formatında dışa aktarma (Export) ve içe aktarma (Import).
  * **API Key Senkronizasyonu:** Kullanıcının girdiği Gemini API anahtarının cihazlar arasında taşınabilmesi.

---

## 3. MASTER SİSTEM PROMPTU (TÜM MANTIĞI İÇEREN TEMEL PROMPT)

Aşağıdaki prompt, bu uygulamanın tüm soru üretim, yazma değerlendirme ve içerik mantığını birebir inşa eden **ana sistem direktifidir**. Başka bir yapay zeka oturumunda veya backend servisinde uygulamanın tüm yeteneklerini yeniden canlandırmak için kullanılabilir:

```markdown
# SYSTEM PROMPT: GOETHE-ZERTIFIKAT A2 EXAMINATION & PEDAGOGICAL ENGINE

You are the Lead Examination Author and Chief Pedagogical Officer for official Goethe-Institut A2/A2+ certification. Your role is to generate rigorous, intellectually stimulating, authentic, and diverse examination materials, writing evaluations, and typewriter engineering worksheets in German and Turkish.

---

### CORE PRINCIPLES & ANTI-MONOTONY MANDATE:
1. NEVER produce monotonous questions that only ask for noun articles (der/die/das) or simple one-to-one word translations.
2. For any "mixed" (Karma) examination, you MUST strictly distribute questions across these distinct categories:
   - Fehleranalyse (Error Spotting / Error Correction): 25-30%
   - Kasus & Präpositionen (Cases & Prepositions): 20-25%
   - Grammatik & Konnektoren (Grammar & Connectors): 20-25%
   - Situationsdialoge & Alltagsverständnis (Situational Dialogues): 15-20%
   - Leseverstehen & Satzbau (Reading & Syntax): 10-15%

---

### REALISTIC GERMAN LEARNER ERRORS (FEHLERANALYSE RULES):
When generating error-spotting questions ("Welcher Satz ist grammatisch falsch / fehlerhaft?" or "In welchem Satz ist ein typischer Fehler?"), you MUST use REAL, AUTHENTIC errors commonly made by A2/B1 learners:
- Wrong Auxiliary in Perfekt (Movement verbs):
  * WRONG: "Ich habe gestern nach München gefahren."
  * CORRECT: "Ich bin gestern nach München gefahren."
- Wrong Word Order in Subordinate Clauses (Nebensatz):
  * WRONG: "...weil er hat heute hohes Fieber."
  * CORRECT: "...weil er heute hohes Fieber hat."
- English-Influenced Preposition Errors:
  * WRONG: "Ich warte für den Bus."
  * CORRECT: "Ich warte auf den Bus."
- Wrong Dativ Case after Dativ Prepositions:
  * WRONG: "Er fährt jeden Tag mit die Straßenbahn."
  * CORRECT: "Er fährt jeden Tag mit der Straßenbahn."
- Direction vs. Location Confusion (Wechselpräpositionen):
  * WRONG: "Ich lege das Buch auf dem Tisch." (wohin? -> Akkusativ)
  * CORRECT: "Ich lege das Buch auf den Tisch."
- Separable Verb Syntax Errors:
  * WRONG: "Er anruft seine Kollegin jeden Abend."
  * CORRECT: "Er ruft seine Kollegin jeden Abend an."
- Double Conjunctions:
  * WRONG: "Obwohl es regnet, aber wir gehen spazieren."
  * CORRECT: "Obwohl es regnet, gehen wir spazieren."

---

### QUESTION OUTPUT SCHEMA (JSON FORMAT):
Whenever generating an exam, respond ONLY with a valid JSON object matching this schema:
{
  "title": "Goethe A2 Prüfung - [Theme]",
  "theme": "[Theme Name]",
  "level": "A2" | "A2.1" | "A2.2" | "A2+",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "cloze" | "reading" | "sentence_build" | "error_correction" | "dialogue_completion",
      "category": "error_detection" | "prepositions_kasus" | "grammar" | "vocabulary" | "reading" | "sentence_syntax",
      "difficulty": "A2.1" | "A2.2" | "A2+" | "B1-Prep",
      "readingText": "Short authentic reading snippet or null",
      "question": "Question prompt in German",
      "questionTr": "Turkish translation of the prompt for student clarity",
      "options": ["Option A", "Option B", "Option C"],
      "correctAnswer": "Exact string of correct option",
      "explanation": "Clear, encouraging, detailed explanation in Turkish explaining the grammar rule and why the trap is wrong.",
      "targetWord": "Target Goethe A2 vocabulary item or collocation",
      "errorTrap": "Explicit explanation in Turkish of the common trap tested",
      "targetRule": "German grammar rule tested (e.g., 'Wechselpräpositionen: wohin -> Akk')",
      "isErrorPriority": boolean
    }
  ]
}

---

### WRITING EVALUATION RULES (GOETHE A2 SCHREIBEN):
Evaluate student German texts strictly against official Goethe criteria:
1. Erfüllung der Aufgabenstellung (Task Completion / All 3 bullets addressed): Max 5 points
2. Kohärenz & Textaufbau (Coherence, connectives, greetings & closings): Max 5 points
3. Wortschatz (Vocabulary range & situational appropriateness): Max 5 points
4. Formale Richtigkeit (Grammar, case endings, verb positions, spelling): Max 5 points
Pass threshold is 60% (12 / 20 points). All feedback, corrections, and actionable tips must be written in supportive, constructive TURKISH.

---

### TAGESARBEITSBLATT (A4 TYPEWRITER ENGINEERING SHEET) RULES:
Generate pure HTML format (<h2>, <h3>, <p>, <ul>, <li>, <br> only, no Markdown code blocks):
1. Section 1 (Wortschatz & Artikel): 15 words. For nouns, NEVER reveal the article! Always use empty square brackets: "[ ] Nomen, Plural = __________________".
2. Section 2 (Lückentext): The word bank in the header must match the sentence blanks exactly. Do not leak translations.
3. Section 3 (Übersetzung): Authentic, rich sentences for Turkish translation.
4. Section 4 (Satzbau & Anwendung): Logical prompts (never state that 'hässlich' is the opposite of 'hell').
5. Section 5 (Lesetext & Vertiefung): Fluent, engaging 180-250 word text (never start with "Gestern...").
6. Answer Key: Encapsulated strictly between `<!-- CEVAP_ANAHTARI_START -->` and `<!-- CEVAP_ANAHTARI_END -->` for teacher review.
```

---

## 4. VERİ YAPILARI VE TİP TANIMLARI (`types.ts`)

```typescript
export type WordType =
  | 'Nomen'
  | 'Verb'
  | 'Adjektiv'
  | 'Präposition'
  | 'Konnektor'
  | 'Adverb'
  | 'Redewendung'
  | 'Pronomen'
  | 'Andere';

export type WordLevel = 'A2.1' | 'A2.2' | 'A2' | 'B1' | 'B1-Prep';

export type QuestionType =
  | 'multiple_choice'
  | 'cloze'
  | 'reading'
  | 'sentence_build'
  | 'error_correction'
  | 'dialogue_completion';

export type QuestionCategory =
  | 'grammar'
  | 'prepositions_kasus'
  | 'vocabulary'
  | 'error_detection'
  | 'reading'
  | 'sentence_syntax';

export interface Question {
  id: string;
  type: QuestionType;
  category?: QuestionCategory;
  difficulty?: 'A2.1' | 'A2.2' | 'A2+' | 'B1-Prep';
  readingText?: string;
  question: string;
  questionTr?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  targetWord?: string;
  errorTrap?: string;
  targetRule?: string;
  sentenceParts?: string[];
  isErrorPriority?: boolean;
  errorRateContext?: number;
}

export interface CategoryScore {
  name: string;
  category: QuestionCategory;
  correct: number;
  total: number;
  percentage: number;
  ratingLabel: string;
}

export interface DetailedEvaluation {
  cefrLevel: string;
  cefrStatusBadge: string;
  overallAssessmentTr: string;
  categoryBreakdown: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  actionableTips: string[];
}

export interface TestSummary {
  id: string;
  title: string;
  theme: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  records: UserAnswerRecord[];
  evaluation?: DetailedEvaluation;
}
```

---

## 5. ÖZET VE GELİŞTİRİCİ NOTLARI

Bu mimari; tek yönlü kelime ezberi yerine **dil edinimini (Language Acquisition)**, **hata farkındalığını (Error Awareness)** ve **sınav psikolojisine aşinalığı** merkezine alır. Projede yapılan tüm geliştirmeler, yukarıda belgelenen pedagojik kurallar ve veri modelleriyle tam uyumlu kalmalıdır.
