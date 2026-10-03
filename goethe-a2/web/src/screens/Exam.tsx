import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Chip, Confirm, Icon, ProgressBar, Segmented, SpeakButton, Spinner, toast } from '../components/ui';
import { CATEGORY_ICON, CATEGORY_TR, EXAM_MODES, buildExam, examTitle, type ExamMode } from '../lib/exam';
import { evaluate } from '../lib/evaluation';
import { GeminiError, explainRuleAI, generateExamAI } from '../lib/gemini';
import { navigate, useBackHandler } from '../lib/nav';
import { addTest, addToWorksheetQueue, getState, registerAnswer, useStore } from '../lib/store';
import { formatDuration, normalizeAnswer, shuffle, uid } from '../lib/util';
import { THEMES, THEME_TR, allWords, mastery } from '../lib/words';
import type { Question, TestSummary, UserAnswerRecord } from '../types';

type Phase = 'setup' | 'loading' | 'running' | 'results';

function isCorrect(q: Question, answer: string): boolean {
  if (q.type === 'sentence_build') {
    const a = normalizeAnswer(answer);
    return [q.correctAnswer, ...(q.acceptedAnswers || [])].some((x) => normalizeAnswer(x) === a);
  }
  return answer === q.correctAnswer;
}

/** Almanca metni seslendirme için soru metninden boşlukları temizler. */
function speakText(q: Question): string {
  return q.question.replace(/_{2,}/g, '…');
}

// ---------------------------------------------------------------- Satzbau
function SentenceBuilder({ q, disabled, onChange }: { q: Question; disabled: boolean; onChange: (s: string) => void }) {
  const parts = useMemo(() => {
    let s = shuffle(q.sentenceParts || []);
    if (s.join(' ') === (q.sentenceParts || []).join(' ') && s.length > 1) s = [...s.slice(1), s[0]];
    return s.map((p, i) => ({ p, i }));
  }, [q]);
  const [chosen, setChosen] = useState<number[]>([]);
  useEffect(() => {
    onChange(chosen.map((i) => parts.find((x) => x.i === i)!.p).join(' '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);
  return (
    <div>
      <div className="min-h-[72px] rounded-2xl border-2 border-dashed border-brand-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        {chosen.length === 0 && <p className="text-sm text-slate-400">Kelimelere doğru sırayla dokun…</p>}
        <div className="flex flex-wrap gap-2">
          {chosen.map((i) => (
            <button
              key={i}
              disabled={disabled}
              onClick={() => setChosen(chosen.filter((x) => x !== i))}
              className="rounded-lg bg-brand-700 px-3 py-1.5 text-[15px] font-medium text-white"
            >
              {parts.find((x) => x.i === i)!.p}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {parts
          .filter((x) => !chosen.includes(x.i))
          .map((x) => (
            <button
              key={x.i}
              disabled={disabled}
              onClick={() => setChosen([...chosen, x.i])}
              className="rounded-lg bg-white px-3 py-1.5 text-[15px] font-medium ring-1 ring-slate-300 active:scale-95 dark:bg-slate-800 dark:ring-slate-600"
            >
              {x.p}
            </button>
          ))}
      </div>
      {!disabled && chosen.length > 0 && (
        <button className="mt-2 text-sm text-slate-500 underline" onClick={() => setChosen([])}>
          Sıfırla
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Açıklama kutusu
function Explanation({ q, userAnswer, correct }: { q: Question; userAnswer: string; correct: boolean }) {
  const settings = useStore((s) => s.settings);
  const [ai, setAi] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const askAi = async () => {
    setLoading(true);
    try {
      setAi(await explainRuleAI(settings, q, userAnswer));
    } catch (e) {
      toast(e instanceof GeminiError ? e.message : 'Açıklama alınamadı');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={`animate-pop mt-4 rounded-2xl p-4 ${
        correct ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-800' : 'bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:ring-rose-800'
      }`}
    >
      <p className={`font-bold ${correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
        {correct ? '✓ Doğru!' : '✗ Yanlış'}
      </p>
      {!correct && (
        <p className="mt-1 text-sm">
          Doğru cevap: <strong>{q.correctAnswer}</strong>
        </p>
      )}
      {q.explanation && <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{q.explanation}</p>}
      {q.errorTrap && (
        <p className="mt-2 rounded-lg bg-white/70 p-2 text-sm dark:bg-black/20">
          <strong>⚠️ Tuzak:</strong> {q.errorTrap}
        </p>
      )}
      {q.targetRule && (
        <p className="mt-2 text-xs text-slate-500">
          <strong>Kural:</strong> {q.targetRule}
        </p>
      )}
      {ai ? (
        <div className="mt-3 whitespace-pre-line rounded-xl bg-white p-3 text-sm leading-relaxed dark:bg-slate-900">{ai}</div>
      ) : (
        settings.apiKey && (
          <Button small variant="ghost" icon="sparkles" className="mt-2" onClick={askAi} disabled={loading}>
            {loading ? 'Yapay zeka açıklıyor…' : 'Kuralı AI ile detaylandır'}
          </Button>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Soru görünümü
function QuestionView({
  q,
  answer,
  setAnswer,
  locked,
  showTr,
}: {
  q: Question;
  answer: string;
  setAnswer: (a: string) => void;
  locked: boolean;
  showTr: boolean;
}) {
  const [textOpen, setTextOpen] = useState(true);
  const isErr = q.category === 'error_detection';
  return (
    <div className="animate-pop">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">
          {CATEGORY_ICON[q.category]} {CATEGORY_TR[q.category]}
        </Badge>
        {q.difficulty && <Badge>{q.difficulty}</Badge>}
        {q.isErrorPriority && <Badge tone="red">♻ Hata hafızası{q.errorRateContext ? ` · %${q.errorRateContext}` : ''}</Badge>}
        {q.source === 'ai' && <Badge tone="gold">✨ AI</Badge>}
      </div>

      {q.readingText && (
        <Card className="mb-4 overflow-hidden">
          <button onClick={() => setTextOpen(!textOpen)} className="flex w-full items-center justify-between bg-brand-50 px-4 py-2 text-left dark:bg-slate-800">
            <span className="text-sm font-bold text-brand-800 dark:text-brand-200">📖 {q.readingTitle || 'Lesetext'}</span>
            <span className="flex items-center">
              <SpeakButton text={q.readingText} size={16} />
              <Icon name={textOpen ? 'eyeoff' : 'eye'} size={16} className="text-slate-500" />
            </span>
          </button>
          {textOpen && <p className="max-h-72 overflow-y-auto whitespace-pre-line px-4 py-3 text-[15px] leading-relaxed">{q.readingText}</p>}
        </Card>
      )}

      <div className="flex items-start gap-2">
        <p className="flex-1 text-lg font-semibold leading-snug text-slate-900 dark:text-white">{q.question}</p>
        {q.type !== 'sentence_build' && !isErr && <SpeakButton text={speakText(q)} />}
      </div>
      {showTr && q.questionTr && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{q.questionTr}</p>}

      <div className="mt-4">
        {q.type === 'sentence_build' ? (
          <SentenceBuilder q={q} disabled={locked} onChange={setAnswer} />
        ) : (
          <div className="grid gap-2">
            {q.options!.map((o, i) => {
              let cls = 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900';
              if (locked) {
                if (o === q.correctAnswer) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
                else if (o === answer) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 animate-shake';
                else cls = 'border-slate-200 bg-white opacity-60 dark:border-slate-700 dark:bg-slate-900';
              } else if (o === answer) cls = 'border-brand-600 bg-brand-50 ring-2 ring-brand-200 dark:bg-slate-800 dark:ring-brand-700';
              return (
                <div key={o} className="flex items-stretch gap-1">
                  <button
                    disabled={locked}
                    onClick={() => setAnswer(o)}
                    className={`flex flex-1 items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] transition ${cls}`}
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{o}</span>
                  </button>
                  {isErr && <SpeakButton text={o} size={16} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Sonuç raporu
function Results({ summary, onRetry, onNew }: { summary: TestSummary; onRetry: (qs: Question[]) => void; onNew: () => void }) {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'grammar' | 'error'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const ev = summary.evaluation!;
  const wrong = summary.records.filter((r) => !r.isCorrect);
  const list = summary.records.filter((r) => {
    if (filter === 'wrong') return !r.isCorrect;
    if (filter === 'grammar') return ['grammar', 'prepositions_kasus'].includes(r.question.category);
    if (filter === 'error') return r.question.category === 'error_detection';
    return true;
  });
  const wrongWordIds = Array.from(new Set(wrong.map((r) => r.question.wordId).filter(Boolean) as string[]));
  const pct = summary.percentage;
  const ringColor = pct >= 75 ? '#059669' : pct >= 60 ? '#c8962e' : '#e11d48';

  const exportWrongToWorksheet = () => {
    let ids = wrongWordIds;
    if (!ids.length) {
      // gramer sorularındaki hedef kelimeleri sözlükte ara
      const all = allWords(getState().customWords);
      ids = wrong
        .map((r) => r.question.targetWord?.toLowerCase())
        .filter(Boolean)
        .map((t) => all.find((w) => w.lemma.toLowerCase() === t || `${w.article} ${w.lemma}`.toLowerCase() === t)?.id)
        .filter(Boolean) as string[];
    }
    if (!ids.length) return toast('Yanlışlarda aktarılacak kelime bulunamadı');
    addToWorksheetQueue(ids);
    toast(`${ids.length} kelime çalışma kağıdına aktarıldı`);
  };

  return (
    <div className="animate-pop space-y-4">
      <Card className="p-5 text-center">
        <div
          className="mx-auto flex h-32 w-32 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${ringColor} ${pct * 3.6}deg, rgba(148,163,184,.25) 0deg)` }}
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
            <span className="text-3xl font-black">%{pct}</span>
            <span className="text-xs text-slate-500">
              {summary.correctAnswers}/{summary.totalQuestions}
            </span>
          </div>
        </div>
        <p className={`mt-3 text-xl font-extrabold ${summary.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
          {summary.passed ? 'Bestanden! 🎉' : 'Noch nicht bestanden'}
        </p>
        <p className="text-xs text-slate-500">Geçme sınırı %60 · Süre {formatDuration(summary.timeSpentSeconds)}</p>
        <div className="mt-3 inline-block rounded-full bg-gradient-to-r from-brand-700 to-brand-500 px-4 py-1.5 text-sm font-bold text-white">
          {ev.cefrStatusBadge}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ev.overallAssessmentTr}</p>
      </Card>

      <Card className="p-4">
        <p className="mb-3 font-bold">Kriter karnesi</p>
        <div className="space-y-3">
          {ev.categoryBreakdown.map((c) => (
            <div key={c.category}>
              <div className="flex justify-between text-sm">
                <span>
                  {CATEGORY_ICON[c.category]} {c.name}
                </span>
                <span className="font-semibold">
                  %{c.percentage} <span className="text-xs font-normal text-slate-500">({c.correct}/{c.total})</span>
                </span>
              </div>
              <ProgressBar value={c.percentage} tone={c.percentage >= 75 ? 'green' : c.percentage >= 50 ? 'gold' : 'red'} className="mt-1" />
              <p className="mt-0.5 text-xs text-slate-500">{c.ratingLabel}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 font-bold text-emerald-700 dark:text-emerald-300">💪 Güçlü yönler</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {ev.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <p className="mb-2 font-bold text-rose-700 dark:text-rose-300">🎯 Geliştirilecek yönler</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {ev.weaknesses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-4">
        <p className="mb-2 font-bold">📌 Kişisel çalışma tavsiyeleri</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {ev.actionableTips.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {wrong.length > 0 && (
          <Button variant="secondary" icon="refresh" onClick={() => onRetry(wrong.map((r) => r.question))}>
            Yanlışları tekrar çöz
          </Button>
        )}
        {wrong.length > 0 && (
          <Button variant="secondary" icon="file" onClick={exportWrongToWorksheet}>
            Kağıda aktar
          </Button>
        )}
        <Button icon="target" onClick={onNew} className={wrong.length ? 'col-span-2' : 'col-span-2'}>
          Yeni sınav
        </Button>
      </div>

      <div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            Tümü ({summary.records.length})
          </Chip>
          <Chip active={filter === 'wrong'} onClick={() => setFilter('wrong')}>
            Sadece yanlışlar ({wrong.length})
          </Chip>
          <Chip active={filter === 'grammar'} onClick={() => setFilter('grammar')}>
            Gramer & Kasus
          </Chip>
          <Chip active={filter === 'error'} onClick={() => setFilter('error')}>
            Hata avlama
          </Chip>
        </div>
        <div className="mt-2 space-y-2">
          {list.map((r, i) => (
            <Card key={r.questionId + i} className="overflow-hidden">
              <button className="flex w-full items-start gap-3 p-3 text-left" onClick={() => setOpen(open === r.questionId ? null : r.questionId)}>
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    r.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  {r.isCorrect ? '✓' : '✗'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.question.question}</p>
                  <p className="text-xs text-slate-500">
                    {CATEGORY_TR[r.question.category]} · Senin cevabın: {r.userAnswer || '—'}
                  </p>
                </div>
              </button>
              {open === r.questionId && (
                <div className="px-3 pb-3">
                  <Explanation q={r.question} userAnswer={r.userAnswer} correct={r.isCorrect} />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Ana bileşen
export default function Exam({ initialMode }: { initialMode?: string }) {
  const settings = useStore((s) => s.settings);
  const mistakesCount = useStore((s) => s.mistakes.length);
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<ExamMode>((initialMode as ExamMode) || 'karma');
  const [count, setCount] = useState(20);
  const [theme, setTheme] = useState('');
  const [useAi, setUseAi] = useState(false);
  const [instant, setInstant] = useState(settings.instantFeedback);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [locked, setLocked] = useState(false);
  const [records, setRecords] = useState<UserAnswerRecord[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showTr, setShowTr] = useState(settings.showTranslations);
  const startRef = useRef(0);
  const qStartRef = useRef(0);
  const titleRef = useRef('');
  const sourceRef = useRef<'local' | 'ai'>('local');

  useEffect(() => {
    if (phase !== 'running') return;
    const t = window.setInterval(() => setElapsed(Math.round((Date.now() - startRef.current) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useBackHandler(phase === 'running', () => {
    setConfirmExit(true);
    return true;
  });
  useBackHandler(phase === 'results', () => {
    setPhase('setup');
    return true;
  });

  const begin = (qs: Question[], title: string, src: 'local' | 'ai') => {
    if (!qs.length) {
      toast('Bu ayarlarla soru oluşturulamadı');
      setPhase('setup');
      return;
    }
    setQuestions(qs);
    setIdx(0);
    setAnswer('');
    setLocked(false);
    setRecords([]);
    setElapsed(0);
    startRef.current = Date.now();
    qStartRef.current = Date.now();
    titleRef.current = title;
    sourceRef.current = src;
    setPhase('running');
  };

  const start = async () => {
    const title = examTitle(mode, theme || undefined);
    if (useAi) {
      setPhase('loading');
      try {
        const s = getState();
        const weakRules = Object.entries(s.rules)
          .filter(([k, v]) => k.startsWith('rule:') && v.wrong > v.correct)
          .map(([k]) => k.slice(5))
          .slice(0, 6);
        const weakWords = allWords(s.customWords)
          .filter((w) => mastery(s.words[w.id]) === 'weak')
          .slice(0, 12)
          .map((w) => w.lemma);
        const qs = await generateExamAI(settings, mode, count, theme || undefined, weakRules, weakWords);
        begin(qs, title + ' (AI)', 'ai');
      } catch (e) {
        toast(e instanceof GeminiError ? e.message : 'AI sınavı oluşturulamadı; yerel motor kullanılıyor.');
        begin(buildExam(getState(), { mode, count, theme: theme || undefined }), title, 'local');
      }
    } else {
      begin(buildExam(getState(), { mode, count, theme: theme || undefined }), title, 'local');
    }
  };

  const finish = (recs: UserAnswerRecord[]) => {
    const correct = recs.filter((r) => r.isCorrect).length;
    const pct = recs.length ? Math.round((correct / recs.length) * 100) : 0;
    const sum: TestSummary = {
      id: uid('test'),
      title: titleRef.current,
      theme: theme || 'Gemischt',
      date: new Date().toISOString(),
      totalQuestions: recs.length,
      correctAnswers: correct,
      percentage: pct,
      passed: pct >= 60,
      timeSpentSeconds: Math.round((Date.now() - startRef.current) / 1000),
      records: recs,
      evaluation: evaluate(recs),
      source: sourceRef.current,
    };
    if (recs.length) addTest(sum);
    setSummary(sum);
    setPhase('results');
  };

  const q = questions[idx];

  const commit = () => {
    if (!q || !answer) return;
    const ok = isCorrect(q, answer);
    const rec: UserAnswerRecord = { questionId: q.id, question: q, userAnswer: answer, isCorrect: ok, timeMs: Date.now() - qStartRef.current };
    registerAnswer(q, answer, ok);
    const next = [...records, rec];
    setRecords(next);
    if (instant) {
      setLocked(true);
    } else {
      advance(next);
    }
  };

  const advance = (recs = records) => {
    if (idx + 1 >= questions.length) {
      finish(recs);
      return;
    }
    setIdx(idx + 1);
    setAnswer('');
    setLocked(false);
    qStartRef.current = Date.now();
    document.getElementById('app-main')?.scrollTo({ top: 0 });
  };

  // ------------------------------------------------ render
  if (phase === 'loading') return <Spinner label="Yapay zeka Goethe A2 sınavını hazırlıyor… (10–40 sn)" />;

  if (phase === 'results' && summary)
    return (
      <Results
        summary={summary}
        onRetry={(qs) => begin(qs, `${titleRef.current} – Tekrar`, 'local')}
        onNew={() => {
          setSummary(null);
          setPhase('setup');
        }}
      />
    );

  if (phase === 'running' && q) {
    const lastRec = records[records.length - 1];
    return (
      <div className="pb-24">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => setConfirmExit(true)} className="rounded-full p-1.5 text-slate-500" aria-label="Çık">
            <Icon name="x" />
          </button>
          <ProgressBar value={(idx / questions.length) * 100} />
          <span className="whitespace-nowrap text-sm font-semibold text-slate-500">
            {idx + 1}/{questions.length}
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-sm font-semibold tabular-nums ring-1 ring-black/5 dark:bg-slate-800">
            <Icon name="clock" size={14} /> {formatDuration(elapsed)}
          </span>
        </div>
        <QuestionView key={q.id + idx} q={q} answer={answer} setAnswer={setAnswer} locked={locked} showTr={showTr} />
        {locked && lastRec && <Explanation q={q} userAnswer={lastRec.userAnswer} correct={lastRec.isCorrect} />}

        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-paper/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Button variant="secondary" small onClick={() => setShowTr(!showTr)} className="!px-3">
              TR
            </Button>
            {locked ? (
              <Button className="flex-1" onClick={() => advance()} icon={idx + 1 >= questions.length ? 'check' : 'right'}>
                {idx + 1 >= questions.length ? 'Sonuçları gör' : 'Sonraki soru'}
              </Button>
            ) : (
              <Button className="flex-1" onClick={commit} disabled={!answer}>
                {instant ? 'Kontrol et' : idx + 1 >= questions.length ? 'Sınavı bitir' : 'Kaydet ve ilerle'}
              </Button>
            )}
          </div>
        </div>
        <Confirm
          open={confirmExit}
          title="Sınavdan çıkılsın mı?"
          text={records.length ? 'Cevapladığın sorular değerlendirilip rapor oluşturulacak.' : 'Henüz soru cevaplanmadı.'}
          confirmLabel={records.length ? 'Bitir ve raporla' : 'Çık'}
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => {
            setConfirmExit(false);
            if (records.length) finish(records);
            else setPhase('setup');
          }}
        />
      </div>
    );
  }

  // ------------------------------------------------ kurulum
  const themeRelevant = ['karma', 'vocab', 'grammar'].includes(mode);
  return (
    <div className="animate-pop space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {EXAM_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-2xl p-3 text-left ring-1 transition ${
              mode === m.id ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white ring-black/5 dark:bg-slate-900 dark:ring-white/10'
            }`}
          >
            <p className="text-xl">{m.icon}</p>
            <p className="mt-1 font-bold leading-tight">{m.title}</p>
            <p className={`mt-0.5 text-xs leading-snug ${mode === m.id ? 'text-white/80' : 'text-slate-500'}`}>
              {m.id === 'mistakes' ? `${mistakesCount} kayıtlı hata · ` : ''}
              {m.desc}
            </p>
          </button>
        ))}
      </div>

      <Card className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Soru sayısı</p>
          <Segmented
            value={count}
            onChange={setCount}
            options={[
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 30, label: '30' },
            ]}
          />
        </div>
        {themeRelevant && (
          <div>
            <p className="mb-2 text-sm font-semibold">Tema (kelime soruları için)</p>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Tüm temalar</option>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_TR[t]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-semibold">Değerlendirme</p>
          <Segmented
            value={instant ? 'instant' : 'exam'}
            onChange={(v) => setInstant(v === 'instant')}
            options={[
              { value: 'instant', label: 'Anında geri bildirim' },
              { value: 'exam', label: 'Gerçek sınav modu' },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Soru kaynağı</p>
          <Segmented
            value={useAi ? 'ai' : 'local'}
            onChange={(v) => {
              if (v === 'ai' && !settings.apiKey) {
                toast('AI soruları için Ayarlar’dan Gemini API anahtarı girin');
                return;
              }
              setUseAi(v === 'ai');
            }}
            options={[
              { value: 'local', label: 'Çevrimdışı motor' },
              { value: 'ai', label: '✨ Gemini AI' },
            ]}
          />
          {!settings.apiKey && (
            <button className="mt-2 text-xs text-brand-600 underline dark:text-brand-300" onClick={() => navigate('settings')}>
              AI için API anahtarı ekle →
            </button>
          )}
        </div>
      </Card>

      <Button className="w-full" icon="target" onClick={start} disabled={mode === 'mistakes' && mistakesCount === 0 && !getState().worksheetQueue.length && !allWords(getState().customWords).some((w) => mastery(getState().words[w.id]) === 'weak')}>
        Sınavı başlat
      </Button>
      {mode === 'mistakes' && mistakesCount === 0 && (
        <p className="text-center text-sm text-slate-500">Henüz hata kaydın yok — önce bir sınav çöz.</p>
      )}
    </div>
  );
}
