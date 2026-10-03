import { useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, Confirm, Empty, Icon } from '../components/ui';
import { WordDetailSheet, WordHeadline } from '../components/WordDetail';
import { CATEGORY_TR } from '../lib/exam';
import { navigate } from '../lib/nav';
import { clearMistakes, removeMistake, useStore } from '../lib/store';
import { formatDate } from '../lib/util';
import { allWords, errorRate, mastery } from '../lib/words';
import type { QuestionCategory } from '../types';

export default function Mistakes() {
  const mistakes = useStore((s) => s.mistakes);
  const progress = useStore((s) => s.words);
  const custom = useStore((s) => s.customWords);
  const rules = useStore((s) => s.rules);
  const [tab, setTab] = useState<'questions' | 'words' | 'rules'>('questions');
  const [cat, setCat] = useState<QuestionCategory | ''>('');
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const weakWords = useMemo(
    () =>
      allWords(custom)
        .filter((w) => mastery(progress[w.id]) === 'weak' || (progress[w.id]?.wrong || 0) > 0)
        .sort((a, b) => errorRate(progress[b.id]) - errorRate(progress[a.id]))
        .slice(0, 100),
    [custom, progress],
  );

  const ruleList = useMemo(
    () =>
      Object.entries(rules)
        .filter(([k, v]) => k.startsWith('rule:') && v.wrong > 0)
        .map(([k, v]) => ({ rule: k.slice(5), ...v, rate: Math.round((v.wrong / (v.correct + v.wrong)) * 100) }))
        .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong),
    [rules],
  );

  const cats = Array.from(new Set(mistakes.map((m) => m.question.category)));
  const list = mistakes.filter((m) => !cat || m.question.category === cat);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <Chip active={tab === 'questions'} onClick={() => setTab('questions')}>
          Yanlış sorular ({mistakes.length})
        </Chip>
        <Chip active={tab === 'words'} onClick={() => setTab('words')}>
          Hatalı kelimeler ({weakWords.length})
        </Chip>
        <Chip active={tab === 'rules'} onClick={() => setTab('rules')}>
          Kurallar ({ruleList.length})
        </Chip>
      </div>

      {tab === 'questions' &&
        (mistakes.length === 0 ? (
          <Empty icon="check" title="Hata defterin boş" text="Sınavlarda yanlış yaptığın sorular burada toplanır. Bir soruyu art arda 2 kez doğru yapınca defterden çıkar." />
        ) : (
          <>
            <div className="flex gap-2">
              <Button className="flex-1" icon="refresh" onClick={() => navigate('exam', { mode: 'mistakes' })}>
                Hataları tekrar çöz
              </Button>
              <Button variant="secondary" icon="trash" onClick={() => setConfirm(true)} />
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <Chip active={!cat} onClick={() => setCat('')}>
                Tümü
              </Chip>
              {cats.map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                  {CATEGORY_TR[c]}
                </Chip>
              ))}
            </div>
            <div className="space-y-2">
              {list.map((m) => (
                <Card key={m.questionId} className="overflow-hidden">
                  <button className="flex w-full items-start gap-3 p-3 text-left" onClick={() => setOpen(open === m.questionId ? null : m.questionId)}>
                    <Badge tone="red">{m.count}×</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.question.question}</p>
                      <p className="text-xs text-slate-500">
                        {CATEGORY_TR[m.question.category]} · {formatDate(new Date(m.last).toISOString())}
                        {m.fixedStreak > 0 ? ` · ${m.fixedStreak}/2 düzeltildi` : ''}
                      </p>
                    </div>
                    <Icon name={open === m.questionId ? 'eyeoff' : 'eye'} size={16} className="text-slate-400" />
                  </button>
                  {open === m.questionId && (
                    <div className="space-y-2 px-3 pb-3 text-sm">
                      {m.question.readingText && <p className="whitespace-pre-line rounded-lg bg-paper p-2 text-xs dark:bg-slate-800">{m.question.readingText}</p>}
                      <p>
                        <span className="text-rose-600">Senin cevabın:</span> {m.userAnswer}
                      </p>
                      <p>
                        <span className="text-emerald-600">Doğru cevap:</span> <strong>{m.question.correctAnswer}</strong>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">{m.question.explanation}</p>
                      {m.question.errorTrap && <p className="text-slate-600 dark:text-slate-300">⚠️ {m.question.errorTrap}</p>}
                      <Button small variant="ghost" icon="trash" onClick={() => removeMistake(m.questionId)}>
                        Defterden çıkar
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        ))}

      {tab === 'words' &&
        (weakWords.length === 0 ? (
          <Empty icon="check" title="Hatalı kelime yok" />
        ) : (
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {weakWords.map((w) => {
              const p = progress[w.id];
              return (
                <button key={w.id} onClick={() => setDetail(w.id)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                  <div className="min-w-0">
                    <WordHeadline w={w} />
                    <p className="truncate text-sm text-slate-500">{w.tr}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={errorRate(p) >= 40 ? 'red' : 'amber'}>%{errorRate(p)} hata</Badge>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {p?.wrong || 0} yanlış / {p?.correct || 0} doğru
                    </p>
                  </div>
                </button>
              );
            })}
          </Card>
        ))}

      {tab === 'rules' &&
        (ruleList.length === 0 ? (
          <Empty icon="check" title="Henüz hatalı kural yok" />
        ) : (
          <div className="space-y-2">
            {ruleList.map((r) => (
              <Card key={r.rule} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{r.rule}</p>
                  <Badge tone={r.rate >= 50 ? 'red' : 'amber'}>%{r.rate}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {r.wrong} yanlış · {r.correct} doğru
                </p>
              </Card>
            ))}
          </div>
        ))}

      <WordDetailSheet wordId={detail} onClose={() => setDetail(null)} />
      <Confirm
        open={confirm}
        danger
        title="Hata defteri temizlensin mi?"
        text="Kayıtlı tüm yanlış sorular silinecek. Kelime ilerlemen etkilenmez."
        confirmLabel="Temizle"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          clearMistakes();
          setConfirm(false);
        }}
      />
    </div>
  );
}
