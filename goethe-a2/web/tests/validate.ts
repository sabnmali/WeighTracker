// İçerik doğrulama: soru bankası ve üretilen soruların tutarlılığı.
import { BANK } from '../src/data/grammarBank';
import { LONG_READING_QUESTIONS, LONG_TEXTS } from '../src/data/readingTexts';
import { WRITING_TASKS } from '../src/data/writingTasks';
import { genArticle, genCloze, genMeaning, genPerfekt, genPlural, genReverse } from '../src/lib/questionGen';
import { BASE_WORDS } from '../src/lib/words';
import type { Question } from '../src/types';

let errors = 0;
const fail = (m: string) => {
  errors++;
  console.log('✗', m);
};

function check(q: Question) {
  if (q.type === 'sentence_build') {
    if (!q.sentenceParts || q.sentenceParts.length < 3) fail(`${q.id}: parça yok`);
    if (q.sentenceParts!.join(' ') !== q.correctAnswer) fail(`${q.id}: parçalar cevapla uyuşmuyor`);
    return;
  }
  if (!q.options || q.options.length < 2) return fail(`${q.id}: şık yok`);
  if (!q.options.includes(q.correctAnswer)) fail(`${q.id}: doğru cevap şıklarda yok -> ${q.correctAnswer}`);
  if (new Set(q.options).size !== q.options.length) fail(`${q.id}: tekrar eden şık ${JSON.stringify(q.options)}`);
  if (!q.explanation) fail(`${q.id}: açıklama yok`);
}

const ids = new Set<string>();
for (const q of [...BANK, ...LONG_READING_QUESTIONS]) {
  if (ids.has(q.id)) fail(`yinelenen id ${q.id}`);
  ids.add(q.id);
  check(q);
}
console.log('Banka soruları:', BANK.length + LONG_READING_QUESTIONS.length);
const byCat: Record<string, number> = {};
for (const q of BANK) byCat[q.category] = (byCat[q.category] || 0) + 1;
console.log(byCat);

for (const t of LONG_TEXTS) {
  const wc = t.text.split(/\s+/).filter(Boolean).length;
  if (wc < 170 || wc > 270) fail(`${t.id}: metin ${wc} kelime`);
  else console.log(`metin ${t.id}: ${wc} kelime`);
  if (/^Gestern/.test(t.text)) fail(`${t.id}: Gestern ile başlıyor`);
}
for (const w of WRITING_TASKS) {
  const wc = w.model.split(/\s+/).filter(Boolean).length;
  const ok = wc >= w.minWords && wc <= w.maxWords + 2;
  if (!ok) fail(`${w.id}: örnek ${wc} kelime (hedef ${w.minWords}-${w.maxWords})`);
}

const counts: Record<string, number> = {};
const samples: Record<string, string[]> = {};
for (const w of BASE_WORDS) {
  const gens: [string, Question | null][] = [
    ['meaning', genMeaning(w, BASE_WORDS)],
    ['reverse', genReverse(w, BASE_WORDS)],
    ['article', genArticle(w)],
    ['plural', genPlural(w)],
    ['perfekt', genPerfekt(w)],
    ['cloze', genCloze(w, BASE_WORDS)],
  ];
  for (const [k, q] of gens) {
    if (!q) continue;
    counts[k] = (counts[k] || 0) + 1;
    check(q);
    (samples[k] ||= []).length < 6 && samples[k].push(`${q.question} | ${q.options?.join(' / ')} => ${q.correctAnswer}`);
  }
}
console.log('Üretilebilen sorular:', counts);
for (const [k, v] of Object.entries(samples)) {
  console.log(`--- ${k}`);
  v.forEach((x) => console.log('  ', x));
}
console.log(errors ? `\n${errors} HATA` : '\nTüm kontroller geçti ✓');
process.exit(errors ? 1 : 0);
