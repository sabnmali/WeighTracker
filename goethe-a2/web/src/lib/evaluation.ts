import type { CategoryScore, DetailedEvaluation, QuestionCategory, UserAnswerRecord } from '../types';
import { CATEGORY_TR } from './exam';

export function ratingLabel(pct: number): string {
  if (pct >= 85) return 'Mükemmel';
  if (pct >= 70) return 'İyi';
  if (pct >= 50) return 'Geliştirilmeli';
  return 'Kritik Tekrar Gerekli';
}

export function cefr(pct: number): { level: string; badge: string } {
  if (pct >= 90) return { level: 'A2.2+', badge: 'Goethe A2.2+ Üstün Yetkinlik – B1 Hazırlığa Uygun' };
  if (pct >= 75) return { level: 'A2.2', badge: 'Goethe A2.2 Sağlam Yetkinlik – Sınava Hazır' };
  if (pct >= 60) return { level: 'A2.1–A2.2', badge: 'Goethe A2 Geçer Düzey – Pekiştirme Önerilir' };
  if (pct >= 45) return { level: 'A2.1', badge: 'A2.1 Gelişmekte – Geçme Sınırının Altında' };
  return { level: 'A1–A2.1', badge: 'Temel Düzey – Yoğun Tekrar Gerekli' };
}

const CATEGORY_TIPS: Record<QuestionCategory, string> = {
  error_detection:
    'Hata avı: Her cümlede sırayla 3 şeyi kontrol et → (1) çekimli fiil kaçıncı sırada? (2) edattan sonraki hâl doğru mu? (3) Perfekt’te haben/sein doğru mu?',
  prepositions_kasus:
    'Kasus: „mit, nach, bei, seit, von, zu, aus, gegenüber → Dativ“ ve „für, ohne, gegen, durch, um → Akkusativ“ listelerini kartla ezberle; Wechselpräpositionen için her seferinde „wo? / wohin?“ diye sor.',
  grammar:
    'Gramer: weil/dass/wenn/obwohl ile her gün 5 cümle yaz ve fiili sona at; deshalb/trotzdem cümlelerinde fiili hemen arkaya koymayı sesli tekrar et.',
  dialogue:
    'Diyaloglar: Doktor, istasyon, restoran ve ev arama durumları için kalıp cümle listesi çıkar (Was fehlt Ihnen? / Zusammen oder getrennt? / Einfach oder hin und zurück?).',
  reading:
    'Okuma: Önce soruyu oku, sonra metinde anahtar kelimeyi (saat, gün, fiyat) ara. Tuzak: metinde geçen ama soruyla ilgisiz rakamlar.',
  sentence_syntax:
    'Satzbau: „Verb an Position 2“ kuralını uygula; yan cümlede fiil sonda, Perfekt/modal cümlede ikinci fiil sonda (Satzklammer).',
  vocabulary:
    'Kelime: Kartlar bölümünde günlük tekrar yap; isimleri mutlaka artikel + çoğul ile, fiilleri Perfekt formuyla birlikte öğren.',
};

const RULE_TIPS: [RegExp, string][] = [
  [/Perfekt/i, 'Perfekt: Hareket (gehen, fahren, fliegen, kommen) ve durum değişimi (aufstehen, einschlafen) fiilleri + sein, bleiben, passieren → „sein“. Geri kalanı → „haben“.'],
  [/Wechselpräp/i, 'Wechselpräpositionen: legen/stellen/hängen/setzen (wohin → Akk) ↔ liegen/stehen/hängen/sitzen (wo → Dat). Çiftleri cümle içinde çalış.'],
  [/weil|dass|Nebensatz/i, 'Yan cümle: weil, dass, wenn, obwohl, ob → çekimli fiil EN SONA. Örnek: …, weil ich keine Zeit HABE.'],
  [/deshalb|trotzdem|Inversion/i, 'deshalb/trotzdem/dann/danach 1. pozisyonu doldurur → hemen arkasından fiil: deshalb GEHE ich …'],
  [/Modalverben im Präteritum/i, 'Modal Präteritum: konnte, musste, durfte, wollte, sollte, mochte – umlaut düşer; ich/er formu ek almaz.'],
  [/Dativ/i, 'Dativ: der→dem, die→der, das→dem, Plural→den (+n). Dativ fiilleri: helfen, danken, gefallen, gehören, antworten.'],
  [/Verb \+ Präposition/i, 'Fiil + edat kalıpları: warten auf, sich freuen auf/über, denken an, sich interessieren für, träumen von, sprechen über – her birini örnek cümleyle kart yap.'],
  [/Artikel/i, 'Artikeller: -ung/-heit/-keit/-ion → die; -chen/-ment/-um → das; günler/aylar/mevsimler → der.'],
  [/Plural/i, 'Çoğullar: Sözlükteki işareti (¨-e, -n, -er, -s) kelimeyle birlikte ezberle.'],
  [/Adjektiv/i, 'Sıfat çekimi: Dativ ve çoğulda hep -en; ein + eril Nominativ → -er, ein + nötr → -es.'],
  [/Trennbare/i, 'Ayrılabilen fiiller: ana cümlede ön ek sona (Ich rufe dich an), yan cümlede bitişik sona (…, dass ich dich anrufe).'],
];

export function evaluate(records: UserAnswerRecord[]): DetailedEvaluation {
  const byCat = new Map<QuestionCategory, { c: number; t: number }>();
  for (const r of records) {
    const cat = r.question.category;
    const v = byCat.get(cat) || { c: 0, t: 0 };
    v.t++;
    if (r.isCorrect) v.c++;
    byCat.set(cat, v);
  }
  const breakdown: CategoryScore[] = [...byCat.entries()].map(([category, v]) => {
    const pct = Math.round((v.c / v.t) * 100);
    return { name: CATEGORY_TR[category], category, correct: v.c, total: v.t, percentage: pct, ratingLabel: ratingLabel(pct) };
  });
  breakdown.sort((a, b) => b.percentage - a.percentage);

  const total = records.length;
  const correct = records.filter((r) => r.isCorrect).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const { level, badge } = cefr(pct);

  const ruleStats = new Map<string, { c: number; w: number }>();
  for (const r of records) {
    const rule = r.question.targetRule;
    if (!rule) continue;
    const v = ruleStats.get(rule) || { c: 0, w: 0 };
    if (r.isCorrect) v.c++;
    else v.w++;
    ruleStats.set(rule, v);
  }

  const strengths: string[] = [];
  for (const b of breakdown) if (b.percentage >= 75 && b.total >= 2) strengths.push(`${b.name}: %${b.percentage} başarı`);
  const masteredRules = [...ruleStats.entries()].filter(([, v]) => v.w === 0 && v.c >= 2).map(([k]) => k);
  for (const r of masteredRules.slice(0, 3)) strengths.push(`Kural hâkimiyeti: ${r}`);

  const weaknesses: string[] = [];
  for (const b of [...breakdown].reverse()) if (b.percentage < 60) weaknesses.push(`${b.name}: %${b.percentage} (${b.correct}/${b.total})`);
  const failedRules = [...ruleStats.entries()].filter(([, v]) => v.w > 0).sort((a, b) => b[1].w - a[1].w);
  for (const [rule, v] of failedRules.slice(0, 4)) weaknesses.push(`Tuzağa düşülen kural: ${rule} (${v.w} hata)`);

  const tips: string[] = [];
  for (const b of [...breakdown].reverse()) {
    if (b.percentage < 70 && tips.length < 2) tips.push(CATEGORY_TIPS[b.category]);
  }
  for (const [rule] of failedRules) {
    if (tips.length >= 3) break;
    const t = RULE_TIPS.find(([re]) => re.test(rule));
    if (t && !tips.includes(t[1])) tips.push(t[1]);
  }
  if (!tips.length) {
    tips.push('Harika gidiyorsun! Bir sonraki adım: Yazma bölümünde Teil 2 e-postası yaz ve zamanlayıcıyla Karma sınav çöz.');
    tips.push('B1’e hazırlık için Präteritum ve yan cümle (als, wenn, ob) sorularına odaklan.');
  }

  let overall: string;
  if (pct >= 90) overall = `%${pct} ile mükemmel bir sonuç. A2 sınav formatına tamamen hâkimsin; artık B1 yapılarına geçebilirsin.`;
  else if (pct >= 75) overall = `%${pct} ile sınavı rahatça geçecek düzeydesin. Zayıf kategorileri pekiştirirsen puanın daha da yükselir.`;
  else if (pct >= 60)
    overall = `%${pct} ile Goethe geçme sınırı olan %60’ın üzerindesin, ancak güvenli bölgede değilsin. Aşağıdaki zayıf kurallara odaklan.`;
  else
    overall = `%${pct} şu an geçme sınırının (%60) altında. Endişelenme: hata hafızası yanlışlarını kaydetti, “Hata Tekrarı” ile bu kurallara yoğunlaş.`;

  return {
    cefrLevel: level,
    cefrStatusBadge: badge,
    overallAssessmentTr: overall,
    categoryBreakdown: breakdown,
    strengths: strengths.length ? strengths : ['Henüz belirgin bir güçlü alan yok – her kategori için daha fazla soru çöz.'],
    weaknesses: weaknesses.length ? weaknesses : ['Belirgin bir zayıflık yok.'],
    actionableTips: tips.slice(0, 3),
  };
}
