import { useDeferredValue, useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, Icon, Segmented, Sheet, SpeakButton, toast } from '../components/ui';
import { WordDetailSheet, WordHeadline, masteryTone } from '../components/WordDetail';
import { addCustomWords, toggleBookmark, useStore } from '../lib/store';
import { uid } from '../lib/util';
import { MASTERY_TR, THEMES, THEME_TR, TYPE_TR, allWords, mastery, type Mastery } from '../lib/words';
import type { Word, WordType } from '../types';

const PAGE = 60;

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function AddWordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [de, setDe] = useState('');
  const [tr, setTr] = useState('');
  const [type, setType] = useState<WordType>('Nomen');
  const [article, setArticle] = useState('der');
  const [plural, setPlural] = useState('');
  const [example, setExample] = useState('');
  const [bulk, setBulk] = useState('');

  const reset = () => {
    setDe('');
    setTr('');
    setPlural('');
    setExample('');
    setBulk('');
  };

  const makeWord = (rawDe: string, rawTr: string, t: WordType, art?: string, pl?: string, ex?: string): Word => {
    const lemma = rawDe.trim();
    return {
      id: uid('own'),
      de: t === 'Nomen' && art ? `${art} ${lemma}${pl ? ', ' + pl : ''}` : lemma,
      lemma,
      tr: rawTr.trim(),
      type: t,
      theme: 'Allgemein',
      examples: ex ? [ex.trim()] : [],
      source: 'Eigene',
      article: t === 'Nomen' ? art : undefined,
      plural: pl || undefined,
    };
  };

  const saveSingle = () => {
    if (!de.trim() || !tr.trim()) return toast('Almanca ve Türkçe alanları zorunlu');
    addCustomWords([makeWord(de, tr, type, article, plural.trim(), example)]);
    toast('Kelime eklendi');
    reset();
    onClose();
  };

  const saveBulk = () => {
    const words: Word[] = [];
    for (const line of bulk.split('\n')) {
      const m = line.split(/\s*[=;\t]\s*/);
      if (m.length < 2 || !m[0].trim() || !m[1].trim()) continue;
      const left = m[0].trim();
      const am = left.match(/^(der|die|das)\s+([^,]+)(?:,\s*(.+))?$/);
      if (am) words.push(makeWord(am[2], m[1], 'Nomen', am[1], am[3]?.trim(), m[2]));
      else words.push(makeWord(left, m[1], /^[a-zäöüß]+(en|ern|eln)$/.test(left) ? 'Verb' : 'Andere', undefined, undefined, m[2]));
    }
    if (!words.length) return toast('Geçerli satır bulunamadı. Biçim: der Teppich, -e = halı');
    addCustomWords(words);
    toast(`${words.length} kelime eklendi`);
    reset();
    onClose();
  };

  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800';
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Kelime ekle"
      footer={
        <Button className="w-full" onClick={mode === 'single' ? saveSingle : saveBulk} icon="plus">
          Kaydet
        </Button>
      }
    >
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'single', label: 'Tek kelime' },
          { value: 'bulk', label: 'Toplu içe aktar' },
        ]}
      />
      {mode === 'single' ? (
        <div className="mt-4 space-y-3">
          <select className={input} value={type} onChange={(e) => setType(e.target.value as WordType)}>
            {Object.entries(TYPE_TR).map(([k, v]) => (
              <option key={k} value={k}>
                {v} ({k})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {type === 'Nomen' && (
              <select className={`${input} w-24`} value={article} onChange={(e) => setArticle(e.target.value)}>
                <option>der</option>
                <option>die</option>
                <option>das</option>
              </select>
            )}
            <input className={input} placeholder="Almanca (ör. Teppich)" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          {type === 'Nomen' && <input className={input} placeholder="Çoğul (ör. Teppiche)" value={plural} onChange={(e) => setPlural(e.target.value)} />}
          <input className={input} placeholder="Türkçe anlamı" value={tr} onChange={(e) => setTr(e.target.value)} />
          <textarea className={input} rows={2} placeholder="Örnek cümle (isteğe bağlı)" value={example} onChange={(e) => setExample(e.target.value)} />
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-2 text-sm text-slate-500">
            Her satıra bir kelime: <code>der Teppich, Teppiche = halı = Der Teppich ist neu.</code> (örnek cümle isteğe bağlı)
          </p>
          <textarea
            className={`${input} font-mono text-sm`}
            rows={10}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={'der Teppich, Teppiche = halı\nverschieben = ertelemek\ndie Heizung = kalorifer'}
          />
        </div>
      )}
    </Sheet>
  );
}

export default function Words() {
  const custom = useStore((s) => s.customWords);
  const progress = useStore((s) => s.words);
  const bookmarks = useStore((s) => s.bookmarks);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'' | Mastery | 'bookmarks' | 'own'>('');
  const [limit, setLimit] = useState(PAGE);
  const [detail, setDetail] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const q = useDeferredValue(query);

  const all = allWords(custom);
  const filtered = useMemo(() => {
    const nq = normalize(q.trim());
    return all.filter((w) => {
      if (theme && w.theme !== theme) return false;
      if (type && w.type !== type) return false;
      if (status === 'bookmarks' && !bookmarks.includes(w.id)) return false;
      if (status === 'own' && w.source !== 'Eigene') return false;
      if (status && status !== 'bookmarks' && status !== 'own' && mastery(progress[w.id]) !== status) return false;
      if (nq && !normalize(w.de).includes(nq) && !normalize(w.tr).includes(nq)) return false;
      return true;
    });
  }, [all, q, theme, type, status, progress, bookmarks]);

  const activeFilters = [theme, type, status].filter(Boolean).length;

  return (
    <div>
      <div className="sticky -top-4 z-10 -mx-4 bg-paper/95 px-4 pb-2 pt-1 backdrop-blur dark:bg-[#0b1220]/95">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
              placeholder="Almanca veya Türkçe ara…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative rounded-xl px-3 ${showFilters ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'}`}
            aria-label="Filtreler"
          >
            <Icon name="settings" size={18} />
            {activeFilters > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[11px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
          <button onClick={() => setAdding(true)} className="rounded-xl bg-brand-700 px-3 text-white" aria-label="Kelime ekle">
            <Icon name="plus" size={20} />
          </button>
        </div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {(['', 'new', 'learning', 'weak', 'learned', 'bookmarks', 'own'] as const).map((s) => (
            <Chip
              key={s || 'all'}
              active={status === s}
              onClick={() => {
                setStatus(s);
                setLimit(PAGE);
              }}
            >
              {s === '' ? 'Tümü' : s === 'bookmarks' ? '★ Yer imleri' : s === 'own' ? 'Kendi kelimelerim' : MASTERY_TR[s]}
            </Chip>
          ))}
        </div>
        {showFilters && (
          <div className="animate-pop mt-2 space-y-2 rounded-2xl bg-white p-3 ring-1 ring-black/5 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500">Tema</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={!theme} onClick={() => setTheme('')}>
                Tümü
              </Chip>
              {THEMES.map((t) => (
                <Chip key={t} active={theme === t} onClick={() => setTheme(t)}>
                  {THEME_TR[t]}
                </Chip>
              ))}
            </div>
            <p className="pt-1 text-xs font-bold uppercase text-slate-500">Kelime türü</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={!type} onClick={() => setType('')}>
                Tümü
              </Chip>
              {Object.entries(TYPE_TR).map(([k, v]) => (
                <Chip key={k} active={type === k} onClick={() => setType(k)}>
                  {v}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <p className="mt-2 px-1 text-xs text-slate-500">{filtered.length} kelime</p>
      </div>

      <Card className="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.slice(0, limit).map((w) => {
          const m = mastery(progress[w.id]);
          return (
            <div key={w.id} className="flex items-center gap-1 px-3 py-2.5">
              <button className="min-w-0 flex-1 text-left" onClick={() => setDetail(w.id)}>
                <div className="flex items-center gap-2">
                  <WordHeadline w={w} />
                  {m !== 'new' && (
                    <Badge tone={masteryTone(m)} className="!px-1.5 !py-0 text-[10px]">
                      {MASTERY_TR[m]}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {w.tr}
                  {w.type === 'Nomen' && w.plural ? ` · Pl. ${w.plural}` : ''}
                  {w.type === 'Verb' && w.partizip ? ` · ${w.perfektAux === 'sein' ? 'ist' : 'hat'} ${w.partizip}` : ''}
                </p>
              </button>
              <SpeakButton text={w.type === 'Nomen' && w.article ? `${w.article} ${w.lemma}` : w.lemma} size={17} />
              <button onClick={() => toggleBookmark(w.id)} className={`p-2 ${bookmarks.includes(w.id) ? 'text-gold-500' : 'text-slate-300 dark:text-slate-600'}`}>
                <Icon name="star" size={18} fill={bookmarks.includes(w.id)} />
              </button>
            </div>
          );
        })}
        {!filtered.length && <p className="p-6 text-center text-slate-500">Sonuç bulunamadı.</p>}
      </Card>
      {filtered.length > limit && (
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setLimit(limit + PAGE)}>
          Daha fazla göster ({filtered.length - limit})
        </Button>
      )}

      <WordDetailSheet wordId={detail} onClose={() => setDetail(null)} />
      <AddWordSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
