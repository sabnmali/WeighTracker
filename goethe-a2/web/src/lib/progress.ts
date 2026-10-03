import type { AppState } from '../types';
import { todayKey } from './util';

export function dayActivity(state: AppState, key: string): number {
  const d = state.daily[key];
  return d ? d.cards + d.questions : 0;
}

export function streak(state: AppState): number {
  let n = 0;
  const d = new Date();
  if (dayActivity(state, todayKey(d)) === 0) d.setDate(d.getDate() - 1);
  while (dayActivity(state, todayKey(d)) > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function lastDays(state: AppState, n: number): { key: string; label: string; value: number }[] {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = todayKey(d);
    out.push({ key, label: d.toLocaleDateString('tr-TR', { weekday: 'short' }).slice(0, 2), value: dayActivity(state, key) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export function avgScore(state: AppState, n = 5): number | null {
  const t = state.tests.slice(0, n);
  if (!t.length) return null;
  return Math.round(t.reduce((s, x) => s + x.percentage, 0) / t.length);
}
