// Üç yönlü birleştirme birim testleri: npx tsx tests/merge.test.ts
import { emptyBase, merge3, toBase, toSynced } from '../src/lib/merge';
import { DEFAULT_SETTINGS, sanitizeState } from '../src/lib/store';
import type { AppState, MistakeEntry, Question } from '../src/types';

let fails = 0;
const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));
const eq = (name: string, a: unknown, b: unknown) => {
  const ok = stable(a) === stable(b);
  if (!ok) fails++;
  console.log(ok ? '✓' : '✗', name, ok ? '' : `→ ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
};
const st = (p: Partial<AppState>) => toSynced(sanitizeState(p));
const q = { id: 'q' } as Question;
const mk = (id: string, last: number, count = 1): MistakeEntry => ({ questionId: id, question: q, userAnswer: 'x', count, last, fixedStreak: 0 });
const wp = (box: number, seen: number, correct: number, wrong: number, last: number) => ({ box, due: last, seen, correct, wrong, last });

// 1) sayaçlar: base üzerine iki cihazın artışları toplanır
const B0 = st({ words: { a: wp(1, 2, 1, 1, 10) }, daily: { d: { cards: 5, questions: 0, correct: 3 } } });
const L1 = st({ words: { a: wp(2, 4, 3, 1, 20) }, daily: { d: { cards: 7, questions: 0, correct: 5 } } });
const R1 = st({ words: { a: wp(1, 3, 1, 2, 30) }, daily: { d: { cards: 8, questions: 0, correct: 3 } } });
const M1 = merge3(L1, R1, toBase(B0));
eq('kelime sayaçları toplanır', [M1.words.a.seen, M1.words.a.correct, M1.words.a.wrong], [5, 3, 2]);
eq('kutu en yeni güncellemeden', M1.words.a.box, 1);
eq('günlük kartlar toplanır', M1.daily.d.cards, 10);

// 2) ilk eşitleme (base yok): her iki cihazın verisi birleşir, varsayılan ayarlar buluttakini ezmez
const L2 = st({ words: { x: wp(1, 1, 1, 0, 5) }, settings: { ...DEFAULT_SETTINGS } });
const R2 = st({ words: { y: wp(2, 3, 3, 0, 6) }, settings: { ...DEFAULT_SETTINGS, apiKey: 'KEY', dailyGoal: 50 } });
const M2 = merge3(L2, R2, emptyBase());
eq('yeni cihaz: iki tarafın kelimeleri', Object.keys(M2.words).sort(), ['x', 'y']);
eq('yeni cihaz: bulut ayarları korunur', [M2.settings.apiKey, M2.settings.dailyGoal], ['KEY', 50]);

// 3) ayar değişikliği: yerelde değişen kazanır, değişmeyen buluttan gelir
const B3 = st({ settings: { ...DEFAULT_SETTINGS } });
const M3 = merge3(st({ settings: { ...DEFAULT_SETTINGS, theme: 'dark' } }), st({ settings: { ...DEFAULT_SETTINGS, dailyGoal: 80 } }), toBase(B3));
eq('ayarlar alan bazında birleşir', [M3.settings.theme, M3.settings.dailyGoal], ['dark', 80]);

// 4) silme yayılımı: hata defteri, yer imi
const B4 = st({ mistakes: [mk('m1', 10), mk('m2', 10)], bookmarks: ['w1', 'w2'] });
const L4 = st({ mistakes: [mk('m2', 10)], bookmarks: ['w2', 'w3'] }); // m1 ve w1 yerelde silindi, w3 eklendi
const R4 = st({ mistakes: [mk('m1', 10), mk('m2', 10), mk('m3', 15)], bookmarks: ['w1', 'w2'] });
const M4 = merge3(L4, R4, toBase(B4));
eq('silinen hata geri gelmez, yeni hata eklenir', M4.mistakes.map((m) => m.questionId).sort(), ['m2', 'm3']);
eq('yer imleri üç yönlü', M4.bookmarks.sort(), ['w2', 'w3']);

// 5) silinen ama diğer cihazda yeniden yanlış yapılan hata korunur
const L5 = st({ mistakes: [] });
const R5 = st({ mistakes: [mk('m1', 99, 2)] });
const M5 = merge3(L5, R5, toBase(st({ mistakes: [mk('m1', 10)] })));
eq('yeniden yanlış yapılan hata korunur', M5.mistakes.map((m) => m.questionId), ['m1']);

// 6) değişmeyen bulut → sonuç yerel ile aynı (idempotent)
const L6 = st({ words: { a: wp(3, 9, 7, 2, 50) }, bookmarks: ['k'] });
const B6 = toBase(st({ words: { a: wp(2, 5, 4, 1, 40) }, bookmarks: [] }));
const R6 = st({ words: { a: wp(2, 5, 4, 1, 40) }, bookmarks: [] });
eq('bulut değişmediyse yerel aynen kalır', merge3(L6, R6, B6).words, L6.words);

console.log(fails ? `\n${fails} HATA` : '\nTüm birleştirme testleri geçti ✓');
process.exit(fails ? 1 : 0);
