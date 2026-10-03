import rawWords from '../data/words.json';
import type { AppState, Word, WordProgress } from '../types';

export const BASE_WORDS: Word[] = rawWords as Word[];

export const THEMES = [
  'Person & Familie',
  'Wohnen',
  'Essen & Trinken',
  'Einkaufen & Kleidung',
  'Arbeit & Beruf',
  'Schule & Ausbildung',
  'Gesundheit & Körper',
  'Reisen & Verkehr',
  'Freizeit & Hobbys',
  'Natur & Wetter',
  'Kommunikation & Medien',
  'Dienstleistungen & Behörden',
  'Zeit & Zahlen',
  'Allgemein',
];

export const THEME_TR: Record<string, string> = {
  'Person & Familie': 'Kişi & Aile',
  Wohnen: 'Konut & Ev',
  'Essen & Trinken': 'Yeme & İçme',
  'Einkaufen & Kleidung': 'Alışveriş & Giyim',
  'Arbeit & Beruf': 'İş & Meslek',
  'Schule & Ausbildung': 'Okul & Eğitim',
  'Gesundheit & Körper': 'Sağlık & Vücut',
  'Reisen & Verkehr': 'Seyahat & Ulaşım',
  'Freizeit & Hobbys': 'Boş Zaman & Hobiler',
  'Natur & Wetter': 'Doğa & Hava',
  'Kommunikation & Medien': 'İletişim & Medya',
  'Dienstleistungen & Behörden': 'Hizmetler & Resmî Daireler',
  'Zeit & Zahlen': 'Zaman & Sayılar',
  Allgemein: 'Genel',
};

export const TYPE_TR: Record<string, string> = {
  Nomen: 'İsim',
  Verb: 'Fiil',
  Adjektiv: 'Sıfat',
  Adverb: 'Zarf',
  Präposition: 'Edat',
  Konnektor: 'Bağlaç',
  Pronomen: 'Zamir/Belirleyici',
  Fragewort: 'Soru kelimesi',
  Redewendung: 'Kalıp ifade',
  Andere: 'Diğer',
};

let cache: { custom: Word[]; all: Word[]; byId: Map<string, Word> } | null = null;

export function allWords(custom: Word[]): Word[] {
  if (cache && cache.custom === custom) return cache.all;
  const all = [...BASE_WORDS, ...custom];
  cache = { custom, all, byId: new Map(all.map((w) => [w.id, w])) };
  return all;
}

export function wordById(id: string, custom: Word[]): Word | undefined {
  allWords(custom);
  return cache!.byId.get(id);
}

/** Görünen ana biçim: isimlerde artikel + lemma. */
export function headword(w: Word): string {
  if (w.type === 'Nomen' && w.article && w.article !== 'der/die' && w.article !== 'der/das') {
    return `${w.article} ${w.lemma}`;
  }
  return w.lemma || w.de;
}

export const ARTICLE_COLOR: Record<string, string> = {
  der: 'text-sky-700 dark:text-sky-300',
  die: 'text-rose-700 dark:text-rose-300',
  das: 'text-emerald-700 dark:text-emerald-300',
};

export type Mastery = 'new' | 'learning' | 'weak' | 'learned';

export const MASTERY_TR: Record<Mastery, string> = {
  new: 'Yeni',
  learning: 'Öğreniliyor',
  weak: 'Zayıf / Hatalı',
  learned: 'Öğrenildi',
};

export function errorRate(p?: WordProgress): number {
  if (!p || p.seen === 0) return 0;
  return Math.round((p.wrong / Math.max(1, p.correct + p.wrong)) * 100);
}

export function mastery(p?: WordProgress): Mastery {
  if (!p || p.seen === 0) return 'new';
  const er = errorRate(p);
  if (p.wrong >= 2 && er >= 40 && p.box < 4) return 'weak';
  if (p.box >= 4) return 'learned';
  return 'learning';
}

export function isDue(p: WordProgress | undefined, now = Date.now()): boolean {
  return !!p && p.box > 0 && p.due <= now;
}

export function stats(state: AppState) {
  const words = allWords(state.customWords);
  let learned = 0;
  let learning = 0;
  let weak = 0;
  let due = 0;
  const now = Date.now();
  for (const w of words) {
    const p = state.words[w.id];
    const m = mastery(p);
    if (m === 'learned') learned++;
    else if (m === 'learning') learning++;
    else if (m === 'weak') weak++;
    if (isDue(p, now)) due++;
  }
  return { total: words.length, learned, learning, weak, due, fresh: words.length - learned - learning - weak };
}
