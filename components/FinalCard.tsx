import { useEffect, useRef } from "react";
import { formatDate } from "@/lib/dates";
import { makeICS } from "@/lib/ics";
import { PAIR } from "@/lib/recipient";
import type { Plan } from "@/lib/validation";
import { Cat } from "./Cat";
import { Doodle } from "./Doodle";
export function FinalCard({ plan, id, available, onChange, onReset }: { plan: Plan; id: string; available: boolean; onChange: () => void; onReset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  function download() {
    const url = URL.createObjectURL(new Blob([makeICS(plan, id)], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `our-date-${plan.date}.ics`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="final-moment unfold">
    <p className="eyebrow">a little yes, a very happy me.</p>
    <Cat available={available} reaction={1} />
    <h1 ref={heading} tabIndex={-1}>okay.<br />it&apos;s a date. <span className="rose">♡</span></h1>
    <p className="made-week">you just made my week.</p>
    <div className="date-card">
      <span className="card-tape" aria-hidden="true" />
      <div className="card-top"><span>{PAIR}</span><Doodle /></div>
      <p className="card-weekday">{formatDate(plan.date, { weekday: "long" })}</p>
      <p className="card-date">{formatDate(plan.date, { day: "numeric", month: "long" })}</p>
      <p className="card-year">{formatDate(plan.date, { year: "numeric" })}</p>
      {(plan.vibe || plan.time) && <div className="card-details">{plan.vibe && <span>{plan.vibe}</span>}{plan.time && <span>{plan.time}</span>}</div>}
      {plan.note && <p className="card-personal-note">“{plan.note}”</p>}
      <p className="handwritten card-caption">reserved for us.</p>
    </div>
    <p className="rest">i&apos;ll take care of the rest.</p>
    <button type="button" className="save-date" onClick={download}>save our date <Doodle kind="arrow" /></button>
    <div className="final-links"><button className="text-button" onClick={onChange}>change it</button><span aria-hidden="true">·</span><button className="text-button" onClick={onReset}>start over</button></div>
    <p className="keepsake handwritten">a tiny corner of the internet, just for you.</p>
  </section>;
}
