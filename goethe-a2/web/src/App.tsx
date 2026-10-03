import { useEffect, type ReactNode } from 'react';
import { Icon, ToastHost } from './components/ui';
import { goBackRoute, navigate, TAB_ROUTES, useRoute, type RouteName } from './lib/nav';
import { useStore } from './lib/store';
import Cards from './screens/Cards';
import Exam from './screens/Exam';
import History from './screens/History';
import Home from './screens/Home';
import Mistakes from './screens/Mistakes';
import More from './screens/More';
import Settings from './screens/Settings';
import Words from './screens/Words';
import Worksheet from './screens/Worksheet';
import Writing from './screens/Writing';

const TITLES: Record<RouteName, string> = {
  home: 'Goethe A2',
  words: 'Kelime Müfredatı',
  cards: 'Kelime Kartları',
  exam: 'Sınav & Test',
  more: 'Diğer',
  writing: 'Yazma (Schreiben)',
  worksheet: 'Çalışma Kağıdı',
  mistakes: 'Hata Defteri',
  settings: 'Ayarlar',
  history: 'Sınav Geçmişi',
};

const TABS: { name: RouteName; label: string; icon: string }[] = [
  { name: 'home', label: 'Ana Sayfa', icon: 'home' },
  { name: 'words', label: 'Kelimeler', icon: 'book' },
  { name: 'cards', label: 'Kartlar', icon: 'layers' },
  { name: 'exam', label: 'Sınav', icon: 'exam' },
  { name: 'more', label: 'Diğer', icon: 'grid' },
];

function useThemeClass() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.body.classList.toggle('dark', dark);
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [theme]);
}

export default function App() {
  useThemeClass();
  const route = useRoute();
  const isTab = TAB_ROUTES.includes(route.name);

  let screen: ReactNode;
  switch (route.name) {
    case 'words':
      screen = <Words />;
      break;
    case 'cards':
      screen = <Cards />;
      break;
    case 'exam':
      screen = <Exam key={String(route.params?.mode || '')} initialMode={route.params?.mode as string | undefined} />;
      break;
    case 'more':
      screen = <More />;
      break;
    case 'writing':
      screen = <Writing />;
      break;
    case 'worksheet':
      screen = <Worksheet />;
      break;
    case 'mistakes':
      screen = <Mistakes />;
      break;
    case 'settings':
      screen = <Settings />;
      break;
    case 'history':
      screen = <History />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <div id="app-shell" className="flex h-full flex-col">
      <header className="no-print z-20 flex items-center gap-1 bg-brand-700 px-2 py-2.5 text-white shadow-md dark:bg-slate-900">
        {!isTab ? (
          <button onClick={() => goBackRoute()} className="rounded-full p-2 hover:bg-white/10" aria-label="Geri">
            <Icon name="left" size={22} />
          </button>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-serif text-sm font-black tracking-tight">A2</span>
        )}
        <h1 className="ml-1 flex-1 truncate text-lg font-bold">{TITLES[route.name]}</h1>
        {route.name !== 'settings' && (
          <button onClick={() => navigate('settings')} className="rounded-full p-2 hover:bg-white/10" aria-label="Ayarlar">
            <Icon name="settings" size={20} />
          </button>
        )}
      </header>

      <main id="app-main" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-4">{screen}</div>
      </main>

      {isTab && (
        <nav className="no-print safe-bottom z-20 border-t border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-2xl">
            {TABS.map((t) => {
              const active = route.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => navigate(t.name)}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                    active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400'
                  }`}
                >
                  <span className={`rounded-full px-4 py-1 transition ${active ? 'bg-brand-100 dark:bg-slate-800' : ''}`}>
                    <Icon name={t.icon} size={21} />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
      <ToastHost />
    </div>
  );
}
