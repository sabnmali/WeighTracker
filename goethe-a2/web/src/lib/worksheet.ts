import { LONG_TEXTS } from '../data/readingTexts';
import type { AppState, Word } from '../types';
import { genCloze } from './questionGen';
import { escapeHtml as e, pick, shuffle, todayKey, weightedSample } from './util';
import { allWords, mastery } from './words';

/** Sachlich doğru zıt anlam çiftleri (ör. hässlich ↔ schön; asla „hell“ değil). */
export const ANTONYMS: [string, string][] = [
  ['groß', 'klein'],
  ['alt', 'jung'],
  ['alt', 'neu'],
  ['billig', 'teuer'],
  ['schön', 'hässlich'],
  ['hell', 'dunkel'],
  ['laut', 'leise'],
  ['schnell', 'langsam'],
  ['warm', 'kalt'],
  ['gesund', 'krank'],
  ['leicht', 'schwer'],
  ['voll', 'leer'],
  ['früh', 'spät'],
  ['richtig', 'falsch'],
  ['nass', 'trocken'],
  ['lang', 'kurz'],
  ['dick', 'dünn'],
  ['stark', 'schwach'],
  ['sauber', 'schmutzig'],
  ['reich', 'arm'],
  ['glücklich', 'traurig'],
  ['interessant', 'langweilig'],
  ['weich', 'hart'],
  ['viel', 'wenig'],
  ['immer', 'nie'],
  ['oben', 'unten'],
  ['links', 'rechts'],
  ['vorn', 'hinten'],
  ['drinnen', 'draußen'],
  ['einfach', 'schwierig'],
  ['fleißig', 'faul'],
  ['nah', 'weit'],
  ['gefährlich', 'sicher'],
  ['gut', 'schlecht'],
  ['heiß', 'kalt'],
  ['offen', 'geschlossen'],
  ['süß', 'sauer'],
  ['eng', 'weit'],
  ['ruhig', 'laut'],
  ['möglich', 'unmöglich'],
];

const SITUATIONS: Record<string, string[]> = {
  Wohnen: [
    'Du suchst eine Wohnung. Schreibe zwei Fragen an den Vermieter. (Ev arıyorsun. Ev sahibine iki soru yaz.)',
    'Beschreibe dein Zimmer in drei Sätzen. (Odanı üç cümleyle anlat.)',
  ],
  'Gesundheit & Körper': [
    'Du bist krank. Schreibe eine kurze Nachricht an deinen Chef. (Hastasın. Şefine kısa bir mesaj yaz.)',
    'Was sagst du beim Arzt? Schreibe zwei Sätze. (Doktorda ne dersin? İki cümle yaz.)',
  ],
  'Essen & Trinken': [
    'Du bist im Restaurant. Bestelle ein Essen und ein Getränk. (Restorandasın. Bir yemek ve bir içecek sipariş et.)',
  ],
  'Reisen & Verkehr': ['Du bist am Bahnhof. Frag nach dem Zug nach Köln. (İstasyondasın. Köln treni hakkında soru sor.)'],
  'Arbeit & Beruf': ['Beschreibe deinen Arbeitstag in drei Sätzen. (İş gününü üç cümleyle anlat.)'],
  'Freizeit & Hobbys': ['Lade einen Freund zu deinem Geburtstag ein. (Bir arkadaşını doğum gününe davet et.)'],
};
const GENERIC_SITUATIONS = [
  'Schreibe drei Sätze über dein Wochenende. (Hafta sonun hakkında üç cümle yaz.)',
  'Du kommst zu spät zum Kurs. Schreibe eine kurze SMS an deine Lehrerin. (Kursa geç kalıyorsun. Öğretmenine kısa bir SMS yaz.)',
  'Beschreibe deinen Tagesablauf mit „zuerst – dann – danach“. (Günlük rutinini „zuerst – dann – danach“ ile anlat.)',
];

function line(n = 22) {
  return '_'.repeat(n);
}

export function chooseWorksheetWords(state: AppState, theme?: string): Word[] {
  const all = allWords(state.customWords).filter((w) => w.source !== 'Gruppe');
  const byId = new Map(all.map((w) => [w.id, w]));
  const chosen: Word[] = [];
  const add = (w?: Word) => {
    if (w && !chosen.includes(w) && chosen.length < 15) chosen.push(w);
  };
  state.worksheetQueue.slice(0, 8).forEach((id) => add(byId.get(id)));
  const pool = theme ? all.filter((w) => w.theme === theme) : all;
  const weight = (w: Word) => {
    const m = mastery(state.words[w.id]);
    return m === 'weak' ? 5 : m === 'learning' ? 2 : m === 'new' ? 1.5 : 0.4;
  };
  const quota: [string[], number][] = [
    [['Nomen'], 8],
    [['Verb'], 4],
    [['Adjektiv', 'Adverb', 'Konnektor', 'Präposition'], 3],
  ];
  for (const [types, n] of quota) {
    const have = chosen.filter((w) => types.includes(w.type)).length;
    const cands = pool.filter((w) => types.includes(w.type) && !chosen.includes(w));
    weightedSample(cands, weight, Math.max(0, n - have)).forEach(add);
  }
  if (chosen.length < 15) weightedSample(all.filter((w) => !chosen.includes(w)), weight, 15 - chosen.length).forEach(add);
  return chosen.slice(0, 15);
}

export interface Worksheet {
  html: string;
  answerKey: string;
}

export function buildWorksheet(state: AppState, words: Word[], theme?: string): Worksheet {
  const pool = allWords(state.customWords);
  const ak: string[] = [];
  const parts: string[] = [];
  const date = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  parts.push(`<h2>Tagesarbeitsblatt · Goethe A2</h2>`);
  parts.push(
    `<p><strong>Datum:</strong> ${e(date)} &nbsp; · &nbsp; <strong>Thema:</strong> ${e(theme || 'Gemischt')} &nbsp; · &nbsp; <strong>Name:</strong> ${line(16)}</p>`,
  );

  // ---------- Teil 1
  parts.push('<h3>Teil 1 – Wortschatz und Artikel</h3>');
  parts.push(
    '<p><em>Ergänze den Artikel in [ ] und die Bedeutung. Bei Verben auch das Perfekt. (Artikeli [ ] içine, anlamı çizgiye yaz; fiillerde Perfekt hâlini de yaz.)</em></p><ol>',
  );
  const ak1: string[] = [];
  words.forEach((w) => {
    if (w.type === 'Nomen') {
      const pl = w.sgOnly ? ' (Sg.)' : w.plOnly ? ' (Pl.)' : w.pluralCode ? `, ${w.pluralCode}` : '';
      parts.push(`<li>[&nbsp;&nbsp;&nbsp;] ${e(w.lemma)}${e(pl)} = ${line()}</li>`);
      ak1.push(`<li>${e(w.article || '?')} ${e(w.lemma)} = ${e(w.tr)}</li>`);
    } else if (w.type === 'Verb' && w.partizip) {
      parts.push(`<li>${e(w.lemma)} – Perfekt: ${line(14)} = ${line(16)}</li>`);
      ak1.push(`<li>${e(w.lemma)} – ${w.perfektAux === 'sein' ? 'ist' : 'hat'} ${e(w.partizip)} = ${e(w.tr)}</li>`);
    } else {
      parts.push(`<li>${e(w.lemma)} = ${line()}</li>`);
      ak1.push(`<li>${e(w.lemma)} = ${e(w.tr)}</li>`);
    }
  });
  parts.push('</ol>');
  ak.push(`<h4>Teil 1</h4><ol>${ak1.join('')}</ol>`);

  // ---------- Teil 2
  const clozes: { sentence: string; answer: string; wordId: string }[] = [];
  for (const w of shuffle(words)) {
    if (clozes.length >= 8) break;
    const q = genCloze(w, pool);
    if (q) clozes.push({ sentence: q.question, answer: q.correctAnswer, wordId: w.id });
  }
  if (clozes.length < 5) {
    for (const w of shuffle(pool.filter((x) => x.examples.length && !words.includes(x)))) {
      if (clozes.length >= 6) break;
      const q = genCloze(w, pool);
      if (q) clozes.push({ sentence: q.question, answer: q.correctAnswer, wordId: w.id });
    }
  }
  parts.push('<h3>Teil 2 – Lückentext</h3>');
  parts.push(
    `<p><em>Setze die Wörter aus dem Wortkasten ein. (Kutudaki kelimeleri boşluklara yerleştir.)</em></p><p><strong>Wortkasten:</strong> ${shuffle(
      clozes.map((c) => c.answer),
    )
      .map(e)
      .join(' &nbsp;·&nbsp; ')}</p><ol>`,
  );
  clozes.forEach((c) => parts.push(`<li>${e(c.sentence).replace('___', line(14))}</li>`));
  parts.push('</ol>');
  ak.push(`<h4>Teil 2</h4><ol>${clozes.map((c) => `<li>${e(c.answer)}</li>`).join('')}</ol>`);

  // ---------- Teil 3
  const used = new Set(clozes.map((c) => c.sentence.replace('___', c.answer)));
  const sentences: { s: string; w: Word }[] = [];
  for (const w of shuffle(words)) {
    const s = w.examples.find((x) => !used.has(x) && x.length < 120 && x.split(' ').length >= 4);
    if (s) {
      sentences.push({ s, w });
      used.add(s);
    }
    if (sentences.length >= 5) break;
  }
  parts.push('<h3>Teil 3 – Übersetzung</h3>');
  parts.push('<p><em>Übersetze ins Türkische. (Türkçeye çevir.)</em></p><ol>');
  sentences.forEach((x) => parts.push(`<li>${e(x.s)}<br>→ ${line(48)}</li>`));
  parts.push('</ol>');
  ak.push(
    `<h4>Teil 3 (anahtar kelimeler)</h4><ol>${sentences.map((x) => `<li>${e(x.w.de)} = ${e(x.w.tr)}</li>`).join('')}</ol>`,
  );

  // ---------- Teil 4
  const tasks: string[] = [];
  const ak4: string[] = [];
  const verb = words.find((w) => w.type === 'Verb' && w.partizip) || pool.find((w) => w.type === 'Verb' && w.partizip);
  if (verb) {
    tasks.push(`Bilde einen Satz im Perfekt mit „${e(verb.lemma)}“. (Perfekt’te bir cümle kur.)`);
    ak4.push(`Perfekt: ${verb.perfektAux === 'sein' ? 'ist' : 'hat'} ${e(verb.partizip || '')} – örn. „${e(verb.examples[0] || '')}“`);
  }
  const lemmas = new Set(words.map((w) => w.lemma));
  const pairs = shuffle(ANTONYMS);
  const own = pairs.filter(([a, b]) => lemmas.has(a) || lemmas.has(b));
  const antos = [...own, ...pairs.filter((p) => !own.includes(p))].slice(0, 2);
  antos.forEach(([a, b]) => {
    const [ask, ans] = lemmas.has(b) ? [b, a] : [a, b];
    tasks.push(`Was ist das Gegenteil von „${e(ask)}“? (Zıt anlamlısı nedir?) → ${line(14)}`);
    ak4.push(`${e(ask)} ↔ ${e(ans)}`);
  });
  const noun = words.find((w) => w.type === 'Nomen');
  if (noun) {
    tasks.push(`Schreibe einen Satz mit „weil“ und dem Wort „${e(noun.lemma)}“. (weil ve bu kelimeyle bir cümle yaz.)`);
    ak4.push(`weil-cümlesi: çekimli fiil sona! (… , weil … ${e(noun.lemma)} … ist/hat.)`);
  }
  const sit = pick((theme && SITUATIONS[theme]) || GENERIC_SITUATIONS);
  tasks.push(e(sit));
  ak4.push('Serbest cevap – selamlama, en az bir bağlaç (weil/deshalb/aber) ve doğru fiil sırası kullanmaya dikkat et.');
  parts.push('<h3>Teil 4 – Satzbau &amp; Anwendung</h3><ol>');
  tasks.forEach((t) => parts.push(`<li>${t}<br>${line(48)}</li>`));
  parts.push('</ol>');
  ak.push(`<h4>Teil 4</h4><ol>${ak4.map((x) => `<li>${x}</li>`).join('')}</ol>`);

  // ---------- Teil 5
  const themed = LONG_TEXTS.filter((t) => t.theme === theme);
  const text = themed.length ? pick(themed) : pick(LONG_TEXTS);
  parts.push(`<h3>Teil 5 – Lesetext &amp; Vertiefung</h3>`);
  parts.push(`<p><strong>${e(text.title)}</strong> <em>(${e(text.format)})</em></p>`);
  text.text.split(/\n\s*\n/).forEach((p) => parts.push(`<p>${e(p).replace(/\n/g, '<br>')}</p>`));
  parts.push('<p><strong>A) Fragen zum Text</strong> <em>(Metinle ilgili sorular – doğru şıkkı işaretle)</em></p><ol>');
  text.questions.forEach((q) => {
    const opts = shuffle(q.o);
    parts.push(`<li>${e(q.q)}<br>${opts.map((o, i) => `${'abcd'[i]}) ${e(o)}`).join('<br>')}</li>`);
  });
  parts.push('</ol><p><strong>B) Richtig oder falsch?</strong> <em>(Doğru mu yanlış mı?)</em></p><ol>');
  text.trueFalse.forEach((t) => parts.push(`<li>${e(t.s)} &nbsp; [ ] richtig &nbsp; [ ] falsch</li>`));
  parts.push('</ol><p><strong>C) Redemittel – übersetze und lerne:</strong> <em>(Kalıpları çevir ve öğren)</em></p><ul>');
  text.phrases.forEach((p) => parts.push(`<li>${e(p.de)} = ${line(26)}</li>`));
  parts.push('</ul>');
  ak.push(
    `<h4>Teil 5</h4><ol>${text.questions.map((q) => `<li>${e(q.a)}</li>`).join('')}</ol><p>R/F: ${text.trueFalse
      .map((t, i) => `${i + 1}) ${t.correct ? 'richtig' : 'falsch'}`)
      .join(' · ')}</p><ul>${text.phrases.map((p) => `<li>${e(p.de)} = ${e(p.tr)}</li>`).join('')}</ul>`,
  );

  return { html: parts.join('\n'), answerKey: ak.join('\n') };
}

export function worksheetFileName(): string {
  return `Tagesarbeitsblatt-${todayKey()}`;
}

