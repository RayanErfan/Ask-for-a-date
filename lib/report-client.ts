import type { Report, Plan } from "./validation";
type Ticket = { pageId: string; ticket: string };
let ticketPromise: Promise<Ticket> | undefined;
let visitStarted = false;
function ticket(): Promise<Ticket> {
  return ticketPromise ??= fetch("/api/report", { cache: "no-store", signal: AbortSignal.timeout(4000) }).then(async response => {
    if (!response.ok) throw new Error("unavailable");
    return response.json() as Promise<Ticket>;
  }).catch(error => { ticketPromise = undefined; throw error; });
}
async function post(report: Report, session: Ticket) {
  await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json", "x-page-ticket": session.ticket },
    body: JSON.stringify(report), keepalive: true, signal: AbortSignal.timeout(10_000) });
}
export function reportVisit() {
  if (visitStarted) return;
  visitStarted = true;
  void (async () => {
    const session = await ticket();
    const ua = navigator.userAgent;
    const ipad = /iPad/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    const device = ipad || /Tablet/.test(ua) || /Android/.test(ua) && !/Mobile/.test(ua) ? "tablet" : /Mobile|iPhone|Android/.test(ua) ? "mobile" : "desktop";
    const browser = /Edg/.test(ua) ? "Edge" : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Chrome|CriOS/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "other";
    const os = ipad || /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : "other";
    await post({ event: "visit", requestId: session.pageId, device, browser, os }, session);
  })().catch(() => {});
}
export async function reportFinal(plan: Plan, requestId: string) {
  try { await post({ event: "final", requestId, timezoneOffset: new Date().getTimezoneOffset(), ...plan }, await ticket()); } catch { /* The date card still belongs to her, even offline. */ }
}
