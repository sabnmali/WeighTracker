import {
  DIALOGUE_QUESTIONS,
  ERROR_QUESTIONS,
  GRAMMAR_QUESTIONS,
  KASUS_QUESTIONS,
  READING_QUESTIONS,
  SYNTAX_QUESTIONS,
} from '../data/grammarBank';
import { LONG_READING_QUESTIONS } from '../data/readingTexts';
import type { AppState, Question, QuestionCategory, Word } from '../types';
import { canArticle, canCloze, canPerfekt, canPlural, genForWord, type GenKind } from './questionGen';
import { shuffle, weightedSample } from './util';
import { allWords, errorRate, isDue, mastery } from './words';

export type ExamMode = 'karma' | 'error' | 'kasus' | 'grammar' | 'dialogue' | 'reading' | 'vocab' | 'mistakes';

export const EXAM_MODES: { id: ExamMode; title: string; desc: string; icon: string }[] = [
  { id: 'karma', title: 'Karma Sınav', desc: 'Goethe dağılımı: hata avı, kasus, gramer, diyalog, okuma, kelime', icon: '🎯' },
  { id: 'error', title: 'Fehleranalyse', desc: 'Gerçek öğrenci hatalarını yakala', icon: '🔍' },
  { id: 'kasus', title: 'Kasus & Edatlar', desc: 'wo/wohin, mit + Dativ, fiil + edat', icon: '📍' },
  { id: 'grammar', title: 'Gramer & Bağlaçlar', desc: 'weil/dass/obwohl, Perfekt, Präteritum, çoğullar', icon: '⚙️' },
  { id: 'dialogue', title: 'Günlük Diyaloglar', desc: 'Doktor, istasyon, restoran, ev arama', icon: '💬' },
  { id: 'reading', title: 'Okuma & Satzbau', desc: 'Duyuru, ilan, e-posta, cümle kurma', icon: '📖' },
  { id: 'vocab', title: 'Kelime Testi', desc: 'Anlam, artikel, bağlamda kelime', icon: '🧠' },
  { id: 'mistakes', title: 'Hata Tekrarı', desc: 'Yanlış yaptığın sorular ve zayıf kelimeler', icon: '♻️' },
];

export const CATEGORY_TR: Record<QuestionCategory, string> = {
  error_detection: 'Hata Avı (Fehleranalyse)',
  prepositions_kasus: 'Kasus & Edatlar',
  grammar: 'Gramer & Bağlaçlar',
  dialogue: 'Günlük Diyaloglar',
  reading: 'Okuduğunu Anlama',
  sentence_syntax: 'Cümle Kurma (Satzbau)',
  vocabulary: 'Kelime Bilgisi',
};

export const CATEGORY_ICON: Record<QuestionCategory, string> = {
  error_detection: '🔍',
  prepositions_kasus: '📍',
  grammar: '⚙️',
  dialogue: '💬',
  reading: '📖',
  sentence_syntax: '🧱',
  vocabulary: '🧠',
};

function ruleWeight(state: AppState, q: Question): number {
  const r = state.rules[q.id];
  const tr = q.targetRule ? state.rules['rule:' + q.targetRule] : undefined;
  let w = r ? 1 : 1.7; // hiç görülmemiş sorular öne
  if (r && r.correct + r.wrong > 0) w += 4 * (r.wrong / (r.correct + r.wrong));
  if (tr && tr.correct + tr.wrong > 0) w += 1.5 * (tr.wrong / (tr.correct + tr.wrong));
  if (r && Date.now() - r.last < 10 * 60 * 1000 && r.wrong === 0) w *= 0.3; // az önce doğru bilinmiş
  return w;
}

function annotate(state: AppState, q: Question): Question {
  const r = state.rules[q.id];
  const wp = q.wordId ? state.words[q.wordId] : undefined;
  const er = r && r.correct + r.wrong > 0 ? Math.round((r.wrong / (r.correct + r.wrong)) * 100) : wp ? errorRate(wp) : 0;
  const prio = (r?.wrong || 0) > 0 || (wp?.wrong || 0) > 0;
  return { ...q, isErrorPriority: prio, errorRateContext: prio ? er : undefined };
}

function pickBank(state: AppState, pool: Question[], n: number): Question[] {
  return weightedSample(pool, (q) => ruleWeight(state, q), n);
}

/** Okuma sorularında aynı metinden en fazla 2 soru. */
function pickReading(state: AppState, n: number): Question[] {
  const pool = [...READING_QUESTIONS, ...LONG_READING_QUESTIONS];
  const ordered = weightedSample(pool, (q) => ruleWeight(state, q), pool.length);
  const perText = new Map<string, number>();
  const out: Question[] = [];
  for (const q of ordered) {
    const key = q.readingText || q.id;
    const c = perText.get(key) || 0;
    if (c >= 2) continue;
    perText.set(key, c + 1);
    out.push(q);
    if (out.length >= n) break;
  }
  return out;
}

function wordWeight(state: AppState, w: Word): number {
  const p = state.words[w.id];
  const m = mastery(p);
  let base = m === 'weak' ? 6 : m === 'new' ? 1.5 : m === 'learning' ? 2 : 0.6;
  if (isDue(p)) base += 2;
  if (state.worksheetQueue.includes(w.id)) base += 2;
  return base;
}

export function genVocab(state: AppState, n: number, kinds: GenKind[], theme?: string, onlyIds?: string[]): Question[] {
  const all = allWords(state.customWords);
  let pool = all.filter((w) => w.source !== 'Gruppe' || canArticle(w));
  if (theme) pool = pool.filter((w) => w.theme === theme);
  if (onlyIds) pool = pool.filter((w) => onlyIds.includes(w.id));
  const usable = pool.filter((w) =>
    kinds.some(
      (k) =>
        (k === 'meaning' || k === 'reverse') ||
        (k === 'article' && canArticle(w)) ||
        (k === 'plural' && canPlural(w)) ||
        (k === 'perfekt' && canPerfekt(w)) ||
        (k === 'cloze' && canCloze(w)),
    ),
  );
  const chosen = weightedSample(usable, (w) => wordWeight(state, w), Math.min(usable.length, n * 2));
  const out: Question[] = [];
  for (const w of chosen) {
    const q = genForWord(w, all, kinds);
    if (q) out.push(q);
    if (out.length >= n) break;
  }
  return out;
}

export interface BuildOptions {
  mode: ExamMode;
  count: number;
  theme?: string;
}

export function buildExam(state: AppState, { mode, count, theme }: BuildOptions): Question[] {
  let qs: Question[] = [];
  const n = count;
  switch (mode) {
    case 'error':
      qs = pickBank(state, ERROR_QUESTIONS, n);
      break;
    case 'kasus':
      qs = pickBank(state, KASUS_QUESTIONS, n);
      break;
    case 'grammar': {
      const bankN = Math.round(n * 0.65);
      qs = [...pickBank(state, GRAMMAR_QUESTIONS, bankN), ...genVocab(state, n - bankN, ['perfekt', 'plural'], theme)];
      break;
    }
    case 'dialogue':
      qs = pickBank(state, DIALOGUE_QUESTIONS, n);
      break;
    case 'reading': {
      const synN = Math.round(n * 0.35);
      qs = [...pickBank(state, SYNTAX_QUESTIONS, synN), ...pickReading(state, n - synN)];
      break;
    }
    case 'vocab':
      qs = genVocab(state, n, ['meaning', 'reverse', 'article', 'cloze', 'cloze'], theme);
      break;
    case 'mistakes': {
      const ms = state.mistakes
        .slice()
        .sort((a, b) => b.count - a.count || b.last - a.last)
        .slice(0, n)
        .map((m) => m.question);
      const weakIds = allWords(state.customWords)
        .filter((w) => mastery(state.words[w.id]) === 'weak' || state.worksheetQueue.includes(w.id))
        .map((w) => w.id);
      const fill = n - ms.length;
      const extra = fill > 0 && weakIds.length ? genVocab(state, fill, ['meaning', 'reverse', 'cloze', 'article'], undefined, weakIds) : [];
      qs = [...ms, ...extra];
      break;
    }
    case 'karma':
    default: {
      // Goethe dağılımı: hata avı %25, kasus %20, gramer %20, diyalog %15, okuma+satzbau %10, kelime %10
      const plan: [number, () => Question[]][] = [];
      const cErr = Math.round(n * 0.25);
      const cKas = Math.round(n * 0.2);
      const cGra = Math.round(n * 0.2);
      const cDia = Math.round(n * 0.15);
      const cRead = Math.max(1, Math.round(n * 0.1));
      const cVoc = Math.max(0, n - cErr - cKas - cGra - cDia - cRead);
      plan.push([cErr, () => pickBank(state, ERROR_QUESTIONS, cErr)]);
      plan.push([cKas, () => pickBank(state, KASUS_QUESTIONS, cKas)]);
      plan.push([
        cGra,
        () => {
          const g = Math.ceil(cGra * 0.7);
          return [...pickBank(state, GRAMMAR_QUESTIONS, g), ...genVocab(state, cGra - g, ['perfekt', 'plural'], theme)];
        },
      ]);
      plan.push([cDia, () => pickBank(state, DIALOGUE_QUESTIONS, cDia)]);
      plan.push([
        cRead,
        () => {
          const s = Math.floor(cRead / 2);
          return [...pickBank(state, SYNTAX_QUESTIONS, s), ...pickReading(state, cRead - s)];
        },
      ]);
      plan.push([cVoc, () => genVocab(state, cVoc, ['cloze', 'meaning', 'reverse', 'article'], theme)]);
      for (const [, fn] of plan) qs.push(...fn());
      if (qs.length < n) qs.push(...genVocab(state, n - qs.length, ['meaning', 'cloze'], theme));
    }
  }
  // tekrar edenleri ayıkla
  const seen = new Set<string>();
  qs = qs.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true))).slice(0, n);
  // okuma soruları sona, aynı metin ardışık
  const reading = qs.filter((q) => q.readingText);
  const others = shuffle(qs.filter((q) => !q.readingText));
  reading.sort((a, b) => (a.readingText! < b.readingText! ? -1 : a.readingText! > b.readingText! ? 1 : 0));
  return [...others, ...reading].map((q) => annotate(state, q));
}

export function examTitle(mode: ExamMode, theme?: string): string {
  const m = EXAM_MODES.find((x) => x.id === mode);
  return `Goethe A2 – ${m?.title || 'Prüfung'}${theme ? ` · ${theme}` : ''}`;
}
