import { useMemo, useState } from 'react';
import { Badge, Button, Card, Icon, ProgressBar, SectionTitle, SpeakButton, StatTile } from '../components/ui';
import { WordDetailSheet, WordHeadline } from '../components/WordDetail';
import { navigate } from '../lib/nav';
import { avgScore, dayActivity, daysUntil, lastDays, streak } from '../lib/progress';
import { useStore } from '../lib/store';
import { formatDate, hashString, todayKey } from '../lib/util';
import { allWords, errorRate, mastery, stats } from '../lib/words';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default function Home() {
  const state = useStore((s) => s);
  const [detail, setDetail] = useState<string | null>(null);
  const st = useMemo(() => stats(state), [state]);
  const all = allWords(state.customWords);
  const today = todayKey();
  const todayCount = dayActivity(state, today);
  const goal = state.settings.dailyGoal;
  const str = streak(state);
  const avg = avgScore(state);
  const days = lastDays(state, 7);
  const maxDay = Math.max(goal, ...days.map((d) => d.value), 1);
  const countdown = daysUntil(state.settings.examDate);

  const wordOfDay = useMemo(() => {
    const cands = all.filter((w) => w.source === 'A2' && w.examples.length);
    return cands[hashString(today) % cands.length];
  }, [all, today]);

  const weak = useMemo(
    () =>
      all
        .filter((w) => mastery(state.words[w.id]) === 'weak')
        .sort((a, b) => errorRate(state.words[b.id]) - errorRate(state.words[a.id]))
        .slice(0, 5),
    [all, state.words],
  );

  return (
    <div className="animate-pop">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white">
          <p className="text-sm opacity-80">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="mt-1 text-2xl font-extrabold">
            {greeting()}
            {state.settings.userName ? `, ${state.settings.userName}` : ''}! 👋
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs opacity-90">
                <span>Günlük hedef</span>
                <span>
                  {todayCount}/{goal}
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${Math.min(100, (todayCount / goal) * 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2">
              <Icon name="flame" size={18} className="text-gold-500" />
              <span className="text-lg font-bold">{str}</span>
              <span className="text-xs opacity-80">gün</span>
            </div>
          </div>
          {countdown !== null && countdown >= 0 && (
            <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
              🎯 Sınavına <strong>{countdown}</strong> gün kaldı ({formatDate(state.settings.examDate)})
            </p>
          )}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card onClick={() => navigate('cards')} className="p-4">
          <Icon name="layers" className="text-brand-600 dark:text-brand-300" />
          <p className="mt-2 font-bold">Kartları tekrarla</p>
          <p className="text-xs text-slate-500">{st.due > 0 ? `${st.due} kart tekrar bekliyor` : 'Yeni kelimeler öğren'}</p>
        </Card>
        <Card onClick={() => navigate('exam', { mode: 'karma' })} className="p-4">
          <Icon name="target" className="text-rose-600 dark:text-rose-300" />
          <p className="mt-2 font-bold">Karma sınav</p>
          <p className="text-xs text-slate-500">Goethe dağılımıyla test</p>
        </Card>
        <Card onClick={() => navigate('writing')} className="p-4">
          <Icon name="pen" className="text-emerald-600 dark:text-emerald-300" />
          <p className="mt-2 font-bold">Yazma pratiği</p>
          <p className="text-xs text-slate-500">Schreiben Teil 1 & 2</p>
        </Card>
        <Card onClick={() => navigate('worksheet')} className="p-4">
          <Icon name="file" className="text-gold-700 dark:text-amber-300" />
          <p className="mt-2 font-bold">Çalışma kağıdı</p>
          <p className="text-xs text-slate-500">Daktilo stili, yazdırılabilir</p>
        </Card>
      </div>

      {wordOfDay && (
        <>
          <SectionTitle>Günün kelimesi</SectionTitle>
          <Card onClick={() => setDetail(wordOfDay.id)} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <WordHeadline w={wordOfDay} big />
                <p className="text-slate-600 dark:text-slate-300">{wordOfDay.tr}</p>
              </div>
              <SpeakButton text={wordOfDay.lemma} />
            </div>
            <p className="mt-3 rounded-xl bg-paper p-3 text-[15px] italic dark:bg-slate-800">„{wordOfDay.examples[0]}“</p>
          </Card>
        </>
      )}

      <SectionTitle>İlerleme</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon="check" tone="green" label="Öğrenilen" value={st.learned} sub={`${st.total} kelimeden · %${Math.round((st.learned / st.total) * 100)}`} />
        <StatTile icon="chart" label="Sınav ort. (son 5)" value={avg === null ? '–' : `%${avg}`} sub={`${state.tests.length} sınav çözüldü`} />
        <StatTile icon="alert" tone="red" label="Hata defteri" value={state.mistakes.length} sub="tekrar bekleyen soru" />
        <StatTile icon="refresh" tone="gold" label="Öğreniliyor" value={st.learning} sub={`${st.weak} zayıf kelime`} />
      </div>
      <Card className="mt-3 p-4">
        <p className="mb-1 flex justify-between text-sm font-semibold">
          <span>Kelime hâkimiyeti</span>
          <span className="text-slate-500">%{Math.round(((st.learned + st.learning * 0.4) / st.total) * 100)}</span>
        </p>
        <ProgressBar value={((st.learned + st.learning * 0.4) / st.total) * 100} tone="green" />
        <p className="mb-2 mt-4 text-sm font-semibold">Son 7 gün</p>
        <div className="flex h-24 items-end gap-2">
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md ${d.value >= goal ? 'bg-emerald-500' : d.value > 0 ? 'bg-brand-400' : 'bg-slate-200 dark:bg-slate-700'}`}
                  style={{ height: `${Math.max(6, (d.value / maxDay) * 100)}%` }}
                  title={`${d.value}`}
                />
              </div>
              <span className={`text-[10px] ${d.key === today ? 'font-bold text-brand-700 dark:text-brand-300' : 'text-slate-400'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {weak.length > 0 && (
        <>
          <SectionTitle action={<Button small variant="ghost" onClick={() => navigate('exam', { mode: 'mistakes' })}>Çalış</Button>}>
            Zayıf kelimeler
          </SectionTitle>
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {weak.map((w) => (
              <button key={w.id} onClick={() => setDetail(w.id)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                <div className="min-w-0">
                  <WordHeadline w={w} />
                  <p className="truncate text-sm text-slate-500">{w.tr}</p>
                </div>
                <Badge tone="red">%{errorRate(state.words[w.id])}</Badge>
              </button>
            ))}
          </Card>
        </>
      )}

      {state.tests.length > 0 && (
        <>
          <SectionTitle action={<Button small variant="ghost" onClick={() => navigate('history')}>Tümü</Button>}>Son sınavlar</SectionTitle>
          <div className="space-y-2">
            {state.tests.slice(0, 3).map((t) => (
              <Card key={t.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(t.date)} · {t.correctAnswers}/{t.totalQuestions} doğru
                  </p>
                </div>
                <Badge tone={t.passed ? 'green' : 'red'}>%{t.percentage}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}

      <WordDetailSheet wordId={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
