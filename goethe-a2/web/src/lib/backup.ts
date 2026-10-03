import type { AppState } from '../types';
import { getState, replaceState, sanitizeState } from './store';

export function exportJson(): string {
  return JSON.stringify({ app: 'goethe-a2-trainer', exportedAt: new Date().toISOString(), state: getState() }, null, 1);
}

export function parseBackup(text: string): AppState {
  const raw = JSON.parse(text);
  const st = raw && raw.state ? raw.state : raw;
  if (!st || typeof st !== 'object' || !('words' in st || 'settings' in st)) throw new Error('Geçersiz yedek dosyası');
  return sanitizeState(st);
}

function byId<T>(a: T[], b: T[], key: (t: T) => string): T[] {
  const m = new Map<string, T>();
  [...b, ...a].forEach((x) => m.set(key(x), x));
  return [...m.values()];
}

/** İki yönlü akıllı birleştirme: hiçbir cihazdaki ilerleme silinmez (kelime başına en güncel kayıt kazanır). */
export function mergeState(local: AppState, incoming: AppState): AppState {
  const words = { ...local.words };
  for (const [id, p] of Object.entries(incoming.words)) {
    const l = words[id];
    if (!l || p.last > l.last) words[id] = p;
  }
  const rules = { ...local.rules };
  for (const [id, r] of Object.entries(incoming.rules)) {
    const l = rules[id];
    rules[id] = l ? { correct: Math.max(l.correct, r.correct), wrong: Math.max(l.wrong, r.wrong), last: Math.max(l.last, r.last) } : r;
  }
  const daily = { ...local.daily };
  for (const [k, d] of Object.entries(incoming.daily)) {
    const l = daily[k];
    daily[k] = l ? { cards: Math.max(l.cards, d.cards), questions: Math.max(l.questions, d.questions), correct: Math.max(l.correct, d.correct) } : d;
  }
  return {
    ...local,
    words,
    rules,
    daily,
    bookmarks: Array.from(new Set([...local.bookmarks, ...incoming.bookmarks])),
    customWords: byId(local.customWords, incoming.customWords, (w) => w.id),
    notes: { ...incoming.notes, ...local.notes },
    mistakes: byId(local.mistakes, incoming.mistakes, (m) => m.questionId).sort((a, b) => b.last - a.last),
    tests: byId(local.tests, incoming.tests, (t) => t.id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    writings: byId(local.writings, incoming.writings, (w) => w.id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    worksheetQueue: Array.from(new Set([...local.worksheetQueue, ...incoming.worksheetQueue])),
    settings: { ...incoming.settings, ...local.settings, apiKey: local.settings.apiKey || incoming.settings.apiKey },
  };
}

export function importBackup(text: string, mode: 'merge' | 'replace') {
  const incoming = parseBackup(text);
  replaceState(mode === 'merge' ? mergeState(getState(), incoming) : incoming);
}
