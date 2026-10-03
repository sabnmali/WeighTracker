import type { Question, Word } from '../types';
import { escapeRegExp, pick, sample, shuffle } from './util';
import { headword } from './words';

const UML: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };

const NO_UMLAUT = /(ung|ion|ei|heit|keit|schaft|tät|ur|um|us|ik|ie|ment|ett|ar|eur|or|ist|ant)$/;

/** Kelimenin son hecesindeki a/o/u/au ünlüsünü umlautlar; uygun değilse kelimeyi aynen döndürür. */
export function umlaut(word: string): string {
  if (NO_UMLAUT.test(word.toLowerCase())) return word;
  let core = word;
  for (const suf of ['er', 'el', 'en', 'e']) {
    if (word.endsWith(suf) && word.length > suf.length + 2) {
      core = word.slice(0, -suf.length);
      break;
    }
  }
  const m = /([aeiouäöüAEIOUÄÖÜ]+)[^aeiouäöüAEIOUÄÖÜ]*$/.exec(core);
  if (!m) return word;
  const nucleus = m[1];
  const pos = m.index;
  let repl: string | null = null;
  if (/^[aA]u$/.test(nucleus)) repl = (nucleus[0] === 'a' ? 'ä' : 'Ä') + 'u';
  else if (/^[aouAOU]$/.test(nucleus)) repl = UML[nucleus];
  else if (/^[aA]a$/.test(nucleus)) repl = nucleus[0] === 'a' ? 'ä' : 'Ä';
  if (!repl) return word;
  return word.slice(0, pos) + repl + word.slice(pos + nucleus.length);
}

const DIE_SUFFIX = ['ung', 'heit', 'keit', 'schaft', 'ion', 'tät', 'ik', 'ei', 'ie', 'ur', 'enz', 'anz'];
const DAS_SUFFIX = ['chen', 'lein', 'ment', 'um', 'ma', 'nis'];
const DER_SUFFIX = ['ling', 'ismus', 'or', 'ist', 'ant', 'eur', 'ig'];

function articleTip(lemma: string, article: string): string {
  const low = lemma.toLowerCase();
  const hit = (list: string[]) => list.find((s) => low.endsWith(s));
  const d = hit(DIE_SUFFIX);
  if (d && article === 'die') return ` İpucu: -${d} ile biten isimler genellikle dişildir (die).`;
  const n = hit(DAS_SUFFIX);
  if (n && article === 'das') return ` İpucu: -${n} ile biten isimler genellikle nötrdür (das).`;
  const r = hit(DER_SUFFIX);
  if (r && article === 'der') return ` İpucu: -${r} ile biten isimler genellikle erildir (der).`;
  if (/^(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|frühling|sommer|herbst|winter)/.test(low) && article === 'der')
    return ' İpucu: Günler, aylar ve mevsimler erildir (der).';
  return ' İpucu: İsimleri her zaman artikel ve çoğuluyla birlikte ezberleyin.';
}

function trTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[\s,/;()]+/)
      .filter((t) => t.length > 2),
  );
}

function sameMeaning(a: Word, b: Word): boolean {
  if (a.tr === b.tr) return true;
  const ta = trTokens(a.tr);
  for (const t of trTokens(b.tr)) if (ta.has(t)) return true;
  return false;
}

function distractorWords(w: Word, pool: Word[], n: number, filter?: (x: Word) => boolean): Word[] {
  const cands = pool.filter(
    (x) => x.id !== w.id && x.type === w.type && !sameMeaning(w, x) && x.lemma !== w.lemma && (!filter || filter(x)),
  );
  const sameTheme = cands.filter((x) => x.theme === w.theme);
  const ordered = [...shuffle(sameTheme.length >= n * 2 ? sameTheme : cands), ...shuffle(cands)];
  const chosen: Word[] = [];
  const seenTr = new Set([w.tr]);
  const seenHead = new Set([headword(w)]);
  const take = (list: Word[]) => {
    for (const x of list) {
      if (chosen.length >= n) break;
      if (chosen.includes(x) || seenTr.has(x.tr) || seenHead.has(headword(x))) continue;
      if (chosen.some((c) => sameMeaning(c, x))) continue;
      chosen.push(x);
      seenTr.add(x.tr);
      seenHead.add(headword(x));
    }
  };
  take(ordered);
  if (chosen.length < n) take(shuffle(pool.filter((x) => x.id !== w.id && !sameMeaning(w, x))));
  return chosen;
}

function exampleHint(w: Word): string {
  return w.examples.length ? ` Örnek: „${w.examples[0]}“` : '';
}

export function genMeaning(w: Word, pool: Word[]): Question | null {
  const ds = distractorWords(w, pool, 3);
  if (ds.length < 3) return null;
  return {
    id: `gen-mean-${w.id}`,
    type: 'multiple_choice',
    category: 'vocabulary',
    difficulty: 'A2.1',
    question: `Was bedeutet „${headword(w)}“?`,
    questionTr: `„${headword(w)}“ ne anlama gelir?`,
    options: shuffle([w.tr, ...ds.map((d) => d.tr)]),
    correctAnswer: w.tr,
    explanation: `${w.de} = ${w.tr}.${exampleHint(w)}`,
    targetWord: headword(w),
    wordId: w.id,
    targetRule: 'Wortschatz: Bedeutung',
    source: 'gen',
  };
}

export function genReverse(w: Word, pool: Word[]): Question | null {
  const ds = distractorWords(w, pool, 3);
  if (ds.length < 3) return null;
  const opts = [headword(w), ...ds.map(headword)];
  if (new Set(opts).size < 4) return null;
  return {
    id: `gen-rev-${w.id}`,
    type: 'multiple_choice',
    category: 'vocabulary',
    difficulty: 'A2.1',
    question: `Wie sagt man „${w.tr}“ auf Deutsch?`,
    questionTr: `„${w.tr}“ Almancada nasıl söylenir?`,
    options: shuffle(opts),
    correctAnswer: headword(w),
    explanation: `${w.tr} = ${w.de}.${exampleHint(w)}`,
    targetWord: headword(w),
    wordId: w.id,
    targetRule: 'Wortschatz: Bedeutung',
    source: 'gen',
  };
}

export function canArticle(w: Word): boolean {
  return w.type === 'Nomen' && ['der', 'die', 'das'].includes(w.article || '') && !w.plOnly && !w.lemma.includes(' ');
}

export function genArticle(w: Word): Question | null {
  if (!canArticle(w)) return null;
  return {
    id: `gen-art-${w.id}`,
    type: 'multiple_choice',
    category: 'vocabulary',
    difficulty: 'A2.1',
    question: `Welcher Artikel ist richtig?  ___ ${w.lemma}`,
    questionTr: `„${w.lemma}“ (${w.tr}) kelimesinin artikeli hangisi?`,
    options: ['der', 'die', 'das'],
    correctAnswer: w.article!,
    explanation: `${w.article} ${w.lemma}${w.plural ? `, Plural: die ${w.plural}` : ''} = ${w.tr}.${articleTip(w.lemma, w.article!)}`,
    targetWord: headword(w),
    wordId: w.id,
    targetRule: 'Artikel: der, die, das',
    source: 'gen',
  };
}

export function canPlural(w: Word): boolean {
  return w.type === 'Nomen' && !!w.plural && !w.plural.includes(' ') && !w.plural.includes('(') && !w.sgOnly && !w.plOnly && w.plural !== w.lemma;
}

export function genPlural(w: Word): Question | null {
  if (!canPlural(w)) return null;
  const L = w.lemma;
  const U = umlaut(L);
  const syllables = (L.match(/[aeiouäöüy]+/gi) || []).length;
  const hasU = U !== L && ((w.pluralCode || '').startsWith('¨') || syllables === 1);
  let raw: (string | null)[];
  if (/e$/.test(L)) raw = [L + 'n', L + 's', L, hasU ? U + 'n' : null, hasU ? U : null];
  else if (/(el|er|en)$/.test(L)) raw = [L + 'n', L, L + 's', L + 'e', hasU ? U : null];
  else raw = [L + 'e', L + 'en', L + 'er', L + 's', L, hasU ? U + 'e' : null, hasU ? U + 'er' : null];
  const cands = new Set(raw.filter((x): x is string => !!x && x !== w.plural));
  const wrong = sample([...cands], 3);
  if (wrong.length < 3) return null;
  return {
    id: `gen-pl-${w.id}`,
    type: 'multiple_choice',
    category: 'grammar',
    difficulty: 'A2.1',
    question: `Wie lautet der Plural von „${w.article ? w.article + ' ' : ''}${L}“?`,
    questionTr: `„${L}“ (${w.tr}) kelimesinin çoğulu hangisi?`,
    options: shuffle([`die ${w.plural}`, ...wrong.map((x) => `die ${x}`)]),
    correctAnswer: `die ${w.plural}`,
    explanation: `${w.article || ''} ${L}, ${w.pluralCode} → die ${w.plural}. Sözlükteki „${w.pluralCode}“ işareti çoğul ekini gösterir (¨ = umlaut).`,
    targetWord: headword(w),
    wordId: w.id,
    targetRule: 'Pluralbildung',
    source: 'gen',
  };
}

const SEP_PREFIXES = [
  'zurück',
  'zusammen',
  'weiter',
  'vorbei',
  'spazieren',
  'kennen',
  'statt',
  'teil',
  'fern',
  'weg',
  'nach',
  'mit',
  'ein',
  'aus',
  'auf',
  'an',
  'ab',
  'bei',
  'vor',
  'zu',
  'los',
  'her',
  'hin',
  'um',
  'fest',
  'frei',
  'leid',
];
const INSEP = ['be', 'ver', 'er', 'ent', 'emp', 'ge', 'zer', 'miss', 'über', 'unter', 'wieder'];

function stemOf(inf: string): string {
  if (inf.endsWith('en')) return inf.slice(0, -2);
  if (inf.endsWith('n')) return inf.slice(0, -1);
  return inf;
}

/** Zayıf fiil eki: kök -t/-d ile bitiyorsa -et (arbeitet), aksi hâlde -t. */
function weakT(stem: string): string {
  return /[td]$/.test(stem) ? stem + 'et' : stem + 't';
}

export function wrongPartizip(lemma: string, part: string): string | null {
  const sep = SEP_PREFIXES.find((p) => lemma.startsWith(p) && part.startsWith(p + 'ge'));
  const insep =
    !sep &&
    (INSEP.some((p) => lemma.startsWith(p) && !part.startsWith(p === 'ge' ? 'gege' : 'ge')) || lemma.endsWith('ieren'));
  const strong = part.endsWith('en');
  let wrong: string;
  if (sep) {
    const rest = lemma.slice(sep.length);
    wrong = strong ? `${sep}ge${weakT(stemOf(rest))}` : `ge${weakT(stemOf(lemma))}`;
  } else if (insep) {
    wrong = strong ? weakT(stemOf(lemma)) : `ge${part}`;
  } else {
    wrong = strong ? `ge${weakT(stemOf(lemma))}` : `ge${lemma}`;
  }
  if (wrong === part) return null;
  return wrong;
}

export function canPerfekt(w: Word): boolean {
  return (
    w.type === 'Verb' &&
    (w.perfektAux === 'haben' || w.perfektAux === 'sein') &&
    !!w.partizip &&
    !/[\s/]/.test(w.partizip) &&
    !/[\s/(]/.test(w.lemma)
  );
}

export function genPerfekt(w: Word): Question | null {
  if (!canPerfekt(w)) return null;
  const wrong = wrongPartizip(w.lemma, w.partizip!);
  if (!wrong) return null;
  const aux = w.perfektAux === 'sein' ? 'ist' : 'hat';
  const other = aux === 'ist' ? 'hat' : 'ist';
  const sich = w.reflexive ? ' sich' : '';
  const correct = `er ${aux}${sich} ${w.partizip}`;
  return {
    id: `gen-perf-${w.id}`,
    type: 'multiple_choice',
    category: 'grammar',
    difficulty: 'A2.1',
    question: `Perfekt von „${w.reflexive ? 'sich ' : ''}${w.lemma}“ (er):`,
    questionTr: `„${w.lemma}“ (${w.tr}) fiilinin Perfekt hâli (er) hangisi?`,
    options: shuffle([correct, `er ${other}${sich} ${w.partizip}`, `er ${aux}${sich} ${wrong}`, `er ${other}${sich} ${wrong}`]),
    correctAnswer: correct,
    explanation:
      `${w.lemma} → ${aux} ${w.partizip}. ` +
      (aux === 'ist'
        ? 'Yer değiştirme veya durum değişikliği bildirdiği için (ya da sein/bleiben/werden olduğu için) „sein“ alır.'
        : 'Nesne alan, dönüşlü ve çoğu diğer fiil gibi „haben“ alır.') +
      exampleHint(w),
    targetWord: w.lemma,
    wordId: w.id,
    targetRule: aux === 'ist' ? 'Perfekt: Bewegungsverben mit sein' : 'Perfekt: haben oder sein?',
    source: 'gen',
  };
}

const LETTER = '\\p{L}';

function findForm(sentence: string, forms: string[]): string | null {
  for (const f of forms) {
    if (!f || f.length < 2) continue;
    const re = new RegExp(`(?<![${LETTER}])${escapeRegExp(f)}(?![${LETTER}])`, 'u');
    const m = sentence.match(re);
    if (m) return m[0];
  }
  return null;
}

interface ClozeTarget {
  sentence: string;
  form: string;
  kind: 'lemma' | 'plural' | 'partizip' | 'inf' | 'adj';
  ending?: string;
}

function clozeTarget(w: Word): ClozeTarget | null {
  if (!w.examples.length || /\s/.test(w.lemma) || w.lemma.length < 3) return null;
  for (const s of shuffle(w.examples)) {
    if (s.length > 140) continue;
    if (w.type === 'Nomen') {
      if (findForm(s, [w.lemma])) return { sentence: s, form: w.lemma, kind: 'lemma' };
      if (w.plural && w.plural !== w.lemma && findForm(s, [w.plural])) return { sentence: s, form: w.plural, kind: 'plural' };
    } else if (w.type === 'Verb') {
      if (w.partizip && !/[\s/]/.test(w.partizip) && findForm(s, [w.partizip]))
        return { sentence: s, form: w.partizip, kind: 'partizip' };
      if (findForm(s, [w.lemma])) return { sentence: s, form: w.lemma, kind: 'inf' };
    } else if (w.type === 'Adjektiv') {
      for (const end of ['', 'e', 'en', 'er', 'es', 'em']) {
        if (findForm(s, [w.lemma + end])) return { sentence: s, form: w.lemma + end, kind: 'adj', ending: end };
      }
    } else if (['Adverb', 'Präposition', 'Konnektor'].includes(w.type)) {
      const cap = w.lemma[0].toUpperCase() + w.lemma.slice(1);
      const f = findForm(s, [w.lemma, cap]);
      if (f) return { sentence: s, form: f, kind: 'lemma' };
    }
  }
  return null;
}

export function canCloze(w: Word): boolean {
  return !!clozeTarget(w);
}

export function genCloze(w: Word, pool: Word[]): Question | null {
  const t = clozeTarget(w);
  if (!t) return null;
  const capFirst = t.sentence.indexOf(t.form) === 0;
  const fix = (s: string) => (capFirst ? s[0].toUpperCase() + s.slice(1) : s);
  let others: string[] = [];
  const ds = distractorWords(w, pool, 12);
  for (const d of ds) {
    let f: string | undefined;
    if (t.kind === 'lemma') f = d.lemma;
    else if (t.kind === 'plural') f = d.plural;
    else if (t.kind === 'partizip') f = d.partizip && !/[\s/]/.test(d.partizip) ? d.partizip : undefined;
    else if (t.kind === 'inf') f = d.lemma;
    else if (t.kind === 'adj') f = d.lemma + (t.ending || '');
    if (f && !/[\s/(]/.test(f) && f !== t.form) others.push(fix(f));
  }
  others = Array.from(new Set(others)).slice(0, 3);
  if (others.length < 3) return null;
  const blanked = t.sentence.replace(
    new RegExp(`(?<![${LETTER}])${escapeRegExp(t.form)}(?![${LETTER}])`, 'u'),
    '___',
  );
  return {
    id: `gen-cloze-${w.id}`,
    type: 'cloze',
    category: 'vocabulary',
    difficulty: 'A2.2',
    question: blanked,
    questionTr: `Boşluğa „${w.tr}“ anlamına gelen kelimeyi yerleştirin.`,
    options: shuffle([t.form, ...others]),
    correctAnswer: t.form,
    explanation: `Doğru cevap: „${t.form}“ (${w.de} = ${w.tr}). Tam cümle: „${t.sentence}“`,
    targetWord: headword(w),
    wordId: w.id,
    targetRule: 'Wortschatz im Kontext',
    source: 'gen',
  };
}

export type GenKind = 'meaning' | 'reverse' | 'article' | 'plural' | 'perfekt' | 'cloze';

export function genForWord(w: Word, pool: Word[], kinds: GenKind[]): Question | null {
  for (const k of shuffle(kinds)) {
    let q: Question | null = null;
    if (k === 'meaning') q = genMeaning(w, pool);
    else if (k === 'reverse') q = genReverse(w, pool);
    else if (k === 'article') q = genArticle(w);
    else if (k === 'plural') q = genPlural(w);
    else if (k === 'perfekt') q = genPerfekt(w);
    else if (k === 'cloze') q = genCloze(w, pool);
    if (q) return q;
  }
  return null;
}

/** Kelime kartındaki mikro quiz için 3 soruluk set. */
export function microQuiz(w: Word, pool: Word[]): Question[] {
  const out: Question[] = [];
  const add = (q: Question | null) => q && out.push(q);
  add(genMeaning(w, pool));
  if (canArticle(w)) add(genArticle(w));
  else if (canPerfekt(w)) add(genPerfekt(w));
  add(genCloze(w, pool) || genReverse(w, pool));
  return out;
}

export function randomWordOf(pool: Word[], pred: (w: Word) => boolean): Word | undefined {
  const c = pool.filter(pred);
  return c.length ? pick(c) : undefined;
}
