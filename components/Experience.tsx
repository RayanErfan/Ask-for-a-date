"use client";
import { useEffect, useRef, useState } from "react";
import { Cat } from "./Cat";
import { LoveLetter } from "./LoveLetter";
import { DateCalendar } from "./DateCalendar";
import { DatePreferences } from "./DatePreferences";
import { FinalCard } from "./FinalCard";
import { Doodle } from "./Doodle";
import { dateInRange, dateKey, formatDate } from "@/lib/dates";
import { RECIPIENT, RECIPIENT_UPPER } from "@/lib/recipient";
import { cleanNote, validPlan, type Plan } from "@/lib/validation";
import { reportFinal, reportVisit } from "@/lib/report-client";
const storageKey = "ask-for-a-date-v1";
export function Experience({ catAvailable }: { catAvailable: boolean }) {
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<"opening" | "letter" | "final">("opening");
  const [today, setToday] = useState(() => new Date());
  const [plan, setPlan] = useState<Plan>({ date: "" });
  const [id, setId] = useState("");
  const [reaction, setReaction] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [saved, setSaved] = useState(true);
  const locked = useRef(false);
  const letterHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setToday(new Date());
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.version === 1 && validPlan(stored.plan) && typeof stored.id === "string" && /^[a-z0-9-]{36}$/i.test(stored.id)) {
          setPlan(stored.plan); setId(stored.id); setStage("final");
        }
      }
    } catch { /* Storage may be unavailable in private browsers. */ }
    setReady(true);
    function visitWhenVisible() { if (document.visibilityState === "visible") reportVisit(); }
    visitWhenVisible(); document.addEventListener("visibilitychange", visitWhenVisible);
    const refreshDay = () => setToday(new Date());
    const timer = setInterval(refreshDay, 60_000); window.addEventListener("focus", refreshDay);
    return () => { clearInterval(timer); window.removeEventListener("focus", refreshDay); document.removeEventListener("visibilitychange", visitWhenVisible); };
  }, []);
  function open() {
    setStage("letter");
    requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: "instant" }); letterHeading.current?.focus({ preventScroll: true }); });
  }
  async function seal(event: React.FormEvent) {
    event.preventDefault(); if (locked.current) return;
    if (!dateInRange(plan.date, new Date())) { setDateError(true); setToday(new Date()); return; }
    locked.current = true; setBusy(true);
    const finalPlan = { ...plan, note: cleanNote(plan.note || "") || undefined };
    const requestId = crypto.randomUUID(); setId(requestId); setPlan(finalPlan);
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, id: requestId, plan: finalPlan })); setSaved(true); } catch { setSaved(false); }
    await reportFinal(finalPlan, requestId);
    setStage("final"); setBusy(false); locked.current = false;
  }
  function change() {
    setToday(new Date());
    if (!dateInRange(plan.date, new Date())) setPlan({ ...plan, date: "" });
    open();
  }
  function reset() {
    try { localStorage.removeItem(storageKey); } catch { /* no storage */ }
    setPlan({ date: "" }); setId(""); setSaved(true); setStage("opening");
  }
  if (!ready) return <main className="loading-paper" aria-label="Opening your little note" />;
  return <main className={`experience stage-${stage}`}>
    {stage === "opening" && <section className="opening">
      <div className="opening-object"><span className="psst handwritten">psst... {RECIPIENT}</span><Cat available={catAvailable} /><span className="opening-caption handwritten">yes, you.</span></div>
      <h1>i made you<br /><em>something.</em></h1>
      <button className="primary open-button" onClick={open}>open it <span aria-hidden="true">♡</span></button>
      <p className="opening-footnote">a little note from erfan</p>
      <span className="corner-mark" aria-hidden="true">p. 01 / just for you</span>
    </section>}
    {stage === "letter" && <div className="letter-moment unfold">
      <div className="page-inscription"><span>A LITTLE NOTE FOR {RECIPIENT_UPPER}</span><Doodle /></div>
      <h1 className="sr-only" ref={letterHeading} tabIndex={-1}>a little note for you</h1>
      <LoveLetter />
      <section className="date-section" aria-labelledby="question">
        <div className="question-row"><h2 id="question">when can i steal you<br />for a <em>little date?</em> <span className="rose">♡</span></h2><Cat available={catAvailable} reaction={reaction} small /></div>
        <p className="date-instruction">you pick the day. i&apos;ll make the plans.</p>
        <form onSubmit={seal}>
          <fieldset disabled={busy} className="plan-fields">
            <legend className="sr-only">Our date plan</legend>
            <DateCalendar key={dateKey(today)} today={today} value={plan.date} onChange={date => { setPlan({ ...plan, date }); setReaction(r => r + 1); setDateError(false); }} />
            <div className="picked-date" aria-live="polite" aria-atomic="true">{plan.date ? <div key={plan.date} className="picked-content"><span className="picked-label">you picked</span><span className="picked-weekday">{formatDate(plan.date, { weekday: "long" })}</span><strong>{formatDate(plan.date, { day: "numeric", month: "long" })}</strong><span className="handwritten">okay wait... that&apos;s actually perfect ♡</span></div> : <p className="handwritten waiting">any day with you is a good day.</p>}</div>
            {plan.date && <><DatePreferences plan={plan} onChange={setPlan} /><div className="seal-area"><button className="primary seal-button" type="submit" disabled={busy}>{busy ? "sealing our little plan..." : "seal the date"}<Doodle /></button><p>just you + me. finally.</p></div></>}
          </fieldset>
          {dateError && <p className="date-error" role="alert">a new day snuck up on us — pick a day from today onward.</p>}
        </form>
      </section>
      <div className="letter-bottom"><Doodle kind="paw" /><span className="handwritten">patiently waiting for my favourite person.</span></div>
    </div>}
    {stage === "final" && <><FinalCard plan={plan} id={id} available={catAvailable} onChange={change} onReset={reset} />{!saved && <p className="storage-note">save our date above to keep a copy on this device.</p>}</>}
  </main>;
}
