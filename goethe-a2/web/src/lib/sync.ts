import { useSyncExternalStore } from 'react';
import type { AppState, TestSummary, WritingAttempt } from '../types';
import {
  ConflictError,
  FirebaseError,
  batchGet,
  commit,
  refreshSession,
  signIn,
  signUp,
  type FirebaseConfig,
  type FirebaseSession,
  type WriteOp,
} from './firebase';
import { emptyBase, merge3, toBase, toSynced, unionById, type BaseSnapshot, type SyncedState } from './merge';
import { isOnline } from './native';
import { getState, replaceState, sanitizeState, subscribeStore } from './store';

/**
 * Çevrimdışı öncelikli eşitleme:
 * - Uygulama her zaman yerel veriyle çalışır.
 * - İnternet varken değişikliklerden ~3 sn sonra, uygulama öne gelince, bağlantı geri gelince
 *   ve açıkken her 45 sn'de bir buluttaki veriyle üç yönlü birleştirme yapılır.
 * - Firestore yazmaları sürüm (updateTime) koşuluyla yapılır; iki cihaz aynı anda yazarsa yeniden denenir.
 */

const META_KEY = 'goethe-a2-sync-v1';
const MAX_TESTS = 60;
const MAX_WRITINGS = 50;
const DEBOUNCE_MS = 3000;
const HEARTBEAT_MS = 45000;

export interface SyncMeta {
  config?: FirebaseConfig;
  session?: FirebaseSession;
  base?: BaseSnapshot;
  baseUid?: string;
  remoteTestIds: string[];
  remoteWritingIds: string[];
  lastSync?: number;
  deviceId: string;
}

export type SyncPhase = 'off' | 'signedOut' | 'idle' | 'pending' | 'syncing' | 'offline' | 'error';

export interface SyncStatus {
  phase: SyncPhase;
  lastSync?: number;
  error?: string;
  email?: string;
  lastResult?: string;
}

function loadMeta(): SyncMeta {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) || 'null');
    if (m && typeof m === 'object') return { remoteTestIds: [], remoteWritingIds: [], deviceId: newDeviceId(), ...m };
  } catch {
    /* yok say */
  }
  return { remoteTestIds: [], remoteWritingIds: [], deviceId: newDeviceId() };
}

function newDeviceId() {
  const ua = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) ? 'android' : 'web';
  return `${ua}-${Math.random().toString(36).slice(2, 8)}`;
}

let meta: SyncMeta = loadMeta();
function saveMeta() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* depolama dolu */
  }
}
saveMeta();

let status: SyncStatus = computeIdleStatus();
const listeners = new Set<() => void>();
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch, email: meta.session?.email, lastSync: meta.lastSync };
  listeners.forEach((l) => l());
}
function computeIdleStatus(): SyncStatus {
  if (!meta.config) return { phase: 'off' };
  if (!meta.session) return { phase: 'signedOut' };
  return { phase: 'idle', email: meta.session.email, lastSync: meta.lastSync };
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

export function getSyncMeta(): Readonly<SyncMeta> {
  return meta;
}

// ---------------------------------------------------------------- yapılandırma & oturum
export function setConfig(cfg: FirebaseConfig | undefined) {
  if (!cfg || cfg.projectId !== meta.config?.projectId) {
    meta.session = undefined;
    meta.base = undefined;
    meta.baseUid = undefined;
    meta.remoteTestIds = [];
    meta.remoteWritingIds = [];
  }
  meta.config = cfg;
  saveMeta();
  setStatus(computeIdleStatus());
}

export async function login(email: string, password: string, create: boolean) {
  if (!meta.config) throw new FirebaseError('Önce Firebase yapılandırmasını gir.');
  const s = create ? await signUp(meta.config, email.trim(), password) : await signIn(meta.config, email.trim(), password);
  if (meta.baseUid !== s.uid) {
    meta.base = undefined;
    meta.remoteTestIds = [];
    meta.remoteWritingIds = [];
  }
  meta.session = s;
  saveMeta();
  setStatus({ phase: 'idle', error: undefined });
  await syncNow();
}

export function logout() {
  meta.session = undefined;
  meta.base = undefined;
  meta.baseUid = undefined;
  meta.remoteTestIds = [];
  meta.remoteWritingIds = [];
  saveMeta();
  setStatus(computeIdleStatus());
}

async function token(): Promise<string> {
  if (!meta.config || !meta.session) throw new FirebaseError('Oturum yok');
  if (meta.session.expiresAt - 60_000 < Date.now()) {
    meta.session = await refreshSession(meta.config, meta.session);
    saveMeta();
  }
  return meta.session.idToken;
}

// ---------------------------------------------------------------- eşitleme
interface MainDoc {
  schema: number;
  synced: Omit<SyncedState, 'mistakes'>;
  testIds: string[];
  writingIds: string[];
}

let running: Promise<void> | null = null;
let again = false;
let applying = false;

export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function syncOnce() {
  if (!meta.config || !meta.session) {
    setStatus(computeIdleStatus());
    return;
  }
  if (!isOnline()) {
    setStatus({ phase: 'offline' });
    return;
  }
  setStatus({ phase: 'syncing', error: undefined });
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await syncAttempt();
        setStatus({ phase: 'idle', error: undefined });
        return;
      } catch (e) {
        if (e instanceof ConflictError && attempt < 3) continue;
        throw e;
      }
    }
  } catch (e) {
    const fe = e as FirebaseError;
    if (fe.code === 'OFFLINE') setStatus({ phase: 'offline' });
    else {
      if (['INVALID_REFRESH_TOKEN', 'TOKEN_EXPIRED', 'USER_NOT_FOUND', 'USER_DISABLED'].includes(fe.code)) {
        meta.session = undefined;
        saveMeta();
      }
      setStatus({ phase: meta.session ? 'error' : 'signedOut', error: fe.message || String(e) });
    }
  }
}

async function syncAttempt() {
  const cfg = meta.config!;
  const tk = await token();
  const uid = meta.session!.uid;
  const P = `users/${uid}`;
  const mainRel = `${P}/state/main`;
  const mistRel = `${P}/state/mistakes`;

  const Lstart = getState();
  const docs = await batchGet(cfg, tk, [mainRel, mistRel]);
  const mainDoc = docs.get(mainRel);
  const mistDoc = docs.get(mistRel);
  const remoteMain = (mainDoc?.exists ? mainDoc.data : null) as MainDoc | null;

  const base = meta.baseUid === uid && meta.base ? meta.base : emptyBase();
  let M: SyncedState;
  if (remoteMain) {
    const R = toSynced(
      sanitizeState({ ...remoteMain.synced, mistakes: Array.isArray(mistDoc?.data) ? mistDoc!.data : [] }) as AppState,
    );
    M = merge3(toSynced(Lstart), R, base);
  } else {
    M = toSynced(Lstart);
  }

  // ---- sınavlar ve yazılar (değişmez kayıtlar, ayrı belgeler)
  const remoteTestIds = remoteMain?.testIds || [];
  const remoteWritingIds = remoteMain?.writingIds || [];
  const localTestIds = new Set(Lstart.tests.map((t) => t.id));
  const localWritingIds = new Set(Lstart.writings.map((w) => w.id));
  const fetchTests = remoteTestIds.filter((id) => !localTestIds.has(id)).slice(0, MAX_TESTS);
  const fetchWritings = remoteWritingIds.filter((id) => !localWritingIds.has(id)).slice(0, MAX_WRITINGS);
  const fetched = await batchGet(cfg, tk, [...fetchTests.map((id) => `${P}/tests/${id}`), ...fetchWritings.map((id) => `${P}/writings/${id}`)]);
  const downloadedTests: TestSummary[] = [];
  const downloadedWritings: WritingAttempt[] = [];
  fetched.forEach((d, rel) => {
    if (!d.exists || !d.data) return;
    if (rel.includes('/tests/')) downloadedTests.push(d.data as TestSummary);
    else downloadedWritings.push(d.data as WritingAttempt);
  });

  const remoteTestSet = new Set(remoteTestIds);
  const remoteWritingSet = new Set(remoteWritingIds);
  const uploads: WriteOp[] = [
    ...Lstart.tests.filter((t) => !remoteTestSet.has(t.id)).map((t) => ({ rel: `${P}/tests/${t.id}`, data: t })),
    ...Lstart.writings.filter((w) => !remoteWritingSet.has(w.id)).map((w) => ({ rel: `${P}/writings/${w.id}`, data: w })),
  ];
  for (let i = 0; i < uploads.length; i += 15) await commit(cfg, tk, uploads.slice(i, i + 15), meta.deviceId);

  const mergedTests = unionById(Lstart.tests, downloadedTests, MAX_TESTS);
  const mergedWritings = unionById(Lstart.writings, downloadedWritings, MAX_WRITINGS);
  const testIds = Array.from(new Set([...mergedTests.map((t) => t.id), ...remoteTestIds])).slice(0, 300);
  const writingIds = Array.from(new Set([...mergedWritings.map((w) => w.id), ...remoteWritingIds])).slice(0, 200);

  // ---- ana durum + hata defteri (sürüm koşullu, atomik)
  const { mistakes, ...rest } = M;
  const main: MainDoc = { schema: 1, synced: rest, testIds, writingIds };
  await commit(
    cfg,
    tk,
    [
      { rel: mainRel, data: main, expectUpdateTime: mainDoc?.exists ? mainDoc.updateTime : null },
      { rel: mistRel, data: mistakes, expectUpdateTime: mistDoc?.exists ? mistDoc.updateTime : null },
    ],
    meta.deviceId,
  );

  // ---- yerelde uygula (eşitleme sırasında yapılan değişiklikleri koru)
  const Lnow = getState();
  const final = merge3(toSynced(Lnow), M, toBase(toSynced(Lstart)));
  applying = true;
  try {
    replaceState({
      ...Lnow,
      ...final,
      tests: unionById(Lnow.tests, mergedTests, MAX_TESTS),
      writings: unionById(Lnow.writings, mergedWritings, MAX_WRITINGS),
    });
  } finally {
    applying = false;
  }
  meta.base = toBase(M);
  meta.baseUid = uid;
  meta.remoteTestIds = testIds;
  meta.remoteWritingIds = writingIds;
  meta.lastSync = Date.now();
  saveMeta();
  const got = downloadedTests.length + downloadedWritings.length;
  status = { ...status, lastResult: got ? `${got} yeni kayıt indirildi` : 'Güncel' };
}

// ---------------------------------------------------------------- otomatik tetikleme
let debounce: number | undefined;
let started = false;

export function startAutoSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  subscribeStore(() => {
    if (applying || !meta.session) return;
    if (status.phase === 'idle' || status.phase === 'error') setStatus({ phase: 'pending' });
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void syncNow(), DEBOUNCE_MS);
  });
  window.addEventListener('online', () => void syncNow());
  window.addEventListener('offline', () => meta.session && setStatus({ phase: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible' && meta.session) void syncNow();
  }, HEARTBEAT_MS);
  if (meta.session) void syncNow();
}
