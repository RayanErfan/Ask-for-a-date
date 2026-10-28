import { dateInRange, todayAtOffset, parseDate } from "./dates";
export const vibes = ["coffee + a long walk", "food + somewhere pretty", "surprise me"] as const;
export const times = ["afternoon", "sunset", "night"] as const;
export type Vibe = typeof vibes[number];
export type DateTime = typeof times[number];
export type Plan = { date: string; vibe?: Vibe; time?: DateTime; note?: string };
export type Report = { event: "visit"; requestId: string; device: "mobile" | "tablet" | "desktop"; browser: "Chrome" | "Safari" | "Firefox" | "Edge" | "other"; os: "iOS" | "Android" | "macOS" | "Windows" | "other" } | ({ event: "final"; requestId: string; timezoneOffset: number } & Plan);
export function cleanNote(value: string): string {
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "").trim();
}
export function validPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  return Object.keys(p).every(k => ["date", "vibe", "time", "note"].includes(k)) &&
    typeof p.date === "string" && !!parseDate(p.date) &&
    (p.vibe === undefined || vibes.includes(p.vibe as Vibe)) &&
    (p.time === undefined || times.includes(p.time as DateTime)) &&
    (p.note === undefined || typeof p.note === "string" && p.note.length <= 250);
}
export function validateReport(value: unknown, now = new Date()): Report | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (typeof p.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.requestId)) return null;
  if (p.event === "visit") {
    if (!Object.keys(p).every(k => ["event", "requestId", "device", "browser", "os"].includes(k)) ||
      !["mobile", "tablet", "desktop"].includes(String(p.device)) || !["Chrome", "Safari", "Firefox", "Edge", "other"].includes(String(p.browser)) ||
      !["iOS", "Android", "macOS", "Windows", "other"].includes(String(p.os))) return null;
    return p as Report;
  }
  if (p.event !== "final") return null;
  const { event, requestId, timezoneOffset, ...plan } = p;
  if (!validPlan(plan) || typeof timezoneOffset !== "number" || !Number.isInteger(timezoneOffset) || timezoneOffset < -840 || timezoneOffset > 720 ||
    !dateInRange(plan.date, todayAtOffset(timezoneOffset, now))) return null;
  return { event, requestId, timezoneOffset, ...plan, ...(plan.note !== undefined ? { note: cleanNote(plan.note) } : {}) } as Report;
}
