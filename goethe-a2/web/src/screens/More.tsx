import { Card, Icon } from '../components/ui';
import { navigate, type RouteName } from '../lib/nav';
import { useStore } from '../lib/store';

export default function More() {
  const mistakes = useStore((s) => s.mistakes.length);
  const tests = useStore((s) => s.tests.length);
  const queue = useStore((s) => s.worksheetQueue.length);
  const items: { route: RouteName; icon: string; title: string; desc: string; tone: string }[] = [
    { route: 'writing', icon: 'pen', title: 'Yazma (Schreiben)', desc: 'Teil 1 SMS & Teil 2 E-Mail · AI puanlama', tone: 'text-emerald-600' },
    { route: 'worksheet', icon: 'file', title: 'Günlük Çalışma Kağıdı', desc: `Daktilo stili, A4 yazdırma${queue ? ` · ${queue} kelime bekliyor` : ''}`, tone: 'text-gold-700' },
    { route: 'mistakes', icon: 'alert', title: 'Hata Defteri', desc: `${mistakes} yanlış soru · hatalı kelimeler · kurallar`, tone: 'text-rose-600' },
    { route: 'history', icon: 'history', title: 'Sınav Geçmişi', desc: `${tests} sınav · puan gelişimi`, tone: 'text-brand-600' },
    { route: 'settings', icon: 'settings', title: 'Ayarlar & Yedekleme', desc: 'Gemini API, seslendirme, dışa/içe aktarma', tone: 'text-slate-600' },
  ];
  return (
    <div className="animate-pop space-y-2">
      {items.map((it) => (
        <Card key={it.route} onClick={() => navigate(it.route)} className="flex items-center gap-4 p-4">
          <span className={`rounded-xl bg-paper p-2.5 dark:bg-slate-800 ${it.tone}`}>
            <Icon name={it.icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{it.title}</p>
            <p className="text-sm text-slate-500">{it.desc}</p>
          </div>
          <Icon name="right" className="text-slate-300" />
        </Card>
      ))}
      <p className="px-2 pt-4 text-center text-xs leading-relaxed text-slate-400">
        Kelime listesi: Goethe-Zertifikat A2 Wortliste (Türkçe çevirili, 1.171 kelime + tematik gruplar). Uygulama tamamen çevrimdışı çalışır; yapay zeka
        özellikleri isteğe bağlıdır.
      </p>
    </div>
  );
}
