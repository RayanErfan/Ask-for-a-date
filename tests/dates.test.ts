import test from "node:test";
import assert from "node:assert/strict";
import { addDays, dateKey, parseDate, dateInRange, formatDate, todayAtOffset, addMonths } from "../lib/dates";
import { validateReport, cleanNote, validPlan } from "../lib/validation";
import { makeICS } from "../lib/ics";
const id = "efaeef99-7ccb-4a62-a477-87929667394b";
test("calendar rejects rollover dates and calculates real weekdays", () => {
  assert.equal(parseDate("2026-02-29"), null);
  assert.equal(parseDate("2026-13-01"), null);
  assert.equal(dateKey(parseDate("2028-02-29")!), "2028-02-29");
  assert.equal(formatDate("2026-10-17", { weekday: "long" }), "Saturday");
  assert.equal(dateKey(addMonths(parseDate("2026-01-31")!, 1)), "2026-02-28");
});
test("range includes today and exactly day 90, including year boundaries", () => {
  const today = parseDate("2026-11-29")!;
  assert.equal(dateInRange("2026-11-28", today), false);
  assert.equal(dateInRange("2026-11-29", today), true);
  assert.equal(dateInRange(dateKey(addDays(today, 90)), today), true);
  assert.equal(dateInRange(dateKey(addDays(today, 91)), today), false);
});
test("timezone validation uses browser's day on both sides of UTC", () => {
  const now = new Date("2026-09-24T01:00:00Z");
  assert.equal(dateKey(todayAtOffset(420, now)), "2026-09-23");
  assert.equal(dateKey(todayAtOffset(-840, new Date("2026-09-24T23:00:00Z"))), "2026-09-25");
  assert.ok(validateReport({ event: "final", requestId: id, date: "2026-09-23", timezoneOffset: 420 }, now));
  assert.equal(validateReport({ event: "final", requestId: id, date: "2026-09-23", timezoneOffset: 0 }, now), null);
});
test("strict schema rejects arbitrary relay fields, invalid enums, dates and long notes", () => {
  const visit = { event: "visit", requestId: id, device: "mobile", browser: "Chrome", os: "iOS" };
  assert.ok(validateReport(visit));
  for (const extra of [{ message: "hi" }, { chat_id: "other" }, { browser: "arbitrary" }, { requestId: "bad" }]) assert.equal(validateReport({ ...visit, ...extra }), null);
  assert.equal(validateReport({ event: "arbitrary", requestId: id }), null);
  const final = { event: "final", requestId: id, date: "2026-10-17", timezoneOffset: 0 };
  const now = new Date("2026-09-24T12:00:00Z");
  assert.ok(validateReport(final, now));
  for (const extra of [{ note: "x".repeat(251) }, { vibe: "random" }, { timezoneOffset: -9999 }, { date: "2026-09-01" }, { date: "2027-01-01" }, { token: "secret" }]) assert.equal(validateReport({ ...final, ...extra }, now), null);
  assert.equal(cleanNote(" \u202Ehello\u0000 "), "hello");
  assert.equal(validPlan({ date: "2026-10-17", injected: true }), false);
});
test("ICS preserves all-day date, escapes injection and folds UTF-8 correctly", () => {
  const ics = makeICS({ date: "2026-12-31", time: "sunset", note: "♡".repeat(80) + "\nEND:VEVENT;test,foo\\" }, id, new Date("2026-09-24T12:00:00Z"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101"));
  assert.ok(ics.includes("SUMMARY:date with erfan ♡"));
  assert.equal(ics.split("\r\nEND:VEVENT").length, 2);
  assert.ok(ics.replace(/\r\n /g, "").includes("\\nEND:VEVENT\\;test\\,foo\\\\"));
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
});
