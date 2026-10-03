import { useState } from 'react';
import { Badge, Card, Empty, ProgressBar } from '../components/ui';
import { CATEGORY_ICON } from '../lib/exam';
import { useStore } from '../lib/store';
import { formatDate, formatDuration } from '../lib/util';

export default function History() {
  const tests = useStore((s) => s.tests);
  const [open, setOpen] = useState<string | null>(null);
  if (!tests.length) return <Empty icon="history" title="Henüz sınav çözülmedi" text="Sınav sekmesinden ilk testini başlat." />;

  const recent = tests.slice(0, 12).reverse();
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">Puan gelişimi (son {recent.length} sınav)</p>
        <div className="relative flex h-32 items-end gap-1.5">
          <div className="absolute inset-x-0 border-t border-dashed border-gold-500" style={{ bottom: '60%' }} />
          {recent.map((t) => (
            <div key={t.id} className="flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
              <div className={`w-full rounded-t ${t.passed ? 'bg-emerald-500' : 'bg-rose-400'}`} style={{ height: `${Math.max(4, t.percentage)}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Kesikli çizgi: Goethe geçme sınırı (%60)</p>
      </Card>
      <div className="space-y-2">
        {tests.map((t) => (
          <Card key={t.id} className="overflow-hidden">
            <button className="flex w-full items-center justify-between gap-2 p-3 text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.title}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(t.date)} · {t.correctAnswers}/{t.totalQuestions} · {formatDuration(t.timeSpentSeconds)}
                </p>
              </div>
              <Badge tone={t.passed ? 'green' : 'red'}>%{t.percentage}</Badge>
            </button>
            {open === t.id && t.evaluation && (
              <div className="space-y-2 border-t border-slate-100 p-3 dark:border-slate-800">
                <p className="text-sm font-semibold">{t.evaluation.cefrStatusBadge}</p>
                {t.evaluation.categoryBreakdown.map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs">
                      <span>
                        {CATEGORY_ICON[c.category]} {c.name}
                      </span>
                      <span>
                        %{c.percentage} ({c.correct}/{c.total})
                      </span>
                    </div>
                    <ProgressBar value={c.percentage} tone={c.percentage >= 75 ? 'green' : c.percentage >= 50 ? 'gold' : 'red'} />
                  </div>
                ))}
                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300">
                  {t.evaluation.actionableTips.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
