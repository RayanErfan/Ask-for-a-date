// Date-only strings stay date-only. Noon avoids DST midnight discontinuities.
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const result = new Date(y, m - 1, d, 12);
  return dateKey(result) === value ? result : null;
}
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}
export function addMonths(date: Date, amount: number): Date {
  const last = new Date(date.getFullYear(), date.getMonth() + amount + 1, 0, 12).getDate();
  return new Date(date.getFullYear(), date.getMonth() + amount, Math.min(date.getDate(), last), 12);
}
export function formatDate(value: string, options: Intl.DateTimeFormatOptions): string {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("en-GB", options).format(date) : "";
}
export function dateInRange(value: string, today: Date): boolean {
  return !!parseDate(value) && value >= dateKey(today) && value <= dateKey(addDays(today, 90));
}
export function todayAtOffset(offset: number, now = new Date()): Date {
  const local = new Date(now.getTime() - offset * 60_000);
  return new Date(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 12);
}
