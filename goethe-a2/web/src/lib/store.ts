import { useSyncExternalStore } from 'react';
import type {
  AppState,
  MistakeEntry,
  Question,
  Settings,
  TestSummary,
  Word,
  WordProgress,
  WritingAttempt,
} from '../types';
import { todayKey } from './util';

const STORAGE_KEY = 'goethe-a2-trainer-v3';
const DAY = 24 * 60 * 60 * 1000;
/** Leitner kutusu → bir sonraki tekrar aralığı (gün). */
export const BOX_INTERVALS = [0, 1, 2, 4, 8, 16, 32];
export const MAX_BOX = BOX_INTERVALS.length - 1;

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  ttsRate: 0.9,
  dailyGoal: 30,
  examDate: '',
  theme: 'system',
  instantFeedback: true,
  showTranslations: true,
  newCardsPerDay: 15,
  userName: '',
};

function defaultState(): AppState {
  return {
    version: 3,
    words: {},
    rules: {},
    bookmarks: [],
    customWords: [],
    notes: {},
    mistakes: [],
    tests: [],
    writings: [],
    worksheetQueue: [],
    daily: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function sanitizeState(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    ...base,
    ...r,
    version: 3,
    words: r.words && typeof r.words === 'object' ? r.words : {},
    rules: r.rules && typeof r.rules === 'object' ? r.rules : {},
    bookmarks: Array.isArray(r.bookmarks) ? r.bookmarks : [],
    customWords: Array.isArray(r.customWords) ? r.customWords : [],
    notes: r.notes && typeof r.notes === 'object' ? r.notes : {},
    mistakes: Array.isArray(r.mistakes) ? r.mistakes : [],
    tests: Array.isArray(r.tests) ? r.tests : [],
    writings: Array.isArray(r.writings) ? r.writings : [],
    worksheetQueue: Array.isArray(r.worksheetQueue) ? r.worksheetQueue : [],
    daily: r.daily && typeof r.daily === 'object' ? r.daily : {},
    settings: { ...DEFAULT_SETTINGS, ...(r.settings || {}) },
  };
}

function load(): AppState {
  try {
    const txt = localStorage.getItem(STORAGE_KEY);
    if (!txt) return defaultState();
    return sanitizeState(JSON.parse(txt));
  } catch {
    return defaultState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* depolama dolu ya da erişilemez */
    }
  }, 250);
}

export function flushSave() {
  if (saveTimer) window.clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* yok say */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
}

export function getState(): AppState {
  return state;
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export function replaceState(next: AppState) {
  state = sanitizeState(next);
  flushSave();
  listeners.forEach((l) => l());
}

export function resetState() {
  replaceState(defaultState());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Durum her değiştiğinde çağrılır (eşitleme tetikleyicisi için). */
export function subscribeStore(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

// ---------------------------------------------------------------- eylemler

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function bumpDaily(kind: 'cards' | 'questions', correct: boolean) {
  const key = todayKey();
  setState((s) => {
    const d = s.daily[key] || { cards: 0, questions: 0, correct: 0 };
    return {
      ...s,
      daily: {
        ...s.daily,
        [key]: { ...d, [kind]: d[kind] + 1, correct: d.correct + (correct ? 1 : 0) },
      },
    };
  });
}

function emptyProgress(): WordProgress {
  return { box: 0, due: 0, seen: 0, correct: 0, wrong: 0, last: 0 };
}

/** Kart değerlendirmesi: "Biliyorum" kutuyu artırır, "Tekrar" kutu 1'e döner. */
export function gradeCard(wordId: string, known: boolean) {
  const now = Date.now();
  setState((s) => {
    const p = { ...(s.words[wordId] || emptyProgress()) };
    p.seen += 1;
    p.last = now;
    if (known) {
      p.correct += 1;
      p.box = Math.min(MAX_BOX, p.box + 1);
      p.due = now + BOX_INTERVALS[p.box] * DAY;
    } else {
      p.wrong += 1;
      p.box = 1;
      p.due = now; // aynı gün tekrar
    }
    return { ...s, words: { ...s.words, [wordId]: p } };
  });
  bumpDaily('cards', known);
}

/** Sınav sorusundan gelen kelime sonucu (kutuyu daha yumuşak etkiler). */
export function recordWordResult(wordId: string, correct: boolean) {
  const now = Date.now();
  setState((s) => {
    const p = { ...(s.words[wordId] || emptyProgress()) };
    p.seen += 1;
    p.last = now;
    if (correct) {
      p.correct += 1;
      if (p.box === 0) {
        p.box = 1;
        p.due = now + DAY;
      }
    } else {
      p.wrong += 1;
      p.box = 1;
      p.due = now;
    }
    return { ...s, words: { ...s.words, [wordId]: p } };
  });
}

export function recordRuleResult(ruleKey: string, correct: boolean) {
  setState((s) => {
    const r = s.rules[ruleKey] || { correct: 0, wrong: 0, last: 0 };
    return {
      ...s,
      rules: {
        ...s.rules,
        [ruleKey]: {
          correct: r.correct + (correct ? 1 : 0),
          wrong: r.wrong + (correct ? 0 : 1),
          last: Date.now(),
        },
      },
    };
  });
}

export function registerAnswer(q: Question, userAnswer: string, correct: boolean) {
  recordRuleResult(q.id, correct);
  if (q.targetRule) recordRuleResult('rule:' + q.targetRule, correct);
  if (q.wordId) recordWordResult(q.wordId, correct);
  bumpDaily('questions', correct);
  setState((s) => {
    const idx = s.mistakes.findIndex((m) => m.questionId === q.id);
    let mistakes = s.mistakes.slice();
    if (!correct) {
      const entry: MistakeEntry =
        idx >= 0
          ? { ...mistakes[idx], userAnswer, count: mistakes[idx].count + 1, last: Date.now(), fixedStreak: 0 }
          : { questionId: q.id, question: q, userAnswer, count: 1, last: Date.now(), fixedStreak: 0 };
      if (idx >= 0) mistakes.splice(idx, 1);
      mistakes.unshift(entry);
      mistakes = mistakes.slice(0, 250);
    } else if (idx >= 0) {
      const m = { ...mistakes[idx], fixedStreak: mistakes[idx].fixedStreak + 1 };
      if (m.fixedStreak >= 2) mistakes.splice(idx, 1);
      else mistakes[idx] = m;
    }
    return { ...s, mistakes };
  });
}

export function removeMistake(questionId: string) {
  setState((s) => ({ ...s, mistakes: s.mistakes.filter((m) => m.questionId !== questionId) }));
}

export function clearMistakes() {
  setState((s) => ({ ...s, mistakes: [] }));
}

export function addTest(t: TestSummary) {
  setState((s) => ({ ...s, tests: [t, ...s.tests].slice(0, 60) }));
}

export function toggleBookmark(wordId: string) {
  setState((s) => ({
    ...s,
    bookmarks: s.bookmarks.includes(wordId) ? s.bookmarks.filter((b) => b !== wordId) : [...s.bookmarks, wordId],
  }));
}

export function addToWorksheetQueue(ids: string[]) {
  setState((s) => ({
    ...s,
    worksheetQueue: Array.from(new Set([...ids, ...s.worksheetQueue])).slice(0, 60),
  }));
}

export function clearWorksheetQueue() {
  setState((s) => ({ ...s, worksheetQueue: [] }));
}

export function addCustomWords(words: Word[]) {
  setState((s) => {
    const existing = new Set(s.customWords.map((w) => w.id));
    const fresh = words.filter((w) => !existing.has(w.id));
    return { ...s, customWords: [...s.customWords, ...fresh] };
  });
}

export function deleteCustomWord(id: string) {
  setState((s) => ({ ...s, customWords: s.customWords.filter((w) => w.id !== id) }));
}

export function setWordNote(id: string, patch: { note?: string; hook?: string }) {
  setState((s) => ({ ...s, notes: { ...s.notes, [id]: { ...(s.notes[id] || {}), ...patch } } }));
}

export function addWriting(w: WritingAttempt) {
  setState((s) => ({ ...s, writings: [w, ...s.writings].slice(0, 50) }));
}

export function saveWorksheet(ws: AppState['lastWorksheet']) {
  setState((s) => ({ ...s, lastWorksheet: ws }));
}

export function resetWordProgress(id: string) {
  setState((s) => {
    const words = { ...s.words };
    delete words[id];
    return { ...s, words };
  });
}
