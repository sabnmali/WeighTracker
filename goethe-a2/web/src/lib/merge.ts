import { DEFAULT_SETTINGS } from './store';
import type { AppState, DayStat, MistakeEntry, RuleProgress, WordProgress } from '../types';

/**
 * Üç yönlü birleştirme (L = yerel, R = bulut, B = son ortak eşitleme anı).
 * - Sayaçlar: L + R − B  → iki cihazdaki çalışmalar kaybolmadan toplanır.
 * - Kutu/vade gibi durum alanları: en son güncellenen kazanır.
 * - Kümeler ve kayıtlar: bir tarafta silinen öğe (B'de olup) silinmiş sayılır.
 */

/** Eşitlenen durum: sınavlar ve yazılar ayrı belgelerde tutulduğu için burada yok. */
export type SyncedState = Omit<AppState, 'tests' | 'writings' | 'version'>;

export interface BaseSnapshot {
  words: Record<string, WordProgress>;
  rules: Record<string, RuleProgress>;
  daily: Record<string, DayStat>;
  bookmarks: string[];
  worksheetQueue: string[];
  customWordIds: string[];
  notes: AppState['notes'];
  settings: AppState['settings'];
  mistakes: Record<string, { last: number; count: number }>;
}

export function emptyBase(): BaseSnapshot {
  return {
    words: {},
    rules: {},
    daily: {},
    bookmarks: [],
    worksheetQueue: [],
    customWordIds: [],
    notes: {},
    settings: {} as AppState['settings'],
    mistakes: {},
  };
}

export function toSynced(s: AppState): SyncedState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tests, writings, version, ...rest } = s;
  return rest;
}

export function toBase(s: SyncedState): BaseSnapshot {
  const mistakes: BaseSnapshot['mistakes'] = {};
  for (const m of s.mistakes) mistakes[m.questionId] = { last: m.last, count: m.count };
  return {
    words: s.words,
    rules: s.rules,
    daily: s.daily,
    bookmarks: s.bookmarks,
    worksheetQueue: s.worksheetQueue,
    customWordIds: s.customWords.map((w) => w.id),
    notes: s.notes,
    settings: s.settings,
    mistakes,
  };
}

const c3 = (l = 0, r = 0, b = 0) => Math.max(0, l + r - b);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function keys(...objs: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  objs.forEach((o) => Object.keys(o || {}).forEach((k) => set.add(k)));
  return [...set];
}

/** Bir tarafta silinmiş (base'de var, o tarafta yok, diğer taraf base'den beri değişmemiş) mi? */
function deleted<T>(l: T | undefined, r: T | undefined, b: T | undefined, changed: (x: T, b: T) => boolean): boolean {
  if (b === undefined) return false;
  if (l === undefined && (r === undefined || !changed(r, b))) return true;
  if (r === undefined && (l === undefined || !changed(l, b))) return true;
  return false;
}

function mergeWords(L: Record<string, WordProgress>, R: Record<string, WordProgress>, B: Record<string, WordProgress>) {
  const out: Record<string, WordProgress> = {};
  for (const id of keys(L, R, B)) {
    const l = L[id];
    const r = R[id];
    const b = B[id];
    if (deleted(l, r, b, (x, y) => x.last > y.last)) continue;
    if (!l || !r) {
      const one = (l || r)!;
      out[id] = one;
      continue;
    }
    const base = b || { box: 0, due: 0, seen: 0, correct: 0, wrong: 0, last: 0 };
    const newer = l.last >= r.last ? l : r;
    out[id] = {
      box: newer.box,
      due: newer.due,
      last: Math.max(l.last, r.last),
      seen: c3(l.seen, r.seen, base.seen),
      correct: c3(l.correct, r.correct, base.correct),
      wrong: c3(l.wrong, r.wrong, base.wrong),
    };
  }
  return out;
}

function mergeRules(L: Record<string, RuleProgress>, R: Record<string, RuleProgress>, B: Record<string, RuleProgress>) {
  const out: Record<string, RuleProgress> = {};
  for (const k of keys(L, R, B)) {
    const l = L[k];
    const r = R[k];
    const b = B[k];
    if (!l && !r) continue;
    if (!l || !r) {
      out[k] = (l || r)!;
      continue;
    }
    out[k] = { correct: c3(l.correct, r.correct, b?.correct), wrong: c3(l.wrong, r.wrong, b?.wrong), last: Math.max(l.last, r.last) };
  }
  return out;
}

function mergeDaily(L: Record<string, DayStat>, R: Record<string, DayStat>, B: Record<string, DayStat>) {
  const out: Record<string, DayStat> = {};
  for (const k of keys(L, R, B)) {
    const l = L[k];
    const r = R[k];
    const b = B[k];
    if (!l || !r) {
      if (l || r) out[k] = (l || r)!;
      continue;
    }
    out[k] = { cards: c3(l.cards, r.cards, b?.cards), questions: c3(l.questions, r.questions, b?.questions), correct: c3(l.correct, r.correct, b?.correct) };
  }
  return out;
}

function mergeSet(L: string[], R: string[], B: string[]): string[] {
  const inL = new Set(L);
  const inR = new Set(R);
  const inB = new Set(B);
  const keep = (x: string) => (inL.has(x) && inR.has(x)) || (inL.has(x) && !inB.has(x)) || (inR.has(x) && !inB.has(x));
  return Array.from(new Set([...L, ...R])).filter(keep);
}

/** Alan bazında: yerel taraf base'den farklıysa yerel kazanır, değilse bulut. */
function mergeFields<T extends Record<string, unknown>>(L: T, R: T, B: Partial<T>, defaults: Record<string, unknown> = {}): T {
  const out = {} as Record<string, unknown>;
  const hasBase = Object.keys(B).length > 0;
  for (const k of keys(L, R, B as Record<string, unknown>)) {
    const l = L[k];
    const r = R[k];
    const b = (B as Record<string, unknown>)[k];
    // İlk eşitlemede (base yok) varsayılan değerde kalan yerel alan buluttakini ezmesin.
    const localChanged = hasBase ? !same(l, b) : !same(l, defaults[k]);
    const v = localChanged || r === undefined ? l : r;
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function mergeMistakes(L: MistakeEntry[], R: MistakeEntry[], B: BaseSnapshot['mistakes']): MistakeEntry[] {
  const lm = new Map(L.map((m) => [m.questionId, m]));
  const rm = new Map(R.map((m) => [m.questionId, m]));
  const out: MistakeEntry[] = [];
  for (const id of new Set([...lm.keys(), ...rm.keys(), ...Object.keys(B)])) {
    const l = lm.get(id);
    const r = rm.get(id);
    const b = B[id];
    if (b && deleted(l, r, { last: b.last } as MistakeEntry, (x, y) => x.last > y.last)) continue;
    if (!l || !r) {
      if (l || r) out.push((l || r)!);
      continue;
    }
    const newer = l.last >= r.last ? l : r;
    out.push({ ...newer, count: c3(l.count, r.count, b?.count), last: Math.max(l.last, r.last) });
  }
  return out.sort((a, b) => b.last - a.last).slice(0, 250);
}

export function merge3(L: SyncedState, R: SyncedState, B: BaseSnapshot): SyncedState {
  const customIds = mergeSet(
    L.customWords.map((w) => w.id),
    R.customWords.map((w) => w.id),
    B.customWordIds,
  );
  const allCustom = new Map([...R.customWords, ...L.customWords].map((w) => [w.id, w]));
  const lw = L.lastWorksheet;
  const rw = R.lastWorksheet;
  return {
    ...L,
    words: mergeWords(L.words, R.words, B.words),
    rules: mergeRules(L.rules, R.rules, B.rules),
    daily: mergeDaily(L.daily, R.daily, B.daily),
    bookmarks: mergeSet(L.bookmarks, R.bookmarks, B.bookmarks),
    worksheetQueue: mergeSet(L.worksheetQueue, R.worksheetQueue, B.worksheetQueue),
    customWords: customIds.map((id) => allCustom.get(id)!).filter(Boolean),
    notes: mergeFields(L.notes, R.notes, B.notes),
    settings: mergeFields(L.settings as unknown as Record<string, unknown>, R.settings as unknown as Record<string, unknown>, B.settings as unknown as Record<string, unknown>, DEFAULT_SETTINGS as unknown as Record<string, unknown>) as unknown as AppState['settings'],
    mistakes: mergeMistakes(L.mistakes, R.mistakes, B.mistakes),
    lastWorksheet: !lw ? rw : !rw ? lw : lw.date >= rw.date ? lw : rw,
  };
}

/** Kayıt listesi birleşimi (sınavlar, yazılar – değişmez kayıtlar). */
export function unionById<T extends { id: string; date: string }>(a: T[], b: T[], cap: number): T[] {
  const m = new Map<string, T>();
  [...b, ...a].forEach((x) => m.set(x.id, x));
  return [...m.values()].sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, cap);
}
