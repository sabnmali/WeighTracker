/**
 * Firebase Authentication (e-posta/şifre) ve Cloud Firestore için hafif REST istemcisi.
 * SDK kullanılmaz: Android WebView'de ve çevrimdışıyken sorunsuz çalışması için tüm çağrılar
 * düz HTTPS (POST/GET) ile yapılır.
 */
import { httpRequest } from './native';

export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
}

export interface FirebaseSession {
  email: string;
  uid: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class FirebaseError extends Error {
  constructor(
    message: string,
    public code: string = '',
    public status = 0,
  ) {
    super(message);
  }
}

const AUTH_MESSAGES: Record<string, string> = {
  EMAIL_EXISTS: 'Bu e-posta ile zaten bir hesap var. „Giriş yap“ı kullan.',
  EMAIL_NOT_FOUND: 'Bu e-posta ile kayıtlı hesap yok. Önce „Hesap oluştur“.',
  INVALID_PASSWORD: 'Şifre hatalı.',
  INVALID_LOGIN_CREDENTIALS: 'E-posta veya şifre hatalı.',
  INVALID_EMAIL: 'E-posta adresi geçersiz.',
  WEAK_PASSWORD: 'Şifre en az 6 karakter olmalı.',
  USER_DISABLED: 'Bu hesap devre dışı bırakılmış.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
  OPERATION_NOT_ALLOWED: 'Firebase konsolunda „E-posta/Şifre“ giriş yöntemi etkin değil (Authentication → Sign-in method).',
  CONFIGURATION_NOT_FOUND: 'Firebase konsolunda Authentication henüz başlatılmamış (Authentication → Başlayın → E-posta/Şifre).',
  TOKEN_EXPIRED: 'Oturum süresi doldu, tekrar giriş yap.',
  INVALID_REFRESH_TOKEN: 'Oturum geçersiz, tekrar giriş yap.',
  USER_NOT_FOUND: 'Hesap bulunamadı, tekrar giriş yap.',
};

function parseError(status: number, body: string): FirebaseError {
  if (status === 0) return new FirebaseError('İnternet bağlantısı yok.', 'OFFLINE', 0);
  let code = '';
  let msg = '';
  try {
    const e = JSON.parse(body)?.error;
    msg = e?.message || '';
    code = String(e?.status || msg || '');
  } catch {
    msg = body.slice(0, 160);
  }
  const key = Object.keys(AUTH_MESSAGES).find((k) => msg.startsWith(k));
  if (key) return new FirebaseError(AUTH_MESSAGES[key], key, status);
  if (/API key not valid|API_KEY_INVALID/i.test(msg)) return new FirebaseError('Firebase API anahtarı geçersiz.', 'API_KEY', status);
  if (status === 403 || code === 'PERMISSION_DENIED')
    return new FirebaseError(
      /has not been used|is disabled|SERVICE_DISABLED/i.test(msg)
        ? 'Firestore veritabanı henüz oluşturulmamış (Firebase konsolu → Firestore Database → Veritabanı oluştur).'
        : 'Erişim reddedildi. Firestore güvenlik kurallarını rehberdeki gibi ayarla.',
      'PERMISSION_DENIED',
      status,
    );
  if (status === 404) return new FirebaseError('Firebase projesi veya Firestore veritabanı bulunamadı. Proje kimliğini (projectId) kontrol et.', 'NOT_FOUND', status);
  if (status === 401) return new FirebaseError('Oturum geçersiz, tekrar giriş yap.', 'UNAUTHENTICATED', status);
  return new FirebaseError(`Firebase hatası (${status}): ${msg}`, code, status);
}

/** Firebase konsolundaki `firebaseConfig = {...}` metninden veya kurulum kodundan yapılandırmayı çıkarır. */
export function parseConfig(text: string): FirebaseConfig | null {
  const t = text.trim();
  if (!t) return null;
  try {
    const decoded = JSON.parse(atob(t.replace(/^GA2-/, '')));
    if (decoded.apiKey && decoded.projectId) return { apiKey: decoded.apiKey, projectId: decoded.projectId };
  } catch {
    /* kurulum kodu değil */
  }
  const key = /apiKey["']?\s*[:=]\s*["']([^"']+)["']/.exec(t)?.[1];
  const pid = /projectId["']?\s*[:=]\s*["']([^"']+)["']/.exec(t)?.[1];
  if (key && pid) return { apiKey: key.trim(), projectId: pid.trim() };
  return null;
}

export function setupCode(cfg: FirebaseConfig): string {
  return 'GA2-' + btoa(JSON.stringify(cfg));
}

// ---------------------------------------------------------------- Auth
async function authCall(cfg: FirebaseConfig, endpoint: string, payload: object) {
  const res = await httpRequest(
    'POST',
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${encodeURIComponent(cfg.apiKey)}`,
    { 'Content-Type': 'application/json' },
    JSON.stringify(payload),
  );
  if (res.status < 200 || res.status >= 300) throw parseError(res.status, res.body);
  return JSON.parse(res.body);
}

function sessionFrom(d: { email: string; localId: string; idToken: string; refreshToken: string; expiresIn: string }): FirebaseSession {
  return {
    email: d.email,
    uid: d.localId,
    idToken: d.idToken,
    refreshToken: d.refreshToken,
    expiresAt: Date.now() + (Number(d.expiresIn) || 3600) * 1000,
  };
}

export async function signUp(cfg: FirebaseConfig, email: string, password: string): Promise<FirebaseSession> {
  return sessionFrom(await authCall(cfg, 'signUp', { email, password, returnSecureToken: true }));
}

export async function signIn(cfg: FirebaseConfig, email: string, password: string): Promise<FirebaseSession> {
  return sessionFrom(await authCall(cfg, 'signInWithPassword', { email, password, returnSecureToken: true }));
}

export async function sendPasswordReset(cfg: FirebaseConfig, email: string): Promise<void> {
  await authCall(cfg, 'sendOobCode', { requestType: 'PASSWORD_RESET', email });
}

export async function refreshSession(cfg: FirebaseConfig, s: FirebaseSession): Promise<FirebaseSession> {
  const res = await httpRequest(
    'POST',
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(cfg.apiKey)}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' },
    `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`,
  );
  if (res.status < 200 || res.status >= 300) throw parseError(res.status, res.body);
  const d = JSON.parse(res.body);
  return {
    ...s,
    uid: d.user_id || s.uid,
    idToken: d.id_token,
    refreshToken: d.refresh_token || s.refreshToken,
    expiresAt: Date.now() + (Number(d.expires_in) || 3600) * 1000,
  };
}

// ---------------------------------------------------------------- Firestore
export interface RemoteDoc {
  name: string;
  data: unknown;
  updateTime?: string;
  exists: boolean;
}

export function docPath(cfg: FirebaseConfig, rel: string): string {
  return `projects/${cfg.projectId}/databases/(default)/documents/${rel}`;
}

function baseUrl(cfg: FirebaseConfig) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/(default)/documents`;
}

async function fsPost(cfg: FirebaseConfig, token: string, op: string, payload: object) {
  const res = await httpRequest(
    'POST',
    `${baseUrl(cfg)}:${op}`,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    JSON.stringify(payload),
  );
  if (res.status < 200 || res.status >= 300) throw parseError(res.status, res.body);
  return JSON.parse(res.body);
}

/** Belgeleri toplu okur. Veri, `data` alanında JSON metni olarak saklanır. */
export async function batchGet(cfg: FirebaseConfig, token: string, rels: string[]): Promise<Map<string, RemoteDoc>> {
  const out = new Map<string, RemoteDoc>();
  for (let i = 0; i < rels.length; i += 50) {
    const chunk = rels.slice(i, i + 50);
    const resp = (await fsPost(cfg, token, 'batchGet', { documents: chunk.map((r) => docPath(cfg, r)) })) as {
      found?: { name: string; fields?: Record<string, { stringValue?: string }>; updateTime: string };
      missing?: string;
    }[];
    for (const item of resp) {
      if (item.found) {
        const rel = chunk.find((r) => item.found!.name.endsWith('/documents/' + r))!;
        let data: unknown = null;
        try {
          data = JSON.parse(item.found.fields?.data?.stringValue || 'null');
        } catch {
          data = null;
        }
        out.set(rel, { name: item.found.name, data, updateTime: item.found.updateTime, exists: true });
      } else if (item.missing) {
        const rel = chunk.find((r) => item.missing!.endsWith('/documents/' + r))!;
        out.set(rel, { name: item.missing, data: null, exists: false });
      }
    }
  }
  return out;
}

export interface WriteOp {
  rel: string;
  data: unknown;
  /** Eşzamanlılık koruması: belge bu sürümdeyse yaz; `null` = belge hiç olmamalı. */
  expectUpdateTime?: string | null;
}

export class ConflictError extends FirebaseError {}

export async function commit(cfg: FirebaseConfig, token: string, ops: WriteOp[], device: string): Promise<void> {
  if (!ops.length) return;
  const writes = ops.map((op) => ({
    update: {
      name: docPath(cfg, op.rel),
      fields: {
        data: { stringValue: JSON.stringify(op.data) },
        updatedAt: { integerValue: String(Date.now()) },
        device: { stringValue: device },
      },
    },
    ...(op.expectUpdateTime === undefined
      ? {}
      : op.expectUpdateTime === null
        ? { currentDocument: { exists: false } }
        : { currentDocument: { updateTime: op.expectUpdateTime } }),
  }));
  try {
    await fsPost(cfg, token, 'commit', { writes });
  } catch (e) {
    const fe = e as FirebaseError;
    if (/FAILED_PRECONDITION|ABORTED|ALREADY_EXISTS/.test(fe.code) || fe.status === 409)
      throw new ConflictError('Başka bir cihaz aynı anda eşitledi', 'CONFLICT', fe.status);
    throw e;
  }
}

/** Kurallar: kullanıcı yalnızca kendi verisine erişir; içerik belgesi herkese açık okunur. */
export const SECURITY_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}`;
