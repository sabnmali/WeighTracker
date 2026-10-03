import { useSyncExternalStore } from 'react';
import type { LongText } from '../data/readingTexts';
import type { WritingTask } from '../data/writingTasks';
import type { Question, QuestionCategory, Word } from '../types';
import { APP_VERSION, appVersion, httpRequest, isOnline } from './native';

/**
 * Uzaktan içerik güncellemesi: GitHub'daki `goethe-a2/content/content.json` dosyası
 * (veya Ayarlar'da girilen başka bir adres) okunur ve yeni APK kurmadan
 * kelime, soru, okuma metni ve yazma görevi eklenir/düzeltilir. Son indirilen içerik
 * cihazda saklanır; internet yokken de kullanılır.
 */

export interface RemoteContent {
  contentVersion: number;
  updatedAt?: string;
  message?: string;
  app?: { latestVersion: string; apkUrl?: string; notes?: string };
  words?: Word[];
  questions?: Question[];
  longTexts?: LongText[];
  writingTasks?: WritingTask[];
  removeQuestionIds?: string[];
  removeWordIds?: string[];
}

interface ContentMeta {
  content: RemoteContent | null;
  url?: string;
  lastCheck?: number;
  lastError?: string;
}

const KEY = 'goethe-a2-content-v1';
export const DEFAULT_CONTENT_URLS = [
  'https://raw.githubusercontent.com/sabnmali/WeighTracker/main/goethe-a2/content/content.json',
  'https://raw.githubusercontent.com/sabnmali/WeighTracker/ccr-ec1b1133-dmzxke/goethe-a2/content/content.json',
];
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

function load(): ContentMeta {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (m && typeof m === 'object') return { content: null, ...m };
  } catch {
    /* yok say */
  }
  return { content: null };
}

let meta: ContentMeta = load();
let version = meta.content?.contentVersion || 0;
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    /* depolama dolu */
  }
  version = meta.content?.contentVersion || 0;
  rebuild();
  listeners.forEach((l) => l());
}

export function useContentMeta(): ContentMeta {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => meta,
  );
}

export function contentVersion(): number {
  return version;
}

// ---------------------------------------------------------------- doğrulama
function validWord(w: Partial<Word>): w is Word {
  return !!(w && w.id && w.lemma && w.tr && w.type);
}

function validQuestion(q: Partial<Question>): q is Question {
  if (!q || !q.id || !q.question || !q.correctAnswer || !q.category || !q.type) return false;
  if (q.type === 'sentence_build') return Array.isArray(q.sentenceParts) && q.sentenceParts.join(' ') === q.correctAnswer;
  return Array.isArray(q.options) && q.options.includes(q.correctAnswer);
}

function validText(t: Partial<LongText>): t is LongText {
  return !!(t && t.id && t.title && t.text && Array.isArray(t.questions) && t.questions.every((q) => q.o?.includes(q.a)));
}

function validTask(t: Partial<WritingTask>): t is WritingTask {
  return !!(t && t.id && t.situation && Array.isArray(t.bullets) && t.model && t.minWords && t.maxWords);
}

// ---------------------------------------------------------------- türetilmiş içerik
let words: Word[] = [];
let questions: Question[] = [];
let texts: LongText[] = [];
let tasks: WritingTask[] = [];
let removedQ = new Set<string>();
let removedW = new Set<string>();

function rebuild() {
  const c = meta.content;
  words = (c?.words || [])
    .filter(validWord)
    .map((w) => ({ ...w, examples: w.examples || [], theme: w.theme || 'Allgemein', source: w.source || 'A2' }));
  questions = (c?.questions || []).filter(validQuestion).map((q) => ({ ...q, source: 'bank' as const }));
  texts = (c?.longTexts || []).filter(validText);
  tasks = (c?.writingTasks || []).filter(validTask);
  removedQ = new Set(c?.removeQuestionIds || []);
  removedW = new Set(c?.removeWordIds || []);
}
rebuild();

export const contentWords = () => words;
export const isWordRemoved = (id: string) => removedW.has(id);
export const isQuestionRemoved = (id: string) => removedQ.has(id);
export const contentQuestions = (cat: QuestionCategory) => questions.filter((q) => q.category === cat);
export const contentLongTexts = () => texts;
export const contentWritingTasks = () => tasks;

// ---------------------------------------------------------------- sürüm
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

export function availableUpdate(): RemoteContent['app'] | null {
  const app = meta.content?.app;
  if (!app?.latestVersion) return null;
  const current = appVersion().replace(/[^\d.]/g, '') || APP_VERSION;
  return cmpVersion(app.latestVersion, current) > 0 ? app : null;
}

// ---------------------------------------------------------------- indirme
export function setContentUrl(url: string) {
  meta = { ...meta, url: url.trim() || undefined };
  save();
}

export interface CheckResult {
  updated: boolean;
  message: string;
}

export async function checkContent(force = false): Promise<CheckResult> {
  if (!isOnline()) return { updated: false, message: 'İnternet yok; son indirilen içerik kullanılıyor.' };
  if (!force && meta.lastCheck && Date.now() - meta.lastCheck < CHECK_EVERY_MS) return { updated: false, message: 'Yakın zamanda kontrol edildi.' };
  const urls = meta.url ? [meta.url] : DEFAULT_CONTENT_URLS;
  let lastErr = 'İçerik dosyasına ulaşılamadı.';
  for (const url of urls) {
    const res = await httpRequest('GET', url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
    if (res.status !== 200) {
      lastErr = res.status === 0 ? 'İnternet bağlantısı yok.' : `İçerik bulunamadı (${res.status}).`;
      continue;
    }
    try {
      const data = JSON.parse(res.body) as RemoteContent;
      if (typeof data.contentVersion !== 'number') throw new Error('contentVersion eksik');
      const prev = meta.content?.contentVersion || 0;
      const updated = data.contentVersion > prev || (data.contentVersion === prev && JSON.stringify(data.app) !== JSON.stringify(meta.content?.app));
      const prevCounts = { w: words.length, q: questions.length, t: texts.length };
      meta = { ...meta, content: updated ? data : meta.content, lastCheck: Date.now(), lastError: undefined };
      save();
      if (!updated) return { updated: false, message: 'İçerik güncel.' };
      const parts = [
        words.length - prevCounts.w > 0 ? `${words.length - prevCounts.w} kelime` : '',
        questions.length - prevCounts.q > 0 ? `${questions.length - prevCounts.q} soru` : '',
        texts.length - prevCounts.t > 0 ? `${texts.length - prevCounts.t} okuma metni` : '',
      ].filter(Boolean);
      return { updated: true, message: data.message || (parts.length ? `Yeni içerik: ${parts.join(', ')}` : 'İçerik güncellendi.') };
    } catch (e) {
      lastErr = `İçerik dosyası okunamadı: ${(e as Error).message}`;
    }
  }
  meta = { ...meta, lastCheck: Date.now(), lastError: lastErr };
  save();
  return { updated: false, message: lastErr };
}

let started = false;
export function startContentUpdates(onUpdate: (msg: string) => void) {
  if (started || typeof window === 'undefined') return;
  started = true;
  const run = (force = false) =>
    checkContent(force).then((r) => {
      if (r.updated) onUpdate(r.message);
    });
  void run();
  window.addEventListener('online', () => void run());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void run();
  });
}
