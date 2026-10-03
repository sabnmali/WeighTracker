import { useEffect, useRef, useSyncExternalStore } from 'react';

export type RouteName =
  | 'home'
  | 'words'
  | 'cards'
  | 'exam'
  | 'more'
  | 'writing'
  | 'worksheet'
  | 'mistakes'
  | 'settings'
  | 'history';

export interface Route {
  name: RouteName;
  params?: Record<string, string | number | boolean | undefined>;
}

export const TAB_ROUTES: RouteName[] = ['home', 'words', 'cards', 'exam', 'more'];

let stack: Route[] = [{ name: 'home' }];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => stack[stack.length - 1],
  );
}

export function navigate(name: RouteName, params?: Route['params']) {
  if (TAB_ROUTES.includes(name)) {
    stack = name === 'home' ? [{ name, params }] : [{ name: 'home' }, { name, params }];
  } else {
    stack = [...stack, { name, params }];
  }
  emit();
  document.getElementById('app-main')?.scrollTo({ top: 0 });
}

export function goBackRoute(): boolean {
  if (stack.length > 1) {
    stack = stack.slice(0, -1);
    emit();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- geri tuşu yığını
type Handler = () => boolean;
const handlers: Handler[] = [];

/** Aktifken Android geri tuşunu yakalar (modal kapatma, sınavdan çıkış onayı vb.). */
export function useBackHandler(active: boolean, handler: Handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const h: Handler = () => ref.current();
    handlers.push(h);
    return () => {
      const i = handlers.lastIndexOf(h);
      if (i >= 0) handlers.splice(i, 1);
    };
  }, [active]);
}

export function handleBack(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true;
  }
  return goBackRoute();
}

if (typeof window !== 'undefined') {
  window.__handleBack = handleBack;
}
