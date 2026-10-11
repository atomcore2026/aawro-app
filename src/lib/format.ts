/** Display helpers. Money from the API is in paise; dates are IST. */

export function money(paise?: number | null, opts: { decimals?: boolean } = {}): string {
  if (paise === null || paise === undefined) return '—';
  const r = paise / 100;
  const decimals = opts.decimals && r % 1 !== 0;
  return '₹' + r.toLocaleString('en-IN', { minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: decimals ? 2 : 0 });
}

export function rateLabel(rate: number, unit: 'HOUR' | 'DAY') {
  return `${money(rate)}${unit === 'DAY' ? '/day' : '/hr'}`;
}

export function unitLabel(unit: 'HOUR' | 'DAY') {
  return unit === 'DAY' ? 'per day' : 'per hour';
}

export function hourLabel(h: number, pad = true): string {
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${pad ? String(hh).padStart(2, '0') : hh}:00 ${h < 12 ? 'AM' : 'PM'}`;
}

/** Today's IST date key (YYYY-MM-DD). */
export function todayKey(): string {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

export function addDays(key: string, n: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayParts(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return { dow: DOW[d.getUTCDay()], dd: d.getUTCDate(), mon: MON[d.getUTCMonth()], weekday: d.getUTCDay() };
}

export function dateLabel(key?: string | null): string {
  if (!key) return '—';
  const p = dayParts(key);
  const t = todayKey();
  if (key === t) return `Today, ${p.dd} ${p.mon}`;
  if (key === addDays(t, 1)) return `Tomorrow, ${p.dd} ${p.mon}`;
  if (key === addDays(t, -1)) return `Yesterday, ${p.dd} ${p.mon}`;
  return `${p.dow}, ${p.dd} ${p.mon}`;
}

export function whenLabel(dateKey: string, startHour: number) {
  return `${dateLabel(dateKey)} · ${hourLabel(startHour, false)}`;
}

export function ago(iso?: string | Date | null): string {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / (7 * 86400))}w`;
}

export function agoLong(iso?: string | Date | null): string {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 2 * 86400) return 'yesterday';
  if (s < 30 * 86400) return `${Math.floor(s / 86400)} days ago`;
  return `${Math.floor(s / (30 * 86400))} months ago`;
}

export function timeOfDay(iso: string | Date): string {
  const d = new Date(new Date(iso).getTime() + 330 * 60_000);
  return hourMinute(d.getUTCHours(), d.getUTCMinutes());
}

function hourMinute(h: number, m: number) {
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function countdown(iso?: string | null): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function greeting(): string {
  const h = new Date(Date.now() + 330 * 60_000).getUTCHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function stars(n: number) {
  const r = Math.round(n);
  return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
}

export function initials(name?: string | null) {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const DURATION_LABEL: Record<string, string> = { '1': '1 hour', '2': '2 hours', '3': '3 hours', HALF: 'Half day', FULL: 'Full day' };
export const DURATION_HOURS: Record<string, number> = { '1': 1, '2': 2, '3': 3, HALF: 4, FULL: 8 };

/** Client-side estimate (server quote is authoritative). */
export function estimate(rate: number, unit: 'HOUR' | 'DAY', duration: string) {
  if (unit === 'HOUR') return rate * DURATION_HOURS[duration];
  return duration === 'HALF' ? Math.round(rate * 0.6) : rate;
}
