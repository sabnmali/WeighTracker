import { useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Card, Confirm, Segmented, SectionTitle, toast } from '../components/ui';
import { sayGerman } from '../components/ui';
import { exportJson, importBackup } from '../lib/backup';
import { GeminiError, testApiKey } from '../lib/gemini';
import { appVersion, isNative, openTtsSettings, saveFile, shareText, ttsStatus } from '../lib/native';
import { resetState, updateSettings, useStore } from '../lib/store';
import { todayKey } from '../lib/util';

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="py-3">
      <p className="font-semibold">{label}</p>
      {desc && <p className="text-xs text-slate-500">{desc}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-3">
      <span className="font-semibold">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

const TTS_LABEL: Record<string, [string, string]> = {
  ready: ['Hazır', 'green'],
  init: ['Başlatılıyor…', 'amber'],
  missing_data: ['Almanca ses paketi eksik', 'red'],
  not_supported: ['Almanca desteklenmiyor', 'red'],
  engine_error: ['TTS motoru bulunamadı', 'red'],
};

export default function Settings() {
  const s = useStore((st) => st.settings);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [importText, setImportText] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [, force] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800';
  const tts = ttsStatus();
  const [ttsLabel, ttsTone] = TTS_LABEL[tts] || ['Bilinmiyor', 'slate'];

  const test = async () => {
    setTesting(true);
    try {
      const r = await testApiKey(s);
      toast(`Bağlantı başarılı ✓ (${r.slice(0, 30)})`);
    } catch (e) {
      toast(e instanceof GeminiError ? e.message : 'Test başarısız');
    } finally {
      setTesting(false);
    }
  };

  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ''));
    reader.readAsText(f);
  };

  const doImport = (mode: 'merge' | 'replace') => {
    if (!importText) return;
    try {
      importBackup(importText, mode);
      toast(mode === 'merge' ? 'Yedek birleştirildi ✓' : 'Yedek geri yüklendi ✓');
      setPasted('');
    } catch (e) {
      toast((e as Error).message || 'Yedek okunamadı');
    } finally {
      setImportText(null);
    }
  };

  return (
    <div className="space-y-2">
      <SectionTitle>Profil & hedefler</SectionTitle>
      <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
        <Row label="Adın">
          <input className={input} value={s.userName} placeholder="İsteğe bağlı" onChange={(e) => updateSettings({ userName: e.target.value })} />
        </Row>
        <Row label="Sınav tarihi" desc="Ana sayfada geri sayım gösterilir">
          <input type="date" className={input} value={s.examDate} min={todayKey()} onChange={(e) => updateSettings({ examDate: e.target.value })} />
        </Row>
        <Row label="Günlük hedef" desc="Kart + soru sayısı">
          <Segmented
            value={s.dailyGoal}
            onChange={(v) => updateSettings({ dailyGoal: v })}
            options={[15, 30, 50, 80].map((n) => ({ value: n, label: String(n) }))}
          />
        </Row>
        <Row label="Günlük yeni kart">
          <Segmented
            value={s.newCardsPerDay}
            onChange={(v) => updateSettings({ newCardsPerDay: v })}
            options={[5, 10, 15, 25].map((n) => ({ value: n, label: String(n) }))}
          />
        </Row>
      </Card>

      <SectionTitle>Görünüm & sınav</SectionTitle>
      <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
        <Row label="Tema">
          <Segmented
            value={s.theme}
            onChange={(v) => updateSettings({ theme: v })}
            options={[
              { value: 'system', label: 'Sistem' },
              { value: 'light', label: 'Açık' },
              { value: 'dark', label: 'Koyu' },
            ]}
          />
        </Row>
        <Toggle label="Varsayılan: anında geri bildirim" checked={s.instantFeedback} onChange={(v) => updateSettings({ instantFeedback: v })} />
        <Toggle label="Soruların Türkçe çevirisini göster" checked={s.showTranslations} onChange={(v) => updateSettings({ showTranslations: v })} />
      </Card>

      <SectionTitle>Seslendirme (Almanca TTS)</SectionTitle>
      <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
        <div className="flex items-center justify-between py-3">
          <span className="font-semibold">Durum</span>
          <Badge tone={ttsTone}>{ttsLabel}</Badge>
        </div>
        <Row label={`Konuşma hızı: ${s.ttsRate.toFixed(2)}×`}>
          <input
            type="range"
            min={0.5}
            max={1.3}
            step={0.05}
            value={s.ttsRate}
            onChange={(e) => updateSettings({ ttsRate: Number(e.target.value) })}
            className="w-full accent-brand-700"
          />
        </Row>
        <div className="flex flex-wrap gap-2 py-3">
          <Button small icon="volume" onClick={() => sayGerman('Guten Tag! Ich lerne Deutsch für die Prüfung.')}>
            Test et
          </Button>
          {isNative && (
            <Button small variant="secondary" onClick={() => openTtsSettings()}>
              Ses paketini yükle / ayarla
            </Button>
          )}
          <Button small variant="ghost" onClick={() => force((x) => x + 1)}>
            Durumu yenile
          </Button>
        </div>
        {tts !== 'ready' && isNative && (
          <p className="pb-3 text-xs text-slate-500">
            Ses gelmiyorsa: Android Ayarlar → Sistem → Dil ve giriş → Metin okuma (TTS) → Google TTS → Almanca (Deutschland) ses verisini indir.
          </p>
        )}
      </Card>

      <SectionTitle>Yapay zeka (Google Gemini) – isteğe bağlı</SectionTitle>
      <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
        <p className="py-3 text-sm text-slate-600 dark:text-slate-300">
          Uygulama anahtar olmadan da tamamen çalışır. Anahtar eklersen: AI sınav üretimi, yazma puanlaması, kural detaylandırma, AI çalışma kağıdı ve hafıza
          çengelleri açılır. Ücretsiz anahtar:{' '}
          <a className="text-brand-600 underline dark:text-brand-300" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com/app/apikey
          </a>
        </p>
        <Row label="API anahtarı" desc="Yalnızca bu cihazda saklanır; doğrudan Google’a gönderilir.">
          <div className="flex gap-2">
            <input
              className={input}
              type={showKey ? 'text' : 'password'}
              value={s.apiKey}
              placeholder="AIza…"
              autoComplete="off"
              onChange={(e) => updateSettings({ apiKey: e.target.value.trim() })}
            />
            <Button small variant="secondary" icon={showKey ? 'eyeoff' : 'eye'} onClick={() => setShowKey(!showKey)} />
          </div>
        </Row>
        <Row label="Model" desc="Hata alırsan güncel bir Gemini model adı yaz (ör. gemini-2.5-flash).">
          <input className={input} value={s.model} onChange={(e) => updateSettings({ model: e.target.value.trim() })} />
        </Row>
        <div className="py-3">
          <Button small icon="bolt" onClick={test} disabled={!s.apiKey || testing}>
            {testing ? 'Test ediliyor…' : 'Bağlantıyı test et'}
          </Button>
        </div>
      </Card>

      <SectionTitle>Yedekleme & cihazlar arası taşıma</SectionTitle>
      <Card className="space-y-3 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tüm ilerlemen (kelimeler, hata hafızası, sınavlar, yazılar, ayarlar) tek bir JSON dosyasıdır. Diğer cihazda „Birleştir“ dersen iki cihazın ilerlemesi
          kaybolmadan birleşir.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            small
            icon="download"
            onClick={async () => {
              const ok = await saveFile(`goethe-a2-yedek-${todayKey()}.json`, 'application/json', exportJson());
              toast(ok ? 'Yedek kaydedildi ✓' : 'Kaydedilmedi');
            }}
          >
            Dosyaya kaydet
          </Button>
          <Button small variant="secondary" icon="share" onClick={() => shareText('Goethe A2 yedeği', exportJson())}>
            Paylaş
          </Button>
          <Button small variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>
            Dosyadan yükle
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <textarea
          className={`${input} font-mono text-xs`}
          rows={3}
          placeholder="…veya yedek JSON metnini buraya yapıştır"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
        />
        {pasted.trim() && (
          <Button small variant="secondary" onClick={() => setImportText(pasted)}>
            Yapıştırılan yedeği içe aktar
          </Button>
        )}
      </Card>

      <SectionTitle>Tehlikeli bölge</SectionTitle>
      <Card className="p-4">
        <Button variant="danger" small icon="trash" onClick={() => setConfirmReset(true)}>
          Tüm ilerlemeyi sıfırla
        </Button>
      </Card>
      <p className="pt-4 text-center text-xs text-slate-400">Goethe A2 Trainer · v{appVersion()}</p>

      {importText !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6" onClick={() => setImportText(null)}>
          <div className="animate-pop w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold">Yedek nasıl içe aktarılsın?</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <strong>Birleştir:</strong> Bu cihazdaki ilerleme korunur, yedektekiler eklenir (önerilen).
              <br />
              <strong>Değiştir:</strong> Bu cihazdaki veriler silinir, yedek aynen yüklenir.
            </p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => doImport('merge')}>Birleştir</Button>
              <Button variant="danger" onClick={() => doImport('replace')}>
                Değiştir
              </Button>
              <Button variant="ghost" onClick={() => setImportText(null)}>
                Vazgeç
              </Button>
            </div>
          </div>
        </div>
      )}
      <Confirm
        open={confirmReset}
        danger
        title="Her şey silinsin mi?"
        text="Kelime ilerlemesi, hata defteri, sınav geçmişi ve ayarlar kalıcı olarak silinir. Önce yedek almanı öneririz."
        confirmLabel="Sıfırla"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetState();
          setConfirmReset(false);
          toast('Sıfırlandı');
        }}
      />
    </div>
  );
}
