import { useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, Empty, Icon, ProgressBar, Segmented, SpeakButton, sayGerman } from '../components/ui';
import { WordHeadline } from '../components/WordDetail';
import { useBackHandler } from '../lib/nav';
import { getState, gradeCard, useStore } from '../lib/store';
import { shuffle } from '../lib/util';
import { THEMES, THEME_TR, allWords, headword, isDue, mastery } from '../lib/words';
import type { Word } from '../types';

type Source = 'daily' | 'theme' | 'bookmarks' | 'weak' | 'nouns' | 'verbs';
type Dir = 'de-tr' | 'tr-de';

function buildDeck(source: Source, theme: string, newLimit: number): Word[] {
  const s = getState();
  const all = allWords(s.customWords).filter((w) => w.source !== 'Gruppe' || w.type === 'Nomen');
  const now = Date.now();
  switch (source) {
    case 'daily': {
      const due = all.filter((w) => isDue(s.words[w.id], now));
      const fresh = shuffle(all.filter((w) => !s.words[w.id] && w.source !== 'Gruppe')).slice(0, newLimit);
      return [...shuffle(due).slice(0, 60), ...fresh];
    }
    case 'theme':
      return shuffle(all.filter((w) => w.theme === theme)).slice(0, 30);
    case 'bookmarks':
      return shuffle(all.filter((w) => s.bookmarks.includes(w.id)));
    case 'weak':
      return shuffle(all.filter((w) => mastery(s.words[w.id]) === 'weak' || s.worksheetQueue.includes(w.id)));
    case 'nouns':
      return shuffle(all.filter((w) => w.type === 'Nomen' && w.article && mastery(s.words[w.id]) !== 'learned')).slice(0, 30);
    case 'verbs':
      return shuffle(all.filter((w) => w.type === 'Verb' && mastery(s.words[w.id]) !== 'learned')).slice(0, 30);
  }
}

function CardFace({ w, side, dir }: { w: Word; side: 'front' | 'back'; dir: Dir }) {
  const showGerman = (side === 'front') === (dir === 'de-tr');
  if (showGerman) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{side === 'front' ? 'Almanca' : 'Cevap'}</p>
        <WordHeadline w={w} big />
        {w.type === 'Nomen' && w.plural && side === 'back' && <p className="text-slate-500">Plural: die {w.plural}</p>}
        {w.type === 'Verb' && w.partizip && side === 'back' && (
          <p className="text-slate-500">
            {w.present3 ? `${w.present3} · ` : ''}
            {w.perfektAux === 'sein' ? 'ist' : 'hat'} {w.partizip}
          </p>
        )}
        <SpeakButton text={headword(w)} size={26} className="bg-brand-50 dark:bg-slate-800" />
        {side === 'back' && w.examples[0] && (
          <div className="mt-2 flex items-start gap-1 rounded-xl bg-paper p-3 text-left text-sm italic dark:bg-slate-800">
            <span className="flex-1">„{w.examples[0]}“</span>
            <SpeakButton text={w.examples[0]} size={15} />
          </div>
        )}
        {side === 'back' && dir === 'tr-de' && <p className="text-sm text-slate-500">{w.tr}</p>}
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{side === 'front' ? 'Türkçe' : 'Cevap'}</p>
      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{w.tr}</p>
      {side === 'back' && (
        <>
          <p className="text-lg text-slate-600 dark:text-slate-300">{w.de}</p>
          {w.examples[0] && <p className="rounded-xl bg-paper p-3 text-sm italic dark:bg-slate-800">„{w.examples[0]}“</p>}
        </>
      )}
      {side === 'front' && <p className="text-sm text-slate-400">Almancasını düşün, sonra kartı çevir</p>}
    </div>
  );
}

export default function Cards() {
  const settings = useStore((s) => s.settings);
  const progress = useStore((s) => s.words);
  const bookmarks = useStore((s) => s.bookmarks);
  const custom = useStore((s) => s.customWords);
  const [source, setSource] = useState<Source>('daily');
  const [theme, setTheme] = useState(THEMES[0]);
  const [dir, setDir] = useState<Dir>('de-tr');
  const [deck, setDeck] = useState<Word[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState({ known: 0, again: 0 });
  const [autoSpeak, setAutoSpeak] = useState(true);

  useBackHandler(!!deck, () => {
    setDeck(null);
    return true;
  });

  const counts = useMemo(() => {
    const all = allWords(custom);
    const now = Date.now();
    return {
      due: all.filter((w) => isDue(progress[w.id], now)).length,
      weak: all.filter((w) => mastery(progress[w.id]) === 'weak').length,
      bookmarks: bookmarks.length,
    };
  }, [custom, progress, bookmarks]);

  const start = () => {
    const d = buildDeck(source, theme, settings.newCardsPerDay);
    setDeck(d);
    setIdx(0);
    setFlipped(false);
    setResult({ known: 0, again: 0 });
    if (d.length && autoSpeak && dir === 'de-tr') setTimeout(() => sayGerman(headword(d[0])), 300);
  };

  if (!deck) {
    const sources: { id: Source; label: string; desc: string; count?: number }[] = [
      { id: 'daily', label: 'Günlük tekrar', desc: `${counts.due} tekrar + ${settings.newCardsPerDay} yeni kelime`, count: counts.due },
      { id: 'theme', label: 'Temaya göre', desc: 'Bir Goethe teması seç' },
      { id: 'nouns', label: 'Artikel odaklı', desc: 'İsimler: der / die / das' },
      { id: 'verbs', label: 'Fiiller', desc: 'Perfekt formlarıyla' },
      { id: 'weak', label: 'Zayıf kelimeler', desc: 'Hatalı ve kağıda eklenenler', count: counts.weak },
      { id: 'bookmarks', label: 'Yer imleri', desc: 'Yıldızladığın kelimeler', count: counts.bookmarks },
    ];
    return (
      <div className="animate-pop space-y-4">
        <Card className="p-4">
          <p className="font-bold">Leitner aralıklı tekrar sistemi</p>
          <p className="mt-1 text-sm text-slate-500">
            „Biliyorum“ dediğin kart bir üst kutuya çıkar ve 1 → 2 → 4 → 8 → 16 → 32 gün sonra tekrar gelir. „Tekrar et“ kartı başa döndürür.
          </p>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`rounded-2xl p-3 text-left ring-1 transition ${
                source === s.id ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white ring-black/5 dark:bg-slate-900 dark:ring-white/10'
              }`}
            >
              <p className="font-bold">{s.label}</p>
              <p className={`text-xs ${source === s.id ? 'text-white/80' : 'text-slate-500'}`}>{s.desc}</p>
            </button>
          ))}
        </div>
        {source === 'theme' && (
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <Chip key={t} active={theme === t} onClick={() => setTheme(t)}>
                {THEME_TR[t]}
              </Chip>
            ))}
          </div>
        )}
        <Segmented
          value={dir}
          onChange={setDir}
          options={[
            { value: 'de-tr', label: 'Almanca → Türkçe' },
            { value: 'tr-de', label: 'Türkçe → Almanca' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="h-4 w-4" />
          Kart açılınca Almancayı otomatik seslendir
        </label>
        <Button className="w-full" icon="layers" onClick={start}>
          Başla
        </Button>
      </div>
    );
  }

  if (!deck.length)
    return (
      <Empty
        icon="check"
        title="Bu destede kart yok"
        text="Başka bir kaynak seç veya kelimeleri yıldızla."
        action={
          <Button className="mt-3" onClick={() => setDeck(null)}>
            Geri dön
          </Button>
        }
      />
    );

  if (idx >= deck.length) {
    const total = result.known + result.again;
    return (
      <div className="animate-pop space-y-4 text-center">
        <Card className="p-6">
          <p className="text-5xl">🎉</p>
          <p className="mt-2 text-2xl font-extrabold">Oturum tamamlandı!</p>
          <p className="mt-1 text-slate-500">{total} kart değerlendirildi</p>
          <div className="mt-4 flex justify-center gap-3">
            <Badge tone="green">✓ {result.known} biliyorum</Badge>
            <Badge tone="red">↺ {result.again} tekrar</Badge>
          </div>
        </Card>
        <Button className="w-full" onClick={start} icon="refresh">
          Yeni oturum
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => setDeck(null)}>
          Kaynak seçimine dön
        </Button>
      </div>
    );
  }

  const w = deck[idx];
  const grade = (known: boolean) => {
    gradeCard(w.id, known);
    setResult((r) => ({ known: r.known + (known ? 1 : 0), again: r.again + (known ? 0 : 1) }));
    if (!known) {
      // kartı 3 sıra sonrasına tekrar koy
      const next = deck.slice();
      next.splice(Math.min(next.length, idx + 4), 0, w);
      setDeck(next);
    }
    setFlipped(false);
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    const nw = (known ? deck : [...deck.slice(0, idx + 4), w, ...deck.slice(idx + 4)])[nextIdx];
    if (nw && autoSpeak && dir === 'de-tr') setTimeout(() => sayGerman(headword(nw)), 350);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setDeck(null)} className="rounded-full p-1.5 text-slate-500" aria-label="Kapat">
          <Icon name="x" />
        </button>
        <ProgressBar value={(idx / deck.length) * 100} />
        <span className="text-sm font-semibold text-slate-500">
          {idx + 1}/{deck.length}
        </span>
      </div>
      <div className="flip-scene h-[400px]" onClick={() => setFlipped(!flipped)}>
        <div className={`flip-card h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flip-face rounded-3xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <CardFace w={w} side="front" dir={dir} />
          </div>
          <div className="flip-face flip-back rounded-3xl bg-white shadow-lg ring-2 ring-brand-200 dark:bg-slate-900 dark:ring-brand-700">
            <CardFace w={w} side="back" dir={dir} />
          </div>
        </div>
      </div>
      {!flipped ? (
        <Button onClick={() => setFlipped(true)} icon="refresh" className="w-full">
          Kartı çevir
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => grade(false)} icon="refresh">
            Tekrar et
          </Button>
          <Button variant="success" onClick={() => grade(true)} icon="check">
            Biliyorum
          </Button>
        </div>
      )}
      <p className="text-center text-xs text-slate-400">Karta dokunarak da çevirebilirsin</p>
    </div>
  );
}
