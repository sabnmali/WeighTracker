import { useEffect, useState, type ReactNode } from 'react';
import { speak, speakable, ttsStatus, openTtsSettings, isNative } from '../lib/native';
import { useBackHandler } from '../lib/nav';
import { getState } from '../lib/store';

// ---------------------------------------------------------------- Icon
const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5',
  layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  exam: 'M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1zM8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 12l2.5 2.5L16 9',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  volume: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  x: 'M18 6 6 18M6 6l12 12',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  check: 'M20 6 9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  pen: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6z',
  printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  flame: 'M12 22c4.4 0 7-2.9 7-7 0-4-3-6.5-4-10-2 2-2.5 4-2.5 5.5C11 9 9.5 7 9.5 5 7 7.5 5 10.5 5 15c0 4.1 2.6 7 7 7z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22',
  copy: 'M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
  shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  history: 'M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  cloudoff: 'M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3M1 1l22 22',
  cloudcheck: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10zM9 14l2 2 4-4',
};

export function Icon({ name, size = 20, className = '', fill = false }: { name: string; size?: number; className?: string; fill?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name] || PATHS.info} />
    </svg>
  );
}

// ---------------------------------------------------------------- Button
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'success';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 dark:bg-brand-500 dark:hover:bg-brand-400',
  secondary:
    'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50 dark:bg-slate-800 dark:text-brand-100 dark:border-slate-700 dark:hover:bg-slate-700',
  ghost: 'text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  gold: 'bg-gold-500 text-white hover:bg-gold-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  icon,
  small,
  type = 'button',
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  icon?: string;
  small?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
        small ? 'px-3 py-1.5 text-sm' : 'px-4 py-3 text-[15px]'
      } ${VARIANTS[variant]} ${className}`}
    >
      {icon && <Icon name={icon} size={small ? 16 : 18} />}
      {children}
    </button>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 ${className}`;
  if (onClick)
    return (
      <button onClick={onClick} className={`${cls} block w-full text-left transition active:scale-[0.99]`}>
        {children}
      </button>
    );
  return <div className={cls}>{children}</div>;
}

export function Chip({
  children,
  active,
  onClick,
  className = '',
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-700 text-white dark:bg-brand-500'
          : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'slate', className = '' }: { children: ReactNode; tone?: string; className?: string }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    red: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    gold: 'bg-gold-100 text-gold-700 dark:bg-amber-900/40 dark:text-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone] || tones.slate} ${className}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, className = '', tone = 'brand' }: { value: number; className?: string; tone?: string }) {
  const color =
    tone === 'green' ? 'bg-emerald-500' : tone === 'red' ? 'bg-rose-500' : tone === 'gold' ? 'bg-gold-500' : 'bg-brand-600 dark:bg-brand-400';
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition ${
            o.value === value ? 'bg-white text-brand-800 shadow dark:bg-slate-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function Empty({ icon = 'info', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="rounded-full bg-brand-50 p-4 text-brand-600 dark:bg-slate-800 dark:text-brand-300">
        <Icon name={icon} size={28} />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- Sheet (modal)
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  full,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  full?: boolean;
}) {
  useBackHandler(open, () => {
    onClose();
    return true;
  });
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-sheet flex w-full max-w-lg flex-col rounded-t-3xl bg-paper shadow-2xl dark:bg-slate-900 sm:rounded-3xl ${
          full ? 'h-[94vh]' : 'max-h-[90vh]'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/10">
          <div className="min-w-0 flex-1 text-lg font-bold text-brand-800 dark:text-white">{title}</div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-black/5" aria-label="Kapat">
            <Icon name="x" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="safe-bottom border-t border-black/5 px-4 py-3 dark:border-white/10">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  text,
  confirmLabel = 'Evet',
  cancelLabel = 'Vazgeç',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useBackHandler(open, () => {
    onCancel();
    return true;
  });
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="animate-pop w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <p className="text-lg font-bold text-slate-900 dark:text-white">{title}</p>
        {text && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{text}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Toast
let pushToast: ((msg: string) => void) | null = null;
export function toast(msg: string) {
  pushToast?.(msg);
}

export function ToastHost() {
  const [msgs, setMsgs] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    pushToast = (msg) => {
      const id = Date.now() + Math.random();
      setMsgs((m) => [...m, { id, msg }]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 2800);
    };
    return () => {
      pushToast = null;
    };
  }, []);
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4">
      {msgs.map((m) => (
        <div key={m.id} className="animate-pop max-w-sm rounded-xl bg-slate-900/90 px-4 py-2.5 text-center text-sm text-white shadow-lg">
          {m.msg}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Seslendirme
export function sayGerman(text: string) {
  const status = ttsStatus();
  if (isNative && (status === 'missing_data' || status === 'not_supported')) {
    toast('Almanca ses paketi eksik. Ayarlar → Seslendirme bölümünden yükleyebilirsiniz.');
    openTtsSettings();
    return;
  }
  const r = speak(speakable(text), getState().settings.ttsRate);
  if (r === 'missing') toast('Bu cihazda seslendirme desteklenmiyor.');
}

export function SpeakButton({ text, className = '', size = 18 }: { text: string; className?: string; size?: number }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        sayGerman(text);
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full p-2 text-brand-600 hover:bg-brand-50 active:scale-90 dark:text-brand-300 dark:hover:bg-slate-800 ${className}`}
      aria-label="Sesli oku"
    >
      <Icon name="volume" size={size} />
    </button>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</h2>
      {action}
    </div>
  );
}

export function StatTile({ label, value, sub, icon, tone = 'brand' }: { label: string; value: ReactNode; sub?: string; icon: string; tone?: string }) {
  const tones: Record<string, string> = {
    brand: 'text-brand-600 bg-brand-50 dark:bg-slate-800 dark:text-brand-300',
    gold: 'text-gold-700 bg-gold-100 dark:bg-slate-800 dark:text-amber-300',
    green: 'text-emerald-700 bg-emerald-50 dark:bg-slate-800 dark:text-emerald-300',
    red: 'text-rose-700 bg-rose-50 dark:bg-slate-800 dark:text-rose-300',
  };
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${tones[tone]}`}>
          <Icon name={icon} size={16} />
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </Card>
  );
}
