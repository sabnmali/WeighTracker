/** Android WebView köprüsü (MainActivity.Bridge) ve tarayıcı yedekleri. */

interface AndroidBridge {
  isNative(): boolean;
  getAppVersion(): string;
  ttsStatus(): string;
  speak(text: string, rate: number): boolean;
  stopSpeaking(): void;
  openTtsSettings(): void;
  toast(msg: string): void;
  copyText(text: string): void;
  shareText(title: string, text: string): void;
  saveFile(name: string, mime: string, content: string): void;
  printPage(job: string): void;
  httpRequest(id: string, method: string, url: string, headersJson: string, body: string): void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge;
    __nativeHttpCallback?: (id: string, status: number, body: string) => void;
    __onNativeSave?: (ok: boolean) => void;
    __handleBack?: () => boolean;
  }
}

export const bridge: AndroidBridge | undefined = typeof window !== 'undefined' ? window.AndroidBridge : undefined;
export const isNative = !!bridge;

// ------------------------------------------------------------------ HTTP
const pending = new Map<string, (r: { status: number; body: string }) => void>();
if (typeof window !== 'undefined') {
  window.__nativeHttpCallback = (id, status, body) => {
    const cb = pending.get(id);
    if (cb) {
      pending.delete(id);
      cb({ status, body });
    }
  };
}

export async function httpPost(
  url: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; body: string }> {
  if (bridge) {
    const id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    return new Promise((resolve) => {
      pending.set(id, resolve);
      bridge.httpRequest(id, 'POST', url, JSON.stringify(headers), body);
    });
  }
  try {
    const res = await fetch(url, { method: 'POST', headers, body });
    return { status: res.status, body: await res.text() };
  } catch (e) {
    return { status: 0, body: String((e as Error)?.message || e) };
  }
}

// ------------------------------------------------------------------ TTS
let germanVoice: SpeechSynthesisVoice | null = null;
function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  germanVoice = voices.find((v) => v.lang === 'de-DE') || voices.find((v) => v.lang?.startsWith('de')) || null;
}
if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

/** Kelime gösterim biçimini sesli okunabilir hale getirir ("der Apfel, ¨-" → "der Apfel"). */
export function speakable(text: string): string {
  return text
    .replace(/\(Sg\.\)|\(Pl\.\)/g, '')
    .replace(/,\s*(¨?-[a-zäöüß]*|-)(\s|$)/gi, ' ')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type TtsResult = 'ok' | 'missing';

export function speak(text: string, rate = 0.9): TtsResult {
  const t = text.trim();
  if (!t) return 'ok';
  if (bridge) {
    try {
      if (bridge.speak(t, rate)) return 'ok';
    } catch {
      /* yedek yola geç */
    }
  }
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'de-DE';
    u.rate = rate;
    if (germanVoice) u.voice = germanVoice;
    speechSynthesis.speak(u);
    return 'ok';
  }
  return 'missing';
}

export function stopSpeaking() {
  try {
    bridge?.stopSpeaking();
  } catch {
    /* yok say */
  }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

export function ttsStatus(): string {
  if (bridge) {
    try {
      return bridge.ttsStatus();
    } catch {
      return 'unknown';
    }
  }
  return typeof speechSynthesis !== 'undefined' ? 'ready' : 'not_supported';
}

export function openTtsSettings() {
  bridge?.openTtsSettings();
}

// ------------------------------------------------------------------ Diğer
export function copyText(text: string): Promise<boolean> {
  if (bridge) {
    bridge.copyText(text);
    return Promise.resolve(true);
  }
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  }
  return Promise.resolve(false);
}

export function shareText(title: string, text: string) {
  if (bridge) {
    bridge.shareText(title, text);
    return;
  }
  if (navigator.share) {
    navigator.share({ title, text }).catch(() => undefined);
  } else {
    copyText(text);
  }
}

export function saveFile(name: string, mime: string, content: string): Promise<boolean> {
  if (bridge) {
    return new Promise((resolve) => {
      window.__onNativeSave = (ok) => resolve(ok);
      bridge.saveFile(name, mime, content);
    });
  }
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return Promise.resolve(true);
}

export function printPage(job: string) {
  if (bridge) bridge.printPage(job);
  else window.print();
}

export function appVersion(): string {
  try {
    return bridge?.getAppVersion() || '3.0.0 (web)';
  } catch {
    return '3.0.0';
  }
}
