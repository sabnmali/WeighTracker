import { useMemo, useState } from 'react';
import { GeminiError, memoryHookAI } from '../lib/gemini';
import { microQuiz } from '../lib/questionGen';
import { addToWorksheetQueue, deleteCustomWord, getState, gradeCard, registerAnswer, resetWordProgress, setWordNote, toggleBookmark, useStore } from '../lib/store';
import { ARTICLE_COLOR, MASTERY_TR, THEME_TR, TYPE_TR, allWords, errorRate, headword, mastery } from '../lib/words';
import type { Question, Word } from '../types';
import { Badge, Button, Icon, Sheet, SpeakButton, toast } from './ui';

export function WordHeadline({ w, big }: { w: Word; big?: boolean }) {
  const art = w.type === 'Nomen' && w.article && ['der', 'die', 'das'].includes(w.article) ? w.article : '';
  return (
    <span className={big ? 'text-3xl font-extrabold' : 'font-bold'}>
      {art && <span className={`${ARTICLE_COLOR[art]} mr-1`}>{art}</span>}
      <span className="text-slate-900 dark:text-white">{art ? w.lemma : w.lemma || w.de}</span>
    </span>
  );
}

export function masteryTone(m: string) {
  return m === 'learned' ? 'green' : m === 'weak' ? 'red' : m === 'learning' ? 'amber' : 'slate';
}

function MicroQuiz({ word, onDone }: { word: Word; onDone: () => void }) {
  const custom = useStore((s) => s.customWords);
  const questions = useMemo<Question[]>(() => microQuiz(word, allWords(custom)), [word, custom]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  if (!questions.length) return <p className="text-sm text-slate-500">Bu kelime için soru üretilemedi.</p>;
  if (i >= questions.length)
    return (
      <div className="rounded-2xl bg-brand-50 p-4 text-center dark:bg-slate-800">
        <p className="text-lg font-bold">
          {score} / {questions.length} doğru
        </p>
        <Button small className="mt-3" onClick={onDone}>
          Tamam
        </Button>
      </div>
    );
  const q = questions[i];
  const answer = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === q.correctAnswer;
    if (ok) setScore((s) => s + 1);
    registerAnswer(q, o, ok);
  };
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 dark:bg-slate-800">
      <p className="text-xs font-semibold text-slate-500">
        Mikro quiz {i + 1}/{questions.length}
      </p>
      <p className="mt-1 font-semibold">{q.question}</p>
      {q.questionTr && <p className="text-sm text-slate-500">{q.questionTr}</p>}
      <div className="mt-3 grid gap-2">
        {q.options!.map((o) => {
          const state = picked ? (o === q.correctAnswer ? 'ok' : o === picked ? 'bad' : '') : '';
          return (
            <button
              key={o}
              onClick={() => answer(o)}
              className={`rounded-xl border px-3 py-2 text-left text-sm ${
                state === 'ok'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                  : state === 'bad'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30'
                    : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked && (
        <>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{q.explanation}</p>
          <Button
            small
            className="mt-3"
            onClick={() => {
              setPicked(null);
              setI(i + 1);
            }}
          >
            Devam
          </Button>
        </>
      )}
    </div>
  );
}

export function WordDetailSheet({ wordId, onClose }: { wordId: string | null; onClose: () => void }) {
  const custom = useStore((s) => s.customWords);
  const progress = useStore((s) => (wordId ? s.words[wordId] : undefined));
  const bookmarks = useStore((s) => s.bookmarks);
  const note = useStore((s) => (wordId ? s.notes[wordId] : undefined));
  const settings = useStore((s) => s.settings);
  const [quiz, setQuiz] = useState(false);
  const [hookLoading, setHookLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const w = wordId ? allWords(custom).find((x) => x.id === wordId) : undefined;
  if (!w) return null;
  const m = mastery(progress);
  const marked = bookmarks.includes(w.id);

  const genHook = async () => {
    setHookLoading(true);
    try {
      const h = await memoryHookAI(settings, w);
      setWordNote(w.id, { hook: h.trim() });
    } catch (e) {
      toast(e instanceof GeminiError ? e.message : 'Hafıza çengeli üretilemedi.');
    } finally {
      setHookLoading(false);
    }
  };

  return (
    <Sheet
      open={!!wordId}
      onClose={() => {
        setQuiz(false);
        setNoteDraft(null);
        onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <span className="truncate">{headword(w)}</span>
          <SpeakButton text={headword(w)} />
        </div>
      }
      full
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 dark:bg-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <WordHeadline w={w} big />
              <p className="mt-1 text-lg text-slate-700 dark:text-slate-200">{w.tr}</p>
            </div>
            <button
              onClick={() => toggleBookmark(w.id)}
              className={`rounded-full p-2 ${marked ? 'text-gold-500' : 'text-slate-400'}`}
              aria-label="Yer imi"
            >
              <Icon name="star" fill={marked} size={24} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="brand">{TYPE_TR[w.type] || w.type}</Badge>
            <Badge>{THEME_TR[w.theme] || w.theme}</Badge>
            <Badge tone={masteryTone(m)}>{MASTERY_TR[m]}</Badge>
            {progress && progress.seen > 0 && <Badge tone={errorRate(progress) >= 40 ? 'red' : 'slate'}>Hata oranı %{errorRate(progress)}</Badge>}
            {w.source === 'Eigene' && <Badge tone="gold">Kendi kelimem</Badge>}
          </div>
          <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {w.type === 'Nomen' && w.plural && (
              <p>
                <strong>Çoğul:</strong> die {w.plural}
              </p>
            )}
            {w.type === 'Nomen' && w.sgOnly && <p>Yalnızca tekil kullanılır.</p>}
            {w.type === 'Verb' && (
              <>
                {w.present3 && (
                  <p>
                    <strong>Präsens (er/sie):</strong> {w.present3}
                  </p>
                )}
                {w.praeteritum && (
                  <p>
                    <strong>Präteritum:</strong> {w.praeteritum}
                  </p>
                )}
                {w.partizip && (
                  <p>
                    <strong>Perfekt:</strong> {w.perfektAux === 'sein' ? 'ist' : w.perfektAux === 'haben' ? 'hat' : 'hat/ist'} {w.partizip}
                  </p>
                )}
                {w.reflexive && <p>Dönüşlü fiil (sich …)</p>}
              </>
            )}
            <p className="text-xs text-slate-400">Kaynak: {w.de}</p>
          </div>
        </div>

        {w.examples.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Örnek cümleler</p>
            <div className="space-y-2">
              {w.examples.map((ex) => (
                <div key={ex} className="flex items-start gap-2 rounded-xl bg-white p-3 ring-1 ring-black/5 dark:bg-slate-800">
                  <p className="flex-1 text-[15px] leading-relaxed">{ex}</p>
                  <SpeakButton text={ex} size={16} />
                </div>
              ))}
            </div>
          </div>
        )}

        {quiz ? (
          <MicroQuiz word={w} onDone={() => setQuiz(false)} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button icon="target" onClick={() => setQuiz(true)}>
              Mikro quiz
            </Button>
            <Button
              variant="secondary"
              icon="file"
              onClick={() => {
                addToWorksheetQueue([w.id]);
                toast('Çalışma kağıdı listesine eklendi');
              }}
            >
              Kağıda ekle
            </Button>
            <Button
              variant="secondary"
              icon="check"
              onClick={() => {
                gradeCard(w.id, true);
                toast('Biliyorum olarak işaretlendi');
              }}
            >
              Biliyorum
            </Button>
            <Button
              variant="secondary"
              icon="refresh"
              onClick={() => {
                gradeCard(w.id, false);
                toast('Tekrar listesine alındı');
              }}
            >
              Tekrar et
            </Button>
          </div>
        )}

        <div className="rounded-2xl bg-gold-100/60 p-4 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gold-700 dark:text-amber-300">Hafıza çengeli & not</p>
            <Button small variant="ghost" icon="sparkles" onClick={genHook} disabled={hookLoading}>
              {hookLoading ? 'Üretiliyor…' : 'AI çengel'}
            </Button>
          </div>
          {note?.hook && <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{note.hook}</p>}
          {noteDraft === null ? (
            <button className="mt-2 w-full text-left text-sm text-slate-500 underline" onClick={() => setNoteDraft(note?.note || '')}>
              {note?.note ? note.note : 'Kendi notunu ekle…'}
            </button>
          ) : (
            <div className="mt-2">
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                rows={3}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Örn: der Löffel → 'Löffel erkek gibi sert' …"
              />
              <Button
                small
                className="mt-1"
                onClick={() => {
                  setWordNote(w.id, { note: noteDraft.trim() });
                  setNoteDraft(null);
                }}
              >
                Kaydet
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pb-2">
          {progress && (
            <Button small variant="ghost" icon="refresh" onClick={() => resetWordProgress(w.id)}>
              İlerlemeyi sıfırla
            </Button>
          )}
          {w.source === 'Eigene' && (
            <Button
              small
              variant="ghost"
              icon="trash"
              onClick={() => {
                deleteCustomWord(w.id);
                onClose();
                toast('Kelime silindi');
              }}
            >
              Kelimeyi sil
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function getWord(id: string): Word | undefined {
  return allWords(getState().customWords).find((w) => w.id === id);
}
