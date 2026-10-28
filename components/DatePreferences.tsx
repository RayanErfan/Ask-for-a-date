import { times, vibes, type Plan } from "@/lib/validation";
export function DatePreferences({ plan, onChange }: { plan: Plan; onChange: (plan: Plan) => void }) {
  return <div className="preferences unfold">
    <p className="handwritten serious">one more very serious question...</p>
    <fieldset><legend>what kind of date are we feeling?</legend>
      <p className="optional">pick one, or leave it to me.</p>
      <div className="tickets">{vibes.map((vibe, i) => <button type="button" className={`ticket ticket-${i} ${plan.vibe === vibe ? "chosen" : ""}`} key={vibe} aria-pressed={plan.vibe === vibe}
        onClick={() => onChange({ ...plan, vibe: plan.vibe === vibe ? undefined : vibe })}>
        <span className="ticket-symbol" aria-hidden="true">{["☕", "🍜", "♡"][i]}</span><span>{vibe}</span><span className="ticket-check" aria-hidden="true">{plan.vibe === vibe ? "✓" : ""}</span>
      </button>)}</div>
    </fieldset>
    <fieldset className="time-field"><legend>and when should i steal you?</legend>
      <div className="time-options">{times.map(time => <button type="button" key={time} aria-pressed={plan.time === time} className={plan.time === time ? "chosen" : ""} onClick={() => onChange({ ...plan, time: plan.time === time ? undefined : time })}>{time}<span aria-hidden="true">{plan.time === time ? " ♡" : ""}</span></button>)}</div>
    </fieldset>
    <div className="tiny-note"><label htmlFor="note">anything you wanna tell me? <span>(optional)</span></label>
      <textarea id="note" maxLength={250} rows={3} placeholder="you can leave me a tiny note here..." value={plan.note || ""} onChange={e => onChange({ ...plan, note: e.target.value })} />
      <span className="note-count">{plan.note?.length || 0} / 250</span>
    </div>
  </div>;
}
