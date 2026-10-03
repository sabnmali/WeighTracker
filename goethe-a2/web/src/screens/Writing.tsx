import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Icon, ProgressBar, Segmented, SpeakButton, Spinner, toast } from '../components/ui';
import { WRITING_TASKS, type WritingTask } from '../data/writingTasks';
import { GeminiError, evaluateWritingAI } from '../lib/gemini';
import { navigate, useBackHandler } from '../lib/nav';
import { addWriting, useStore } from '../lib/store';
import { countWords, formatDate, formatDuration, uid } from '../lib/util';
import type { WritingEvaluation } from '../types';

interface Check {
  ok: boolean | null;
  label: string;
  hint?: string;
}

function offlineChecks(task: WritingTask, text: string, ticked: boolean[]): Check[] {
  const wc = countWords(text);
  const checks: Check[] = [];
  checks.push({
    ok: wc >= task.minWords && wc <= task.maxWords + 10,
    label: `Uzunluk: ${wc} kelime (hedef ${task.minWords}–${task.maxWords})`,
    hint: wc < task.minWords ? 'Biraz daha yaz: her maddeye en az bir tam cümle ayır.' : wc > task.maxWords + 10 ? 'Metin uzun; sınavda fazla yazmak hata riskini artırır.' : undefined,
  });
  const greet = /^\s*(liebe|lieber|hallo|hi|sehr geehrte|guten tag)/i.test(text);
  checks.push({
    ok: greet,
    label: 'Hitap (Anrede) var',
    hint: greet ? undefined : task.register === 'formell' ? '„Sehr geehrte Frau …, / Sehr geehrter Herr …,“ ile başla.' : '„Liebe …, / Lieber …, / Hallo …,“ ile başla.',
  });
  const close = /(grüße|gruß|bis bald|bis gleich|bis dann|bis morgen|bis samstag|tschüss|tschüs|danke)/i.test(text.slice(-80));
  checks.push({
    ok: close,
    label: 'Kapanış (Gruß) var',
    hint: close ? undefined : task.register === 'formell' ? '„Mit freundlichen Grüßen“ + adın.' : '„Liebe Grüße / Viele Grüße / Bis bald!“ + adın.',
  });
  if (task.register === 'formell') {
    const du = /\b(du|dich|dir|dein|deine|deinen|deinem|deiner)\b/i.test(text);
    checks.push({ ok: !du, label: 'Resmî hitap tutarlı (Sie/Ihnen)', hint: du ? 'Resmî metinde „du/dir/dein“ kullanılmaz; „Sie/Ihnen/Ihr“ kullan.' : undefined });
  } else {
    const sie = /[^.!?]\s(Ihnen|Ihr|Ihre|Ihren)\b/.test(text);
    checks.push({ ok: !sie, label: 'Samimi hitap tutarlı (du)', hint: sie ? 'Arkadaşa yazarken „du/dir/dein“ kullan.' : undefined });
  }
  const conns = new Set((text.toLowerCase().match(/\b(weil|dass|deshalb|aber|denn|wenn|oder|trotzdem|dann|danach|obwohl|und)\b/g) || []).map((x) => x));
  checks.push({
    ok: conns.size >= 2,
    label: `Bağlaç çeşitliliği: ${conns.size ? [...conns].join(', ') : 'yok'}`,
    hint: conns.size >= 2 ? undefined : 'En az iki farklı bağlaç kullan (weil, aber, deshalb, dann …). Kohärenz puanını yükseltir.',
  });
  const weilErr = /\b(weil|dass|wenn|obwohl|ob)\s+(ich|du|er|sie|es|wir|ihr|man)\s+(bin|bist|ist|sind|seid|habe|hast|hat|haben|habt|kann|kannst|können|muss|musst|müssen|will|willst|wollen|möchte|möchtest|möchten|komme|kommst|kommt|kommen|gehe|gehst|geht|gehen|arbeite|arbeitest|arbeitet)\s+[a-zäöüß]/i.exec(
    text,
  );
  checks.push({
    ok: !weilErr,
    label: 'Yan cümlede fiil sonda',
    hint: weilErr ? `Şüpheli: „${weilErr[0]}…“ → weil/dass/wenn sonrası çekimli fiil en sona gider.` : undefined,
  });
  ticked.forEach((t, i) => checks.push({ ok: t, label: `Madde ${i + 1}: ${task.bullets[i].de}`, hint: t ? undefined : 'Bu içerik noktasını işledin mi? Goethe’de her eksik madde puan kaybettirir.' }));
  return checks;
}

function AiResult({ ev }: { ev: WritingEvaluation }) {
  const rows: [string, string, number][] = [
    ['Aufgabenerfüllung', 'Görev tamamlama', ev.scores.aufgabe],
    ['Kohärenz & Textaufbau', 'Bağlantı ve düzen', ev.scores.kohaerenz],
    ['Wortschatz', 'Kelime dağarcığı', ev.scores.wortschatz],
    ['Formale Richtigkeit', 'Gramer ve yazım', ev.scores.formal],
  ];
  return (
    <div className="animate-pop space-y-3">
      <Card className="p-4 text-center">
        <p className="text-4xl font-black">
          {ev.total}
          <span className="text-lg text-slate-400">/20</span>
        </p>
        <Badge tone={ev.passed ? 'green' : 'red'} className="mt-1">
          {ev.passed ? 'Geçer (≥ 12)' : 'Geçme sınırının altında (< 12)'}
        </Badge>
        <p className="mt-3 text-left text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ev.summaryTr}</p>
      </Card>
      <Card className="space-y-3 p-4">
        {rows.map(([de, tr, v]) => (
          <div key={de}>
            <div className="flex justify-between text-sm">
              <span>
                <strong>{de}</strong> <span className="text-slate-500">· {tr}</span>
              </span>
              <span className="font-bold">{v}/5</span>
            </div>
            <ProgressBar value={v * 20} tone={v >= 4 ? 'green' : v >= 3 ? 'gold' : 'red'} className="mt-1" />
          </div>
        ))}
      </Card>
      {ev.correctedText && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold">✅ Düzeltilmiş metin</p>
            <SpeakButton text={ev.correctedText} />
          </div>
          <p className="mt-2 whitespace-pre-line rounded-xl bg-emerald-50 p-3 text-[15px] leading-relaxed dark:bg-emerald-900/20">{ev.correctedText}</p>
        </Card>
      )}
      {ev.errors.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 font-bold">🔍 Hata tablosu</p>
          <div className="space-y-2">
            {ev.errors.map((e, i) => (
              <div key={i} className="rounded-xl bg-paper p-3 text-sm dark:bg-slate-800">
                <p>
                  <span className="text-rose-600 line-through">{e.wrong}</span> → <span className="font-semibold text-emerald-700 dark:text-emerald-300">{e.correct}</span>
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{e.reasonTr}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {ev.suggestedWords.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 font-bold">💡 Önerilen Goethe A2 kelimeleri</p>
          <div className="flex flex-wrap gap-2">
            {ev.suggestedWords.map((w) => (
              <Badge key={w.de} tone="brand" className="!text-sm">
                {w.de} = {w.tr}
              </Badge>
            ))}
          </div>
        </Card>
      )}
      {ev.tipsTr.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 font-bold">📌 Tavsiyeler</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {ev.tipsTr.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Editor({ task, onClose }: { task: WritingTask; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const history = useStore((s) => s.writings);
  const draftKey = `goethe-a2-draft-${task.id}`;
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(draftKey) || '';
    } catch {
      return '';
    }
  });
  const [ticked, setTicked] = useState<boolean[]>(task.bullets.map(() => false));
  const [showTr, setShowTr] = useState(false);
  const [view, setView] = useState<'write' | 'check' | 'ai' | 'model'>('write');
  const [aiEval, setAiEval] = useState<WritingEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useBackHandler(true, () => {
    onClose();
    return true;
  });

  useEffect(() => {
    const t = window.setInterval(() => setElapsed(Math.round((Date.now() - startRef.current) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, text);
    } catch {
      /* yok say */
    }
  }, [text, draftKey]);

  const wc = countWords(text);
  const checks = useMemo(() => offlineChecks(task, text, ticked), [task, text, ticked]);
  const past = history.filter((h) => h.taskId === task.id);

  const runAi = async () => {
    if (!settings.apiKey) {
      toast('AI değerlendirmesi için Ayarlar’dan API anahtarı girin');
      return;
    }
    if (wc < 5) return toast('Önce metni yaz');
    setLoading(true);
    setView('ai');
    try {
      const ev = await evaluateWritingAI(settings, task, text);
      setAiEval(ev);
      addWriting({ id: uid('wr'), taskId: task.id, date: new Date().toISOString(), text, wordCount: wc, evaluation: ev });
    } catch (e) {
      toast(e instanceof GeminiError ? e.message : 'Değerlendirme alınamadı');
      setView('check');
    } finally {
      setLoading(false);
    }
  };

  const wcTone = wc < task.minWords ? 'text-amber-600' : wc > task.maxWords + 10 ? 'text-rose-600' : 'text-emerald-600';

  return (
    <div className="animate-pop space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <Badge tone="brand">Teil {task.teil}</Badge>
            <Badge tone={task.register === 'formell' ? 'gold' : 'green'}>{task.register === 'formell' ? 'Resmî (Sie)' : 'Samimi (du)'}</Badge>
          </div>
          <button onClick={() => setShowTr(!showTr)} className="text-xs font-semibold text-brand-600 underline dark:text-brand-300">
            {showTr ? 'Türkçeyi gizle' : 'Türkçesini göster'}
          </button>
        </div>
        <p className="mt-3 font-semibold leading-snug">{task.situation}</p>
        {showTr && <p className="mt-1 text-sm text-slate-500">{task.situationTr}</p>}
        <p className="mt-3 text-sm font-semibold">Schreiben Sie zu allen drei Punkten:</p>
        <div className="mt-2 space-y-2">
          {task.bullets.map((b, i) => (
            <label key={i} className="flex items-start gap-2 rounded-xl bg-paper p-2.5 text-sm dark:bg-slate-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={ticked[i]}
                onChange={(e) => setTicked(ticked.map((t, j) => (j === i ? e.target.checked : t)))}
              />
              <span>
                {b.de}
                {showTr && <span className="block text-slate-500">{b.tr}</span>}
              </span>
            </label>
          ))}
        </div>
      </Card>

      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          spellCheck={false}
          autoCapitalize="sentences"
          placeholder={task.register === 'formell' ? 'Sehr geehrte …,\n\n…\n\nMit freundlichen Grüßen\n…' : 'Liebe/Lieber …,\n\n…\n\nLiebe Grüße\n…'}
          className="w-full rounded-2xl border border-slate-200 bg-[#fffdf6] p-4 font-[family-name:var(--font-type)] text-[16px] leading-7 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="mt-1 flex justify-between px-1 text-sm">
          <span className={`font-semibold ${wcTone}`}>
            {wc} kelime · hedef {task.minWords}–{task.maxWords}
          </span>
          <span className="flex items-center gap-1 text-slate-500 tabular-nums">
            <Icon name="clock" size={14} /> {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant={view === 'check' ? 'primary' : 'secondary'} small onClick={() => setView('check')} icon="check">
          Kontrol
        </Button>
        <Button variant={view === 'ai' ? 'primary' : 'gold'} small onClick={runAi} icon="sparkles" disabled={loading}>
          Puanla
        </Button>
        <Button variant={view === 'model' ? 'primary' : 'secondary'} small onClick={() => setView('model')} icon="eye">
          Örnek
        </Button>
      </div>

      {view === 'check' && (
        <Card className="animate-pop p-4">
          <p className="mb-2 font-bold">Çevrimdışı kontrol listesi</p>
          <p className="mb-3 text-xs text-slate-500">
            Otomatik ön kontrol; resmî puan değildir. Ayrıntılı puanlama (20 üzerinden, 4 Goethe kriteri) için „AI puanla“yı kullan.
          </p>
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 ${c.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{c.ok ? '✓' : '!'}</span>
                <div>
                  <p className={c.ok ? '' : 'font-semibold'}>{c.label}</p>
                  {c.hint && <p className="text-slate-500">{c.hint}</p>}
                </div>
              </div>
            ))}
          </div>
          <Button
            small
            variant="secondary"
            className="mt-3"
            onClick={() => {
              addWriting({ id: uid('wr'), taskId: task.id, date: new Date().toISOString(), text, wordCount: wc });
              toast('Metin kaydedildi');
            }}
          >
            Metni geçmişe kaydet
          </Button>
        </Card>
      )}
      {view === 'ai' && (loading ? <Spinner label="Metnin Goethe kriterlerine göre değerlendiriliyor…" /> : aiEval && <AiResult ev={aiEval} />)}
      {view === 'model' && (
        <Card className="animate-pop p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold">Örnek cevap ({countWords(task.model)} kelime)</p>
            <SpeakButton text={task.model} />
          </div>
          <p className="mt-2 rounded-xl bg-paper p-3 font-[family-name:var(--font-type)] text-[15px] leading-7 dark:bg-slate-800">{task.model}</p>
          <p className="mt-3 text-sm font-bold">Kullanışlı kalıplar (Redemittel)</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {task.redemittel.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      )}

      {past.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Önceki denemeler</p>
          <div className="space-y-2">
            {past.slice(0, 5).map((p) => (
              <Card key={p.id} className="p-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{formatDate(p.date)}</span>
                  <span>
                    {p.wordCount} kelime{p.evaluation ? ` · ${p.evaluation.total}/20` : ''}
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 text-sm">{p.text}</p>
                <button className="mt-1 text-xs text-brand-600 underline dark:text-brand-300" onClick={() => setText(p.text)}>
                  Bu metni editöre yükle
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Writing() {
  const [teil, setTeil] = useState<1 | 2>(1);
  const [taskId, setTaskId] = useState<string | null>(null);
  const writings = useStore((s) => s.writings);
  const apiKey = useStore((s) => s.settings.apiKey);
  const task = WRITING_TASKS.find((t) => t.id === taskId);
  if (task) return <Editor task={task} onClose={() => setTaskId(null)} />;
  return (
    <div className="animate-pop space-y-4">
      <Card className="p-4 text-sm leading-relaxed">
        <p className="font-bold">Goethe A2 · Schreiben (30 dakika)</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          <strong>Teil 1:</strong> SMS / kısa mesaj, 20–30 kelime. <strong>Teil 2:</strong> E-posta, 30–40 kelime. Her görevdeki 3 içerik maddesinin hepsini işlemelisin.
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Değerlendirme: Aufgabenerfüllung · Kohärenz · Wortschatz · Formale Richtigkeit (her biri 5 puan, toplam 20; geçme sınırı 12).
        </p>
        {!apiKey && (
          <button className="mt-2 text-xs text-brand-600 underline dark:text-brand-300" onClick={() => navigate('settings')}>
            AI puanlama için Gemini API anahtarı ekle →
          </button>
        )}
      </Card>
      <Segmented
        value={teil}
        onChange={setTeil}
        options={[
          { value: 1, label: 'Teil 1 · SMS' },
          { value: 2, label: 'Teil 2 · E-Mail' },
        ]}
      />
      <div className="space-y-2">
        {WRITING_TASKS.filter((t) => t.teil === teil).map((t) => {
          const done = writings.filter((w) => w.taskId === t.id);
          const best = Math.max(-1, ...done.map((d) => d.evaluation?.total ?? -1));
          return (
            <Card key={t.id} onClick={() => setTaskId(t.id)} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{t.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{t.situationTr}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={t.register === 'formell' ? 'gold' : 'green'}>{t.register === 'formell' ? 'Sie' : 'du'}</Badge>
                  {best >= 0 && <Badge tone={best >= 12 ? 'green' : 'red'}>{best}/20</Badge>}
                  {done.length > 0 && best < 0 && <Badge>{done.length}× yazıldı</Badge>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
