import { addDays, dateKey, parseDate } from "./dates";
import type { Plan } from "./validation";
const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
// RFC 5545 folds at 75 octets, without splitting a UTF-8 character.
function fold(line: string): string {
  let result = "", bytes = 0;
  for (const char of line) {
    const length = new TextEncoder().encode(char).length;
    if (bytes + length > 75) { result += "\r\n "; bytes = 1; }
    result += char; bytes += length;
  }
  return result;
}
export function makeICS(plan: Plan, uid: string, now = new Date()): string {
  const date = parseDate(plan.date);
  if (!date) throw new Error("Invalid date");
  const description = ["i'll take care of the rest. ♡", plan.vibe && `vibe: ${plan.vibe}`, plan.time && `time: ${plan.time}`, plan.note].filter(Boolean).join("\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Erfan//Ask-for-a-date//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${uid.replace(/[^a-zA-Z0-9-]/g, "")}@ask-for-a-date`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;VALUE=DATE:${plan.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${dateKey(addDays(date, 1)).replace(/-/g, "")}`,
    "SUMMARY:date with erfan ♡", `DESCRIPTION:${escapeText(description)}`, "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR", ""].map(fold).join("\r\n");
}
