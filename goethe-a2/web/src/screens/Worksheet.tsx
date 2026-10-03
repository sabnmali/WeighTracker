import { useState } from 'react';
import { Badge, Button, Card, Empty, Segmented, Spinner, toast } from '../components/ui';
import { GeminiError, generateWorksheetAI } from '../lib/gemini';
import { printPage, saveFile, shareText } from '../lib/native';
import { navigate } from '../lib/nav';
import { clearWorksheetQueue, getState, saveWorksheet, useStore } from '../lib/store';
import { formatDate } from '../lib/util';
import { THEMES, THEME_TR } from '../lib/words';
import { buildWorksheet, chooseWorksheetWords, worksheetFileName } from '../lib/worksheet';

function htmlToText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|h2|h3|h4)>/gi, '\n');
  return (div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

export default function Worksheet() {
  const settings = useStore((s) => s.settings);
  const queue = useStore((s) => s.worksheetQueue);
  const last = useStore((s) => s.lastWorksheet);
  const [theme, setTheme] = useState('');
  const [source, setSource] = useState<'local' | 'ai'>('local');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const generate = async () => {
    const state = getState();
    const words = chooseWorksheetWords(state, theme || undefined);
    setShowKey(false);
    if (source === 'ai') {
      setLoading(true);
      try {
        const ws = await generateWorksheetAI(settings, words, theme || 'Gemischt');
        saveWorksheet({ ...ws, date: new Date().toISOString(), source: 'ai' });
        clearWorksheetQueue();
      } catch (e) {
        toast(e instanceof GeminiError ? e.message : 'AI kağıdı üretilemedi; çevrimdışı motor kullanıldı.');
        const ws = buildWorksheet(state, words, theme || undefined);
        saveWorksheet({ ...ws, date: new Date().toISOString(), source: 'local' });
      } finally {
        setLoading(false);
      }
    } else {
      const ws = buildWorksheet(state, words, theme || undefined);
      saveWorksheet({ ...ws, date: new Date().toISOString(), source: 'local' });
      clearWorksheetQueue();
    }
  };

  const doc = (withKey: boolean) =>
    `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${worksheetFileName()}</title><style>body{font-family:'Courier New',monospace;max-width:780px;margin:24px auto;line-height:1.6;padding:0 16px}h2{border-bottom:2px solid #000;text-transform:uppercase}h3{text-decoration:underline}</style></head><body>${last?.html || ''}${
      withKey ? `<hr><h2>Lösungsschlüssel</h2>${last?.answerKey || ''}` : ''
    }</body></html>`;

  return (
    <div className="space-y-4">
      <Card className="no-print space-y-3 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          5 bölümlü günlük çalışma kağıdı: <strong>Wortschatz & Artikel · Lückentext · Übersetzung · Satzbau · Lesetext</strong>. Kağıda yazdırıp daktilo estetiğinde çalış;
          cevap anahtarı yazdırılmaz.
        </p>
        {queue.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-gold-100 px-3 py-2 text-sm dark:bg-slate-800">
            <span>
              <strong>{queue.length}</strong> hatalı kelime bir sonraki kağıda eklenecek
            </span>
            <button className="text-xs underline" onClick={clearWorksheetQueue}>
              Temizle
            </button>
          </div>
        )}
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Karışık tema</option>
          {THEMES.filter((t) => t !== 'Zeit & Zahlen').map((t) => (
            <option key={t} value={t}>
              {THEME_TR[t]}
            </option>
          ))}
        </select>
        <Segmented
          value={source}
          onChange={(v) => {
            if (v === 'ai' && !settings.apiKey) {
              toast('AI kağıdı için Ayarlar’dan API anahtarı girin');
              return;
            }
            setSource(v);
          }}
          options={[
            { value: 'local', label: 'Çevrimdışı' },
            { value: 'ai', label: '✨ Gemini AI' },
          ]}
        />
        {!settings.apiKey && (
          <button className="text-xs text-brand-600 underline dark:text-brand-300" onClick={() => navigate('settings')}>
            AI için API anahtarı ekle →
          </button>
        )}
        <Button className="w-full" icon="file" onClick={generate} disabled={loading}>
          {last ? 'Yeni kağıt oluştur' : 'Kağıt oluştur'}
        </Button>
      </Card>

      {loading && <Spinner label="Yapay zeka çalışma kağıdını hazırlıyor…" />}

      {!loading && !last && <Empty icon="file" title="Henüz çalışma kağıdı yok" text="Tema seçip „Kağıt oluştur“a dokun." />}

      {!loading && last && (
        <>
          <div className="no-print flex flex-wrap items-center gap-2">
            <Badge tone={last.source === 'ai' ? 'gold' : 'brand'}>{last.source === 'ai' ? '✨ AI' : 'Çevrimdışı'}</Badge>
            <span className="text-xs text-slate-500">{formatDate(last.date)}</span>
            <div className="ml-auto flex gap-1">
              <Button small variant="secondary" icon="printer" onClick={() => printPage(worksheetFileName())}>
                Yazdır / PDF
              </Button>
              <Button
                small
                variant="secondary"
                icon="download"
                onClick={async () => {
                  const ok = await saveFile(`${worksheetFileName()}.html`, 'text/html', doc(true));
                  toast(ok ? 'Kaydedildi' : 'Kaydedilmedi');
                }}
              />
              <Button small variant="secondary" icon="share" onClick={() => shareText('Tagesarbeitsblatt', htmlToText(last.html))} />
            </div>
          </div>
          <div lang="de" className="print-area typewriter rounded-sm p-5 shadow-md ring-1 ring-black/10" dangerouslySetInnerHTML={{ __html: last.html }} />
          {last.answerKey && (
            <div className="no-print">
              <Button variant="ghost" icon={showKey ? 'eyeoff' : 'eye'} onClick={() => setShowKey(!showKey)} className="w-full">
                {showKey ? 'Cevap anahtarını gizle' : 'Cevap anahtarını göster (yazdırılmaz)'}
              </Button>
              {showKey && (
                <div
                  lang="de"
                  className="typewriter animate-pop mt-2 rounded-sm border-2 border-dashed border-gold-500 p-4"
                  dangerouslySetInnerHTML={{ __html: `<h3>Lösungsschlüssel</h3>${last.answerKey}` }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
