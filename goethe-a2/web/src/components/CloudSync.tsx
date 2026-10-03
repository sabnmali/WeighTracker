import { useState } from 'react';
import { DEFAULT_CONTENT_URLS, availableUpdate, checkContent, setContentUrl, useContentMeta } from '../lib/content';
import { FirebaseError, SECURITY_RULES, parseConfig, sendPasswordReset, setupCode } from '../lib/firebase';
import { copyText, openUrl } from '../lib/native';
import { getSyncMeta, login, logout, setConfig, syncNow, useSyncStatus, type SyncPhase } from '../lib/sync';
import { Badge, Button, Card, Icon, toast } from './ui';

const PHASE: Record<SyncPhase, [string, string, string]> = {
  off: ['Kapalı', 'slate', 'cloudoff'],
  signedOut: ['Giriş yapılmadı', 'amber', 'cloudoff'],
  idle: ['Eşitlendi', 'green', 'cloudcheck'],
  pending: ['Bekleyen değişiklik var', 'amber', 'cloud'],
  syncing: ['Eşitleniyor…', 'brand', 'refresh'],
  offline: ['Çevrimdışı – internet gelince eşitlenecek', 'amber', 'cloudoff'],
  error: ['Hata', 'red', 'alert'],
};

export function syncPhaseInfo(p: SyncPhase) {
  return PHASE[p];
}

function timeAgo(t?: number): string {
  if (!t) return 'hiç';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.round(s / 60)} dk önce`;
  if (s < 86400) return `${Math.round(s / 3600)} saat önce`;
  return new Date(t).toLocaleString('tr-TR');
}

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800';

function SetupGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-paper p-3 text-sm dark:bg-slate-800">
      <button className="flex w-full items-center justify-between font-semibold" onClick={() => setOpen(!open)}>
        <span>📘 Firebase kurulum rehberi (bir kez, ~5 dk)</span>
        <Icon name={open ? 'eyeoff' : 'eye'} size={16} />
      </button>
      {open && (
        <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed text-slate-700 dark:text-slate-300">
          <li>
            <a className="text-brand-600 underline dark:text-brand-300" href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
              console.firebase.google.com
            </a>{' '}
            → Google hesabıyla gir → <strong>Proje ekle</strong> (Analytics gerekmez). Ücretsiz Spark planı yeterli.
          </li>
          <li>
            Sol menü <strong>Build → Authentication → Başlayın</strong> → <strong>E-posta/Şifre</strong> → Etkinleştir → Kaydet.
          </li>
          <li>
            <strong>Build → Firestore Database → Veritabanı oluştur</strong> → bir konum seç (ör. europe-west3) → <strong>üretim modunda</strong> başlat.
          </li>
          <li>
            Firestore → <strong>Kurallar (Rules)</strong> sekmesine aşağıdaki kuralları yapıştır → <strong>Yayınla</strong>:
            <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-2 text-[11px] leading-snug text-slate-100">{SECURITY_RULES}</pre>
            <Button
              small
              variant="ghost"
              icon="copy"
              onClick={() => {
                void copyText(SECURITY_RULES);
                toast('Kurallar kopyalandı');
              }}
            >
              Kuralları kopyala
            </Button>
          </li>
          <li>
            Proje ayarları (⚙️) → <strong>Uygulamalarınız → Web (&lt;/&gt;)</strong> → bir ad ver → Kaydet. Gösterilen <code>firebaseConfig</code> kod bloğunun tamamını
            kopyalayıp aşağıdaki kutuya yapıştır.
          </li>
          <li>Burada bir hesap oluştur. Diğer cihazlarda aynı yapılandırmayı (veya kurulum kodunu) girip aynı e-posta ile giriş yap.</li>
        </ol>
      )}
    </div>
  );
}

export function CloudSyncSection() {
  const st = useSyncStatus();
  const meta = getSyncMeta();
  const [cfgText, setCfgText] = useState('');
  const [email, setEmail] = useState(meta.session?.email || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [label, tone, icon] = PHASE[st.phase];

  const saveCfg = () => {
    const cfg = parseConfig(cfgText);
    if (!cfg) return toast('apiKey ve projectId bulunamadı. firebaseConfig bloğunun tamamını yapıştır.');
    setConfig(cfg);
    setCfgText('');
    toast(`Firebase projesi: ${cfg.projectId}`);
  };

  const doLogin = async (create: boolean) => {
    if (!email.includes('@') || password.length < 6) return toast('Geçerli e-posta ve en az 6 karakterli şifre gir');
    setBusy(true);
    try {
      await login(email, password, create);
      setPassword('');
      toast(create ? 'Hesap oluşturuldu, eşitleme açık ✓' : 'Giriş yapıldı, eşitleniyor ✓');
    } catch (e) {
      toast(e instanceof FirebaseError ? e.message : 'Giriş başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          <Icon name={icon} size={18} /> Durum
        </span>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Uygulama internetsiz tam çalışır. Giriş yaptığında kelime ilerlemesi, hata defteri, yanlış sorular, sınav sonuçları, yazılar ve ayarlar internet olduğunda
        tüm cihazlarında otomatik eşitlenir; sonraki sınavlar ve kartlar birleşmiş verilere göre seçilir.
      </p>

      {!meta.config ? (
        <>
          <SetupGuide />
          <textarea
            className={`${input} font-mono text-xs`}
            rows={5}
            value={cfgText}
            onChange={(e) => setCfgText(e.target.value)}
            placeholder={'const firebaseConfig = {\n  apiKey: "AIza…",\n  authDomain: "…",\n  projectId: "…",\n  …\n};\n\n…veya başka cihazdan alınan kurulum kodu (GA2-…)'}
          />
          <Button className="w-full" icon="cloud" onClick={saveCfg} disabled={!cfgText.trim()}>
            Yapılandırmayı kaydet
          </Button>
        </>
      ) : !meta.session ? (
        <>
          <p className="text-xs text-slate-500">
            Firebase projesi: <strong>{meta.config.projectId}</strong>
          </p>
          <input className={input} type="email" autoComplete="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className={input}
            type="password"
            autoComplete="current-password"
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => doLogin(false)} disabled={busy}>
              Giriş yap
            </Button>
            <Button variant="secondary" onClick={() => doLogin(true)} disabled={busy}>
              Hesap oluştur
            </Button>
          </div>
          {st.error && <p className="text-sm text-rose-600">{st.error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              small
              variant="ghost"
              onClick={async () => {
                if (!email.includes('@')) return toast('Önce e-postanı yaz');
                try {
                  await sendPasswordReset(meta.config!, email.trim());
                  toast('Şifre sıfırlama e-postası gönderildi');
                } catch (e) {
                  toast(e instanceof FirebaseError ? e.message : 'Gönderilemedi');
                }
              }}
            >
              Şifremi unuttum
            </Button>
            <Button small variant="ghost" onClick={() => setConfig(undefined)}>
              Yapılandırmayı değiştir
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-paper p-3 text-sm dark:bg-slate-800">
            <p>
              Hesap: <strong>{st.email}</strong>
            </p>
            <p>Proje: {meta.config.projectId}</p>
            <p>
              Son eşitleme: {timeAgo(st.lastSync)}
              {st.lastResult ? ` · ${st.lastResult}` : ''}
            </p>
          </div>
          {st.error && <p className="text-sm text-rose-600">{st.error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button small icon="refresh" onClick={() => void syncNow()} disabled={st.phase === 'syncing'}>
              Şimdi eşitle
            </Button>
            <Button
              small
              variant="secondary"
              icon="copy"
              onClick={() => {
                void copyText(setupCode(meta.config!));
                toast('Kurulum kodu kopyalandı – diğer cihaza yapıştır');
              }}
            >
              Kurulum kodu
            </Button>
          </div>
          <Button small variant="ghost" onClick={logout}>
            Çıkış yap (yerel veriler kalır)
          </Button>
        </>
      )}
    </Card>
  );
}

export function ContentUpdateSection() {
  const cm = useContentMeta();
  const [url, setUrl] = useState(cm.url || '');
  const [busy, setBusy] = useState(false);
  const upd = availableUpdate();
  const c = cm.content;
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Yeni kelime, soru, okuma metni ve düzeltmeler internetten indirilir; yeni APK gerekmez. İndirilen içerik internetsiz de kullanılır.
      </p>
      <div className="rounded-xl bg-paper p-3 text-sm dark:bg-slate-800">
        <p>
          İçerik sürümü: <strong>{c?.contentVersion ?? 0}</strong>
          {c?.updatedAt ? ` (${c.updatedAt})` : ''}
        </p>
        <p>
          Ek içerik: {c?.words?.length || 0} kelime · {c?.questions?.length || 0} soru · {c?.longTexts?.length || 0} metin · {c?.writingTasks?.length || 0} yazma görevi
        </p>
        <p>Son kontrol: {cm.lastCheck ? new Date(cm.lastCheck).toLocaleString('tr-TR') : 'hiç'}</p>
        {cm.lastError && <p className="text-rose-600">{cm.lastError}</p>}
      </div>
      {upd && (
        <div className="rounded-xl bg-gold-100 p-3 text-sm dark:bg-slate-800">
          <p className="font-bold">Yeni uygulama sürümü: {upd.latestVersion}</p>
          {upd.notes && <p className="mt-1">{upd.notes}</p>}
          {upd.apkUrl && (
            <Button small variant="gold" icon="download" className="mt-2" onClick={() => openUrl(upd.apkUrl!)}>
              APK'yı indir
            </Button>
          )}
        </div>
      )}
      <Button
        small
        icon="refresh"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await checkContent(true);
          setBusy(false);
          toast(r.message);
        }}
      >
        {busy ? 'Kontrol ediliyor…' : 'Güncellemeleri kontrol et'}
      </Button>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-500">Gelişmiş: içerik adresi</summary>
        <input className={`${input} mt-2 text-xs`} value={url} placeholder={DEFAULT_CONTENT_URLS[0]} onChange={(e) => setUrl(e.target.value)} />
        <Button
          small
          variant="secondary"
          className="mt-2"
          onClick={() => {
            setContentUrl(url);
            toast(url.trim() ? 'Adres kaydedildi' : 'Varsayılan adres kullanılacak');
          }}
        >
          Kaydet
        </Button>
      </details>
    </Card>
  );
}
