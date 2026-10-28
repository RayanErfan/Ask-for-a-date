"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { addDays, addMonths, dateKey, formatDate, parseDate } from "@/lib/dates";
import { Doodle } from "./Doodle";
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function DateCalendar({ value, today, onChange }: { value: string; today: Date; onChange: (date: string) => void }) {
  const min = dateKey(today), max = dateKey(addDays(today, 90));
  const initial = value && value >= min && value <= max ? value : min;
  const [month, setMonth] = useState(() => { const d = parseDate(initial)!; return new Date(d.getFullYear(), d.getMonth(), 1, 12); });
  const [focused, setFocused] = useState(initial);
  const calendar = useRef<HTMLDivElement>(null);
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const clamp = (d: Date) => parseDate(dateKey(d) < min ? min : dateKey(d) > max ? max : dateKey(d))!;
  function moveFocus(d: Date) {
    const target = clamp(d), key = dateKey(target);
    setMonth(new Date(target.getFullYear(), target.getMonth(), 1, 12)); setFocused(key);
    requestAnimationFrame(() => calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus());
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    let target: Date | undefined;
    const movement: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    if (event.key in movement) target = addDays(date, movement[event.key]);
    if (event.key === "Home") target = addDays(date, -((date.getDay() + 6) % 7));
    if (event.key === "End") target = addDays(date, 6 - ((date.getDay() + 6) % 7));
    if (event.key === "PageUp") target = addMonths(date, -1);
    if (event.key === "PageDown") target = addMonths(date, 1);
    if (target) { event.preventDefault(); moveFocus(target); }
  }
  function changeMonth(step: number) {
    const target = clamp(new Date(month.getFullYear(), month.getMonth() + step, 1, 12));
    setMonth(new Date(target.getFullYear(), target.getMonth(), 1, 12)); setFocused(dateKey(target));
  }
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1;
    return n < 1 || n > days ? null : new Date(month.getFullYear(), month.getMonth(), n, 12);
  });
  return <div className="calendar-wrap">
    <span className="calendar-note handwritten">important!! <span aria-hidden="true">↴</span></span>
    <div className="calendar" ref={calendar}>
      <span className="binding binding-left" aria-hidden="true" /><span className="binding binding-right" aria-hidden="true" />
      <div className="calendar-heading">
        <button type="button" className="calendar-nav previous" aria-label="Previous month" disabled={dateKey(month).slice(0, 7) <= min.slice(0, 7)} onClick={() => changeMonth(-1)}><Doodle kind="arrow" /></button>
        <h3 id="calendar-month" aria-live="polite">{formatDate(dateKey(month), { month: "long" })}<span>{month.getFullYear()}</span></h3>
        <button type="button" className="calendar-nav" aria-label="Next month" disabled={dateKey(month).slice(0, 7) >= max.slice(0, 7)} onClick={() => changeMonth(1)}><Doodle kind="arrow" /></button>
      </div>
      <div role="grid" aria-labelledby="calendar-month" aria-describedby="calendar-help" className="calendar-grid">
        <div role="row" className="calendar-row week-labels">{weekdays.map(day => <span role="columnheader" key={day}>{day}</span>)}</div>
        {Array.from({ length: cells.length / 7 }, (_, row) => <div className="calendar-row" role="row" key={row}>{cells.slice(row * 7, row * 7 + 7).map((date, col) => {
          if (!date) return <span role="gridcell" key={`blank-${col}`} />;
          const key = dateKey(date), disabled = key < min || key > max, selected = key === value;
          return <div role="gridcell" aria-selected={selected} key={key}><button type="button" className={`day ${col > 4 ? "weekend" : ""} ${selected ? "selected" : ""}`}
            data-date={key} disabled={disabled} tabIndex={!disabled && key === focused ? 0 : -1}
            aria-label={formatDate(key, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            aria-pressed={selected} aria-current={key === min ? "date" : undefined}
            onFocus={() => setFocused(key)} onKeyDown={e => keyDown(e, date)} onClick={() => onChange(key)}>
            {date.getDate()}{selected && <svg viewBox="0 0 50 50" className="date-circle" aria-hidden="true"><path d="M37 6C18-2 2 14 5 29c2 18 30 21 39 6C53 20 38 1 23 5" /></svg>}
          </button></div>;
        })}</div>)}
      </div>
      <div className="calendar-bottom"><span><i /> today</span><span>a little time, just us.</span></div>
    </div>
    <p className="sr-only" id="calendar-help">Choose a day from today through the next 90 days. Use arrow keys to move, Home and End for the week, Page Up and Page Down for months, and Enter to select.</p>
  </div>;
}
