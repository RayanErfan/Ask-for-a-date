import "server-only";
import { formatDate } from "./dates";
import type { Report } from "./validation";
export function telegramMessage(report: Report): string {
  if (report.event === "visit") {
    const stamp = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date());
    return `💌 Ask-for-a-date page opened\n\n🕒 ${stamp} UTC\n📱 ${report.device}\n🌐 ${report.browser} / ${report.os}`;
  }
  return ["💗 DATE SEALED", "", `📅 ${formatDate(report.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    report.vibe && `🎀 vibe: ${report.vibe}`, report.time && `🌇 time: ${report.time}`, report.note && `\n💌 note:\n${report.note}`].filter(line => line !== undefined).join("\n");
}
export async function sendTelegram(report: Report): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) { console.warn("[report] Telegram is not configured."); return; }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: telegramMessage(report), link_preview_options: { is_disabled: true } }),
        signal: AbortSignal.timeout(3500), cache: "no-store",
      });
      const result = await response.json() as { ok?: boolean; error_code?: number; parameters?: { retry_after?: number } };
      if (response.ok && result.ok) return;
      const delay = result.parameters?.retry_after;
      // A definite rejection is safe to retry. Timeouts/5xx may already have sent
      // the message; Telegram offers no idempotency key, so never retry those.
      if (attempt === 0 && result.error_code === 429 && typeof delay === "number" && delay >= 0 && delay <= 1) {
        await new Promise(resolve => setTimeout(resolve, delay * 1000)); continue;
      }
      console.error("[report] Telegram rejected a notification.", { status: response.status });
      return;
    } catch {
      // Never log the error object: fetch errors can contain the secret URL.
      console.error("[report] Telegram notification could not be delivered.");
      return;
    }
  }
}
