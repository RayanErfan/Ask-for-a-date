import { NextResponse } from "next/server";
import { callerKey, claimReport, issueTicket, limit, verifyTicket } from "@/lib/report-security";
import { validateReport } from "@/lib/validation";
import { sendTelegram } from "@/lib/telegram";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;
const headers = { "Cache-Control": "no-store" };
const failure = (status: number) => NextResponse.json({ ok: false }, { status, headers });
export async function GET(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return failure(403);
  if (!limit(`ticket:${callerKey(request)}`, 30)) return failure(429);
  return NextResponse.json(issueTicket(), { headers });
}
async function readSmallBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") || 0) > 4096) throw new Error("size");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new Error("size"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function POST(request: Request) {
  // Next's request URL can use the bind address (0.0.0.0) locally.
  // Host is the browser's destination; arbitrary forwarding headers are not trusted.
  const protocol = process.env.VERCEL ? "https:" : new URL(request.url).protocol;
  // Self-hosting behind TLS termination pins the public origin explicitly.
  // A comma-separated list keeps the old host working while a rename moves.
  const expected = (process.env.APP_ORIGIN || `${protocol}//${request.headers.get("host")}`)
    .split(",").map(origin => origin.trim()).filter(Boolean);
  if (!expected.includes(request.headers.get("origin") || "")) return failure(403);
  if (request.headers.get("sec-fetch-site") === "cross-site") return failure(403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return failure(415);
  if (!limit(`post:${callerKey(request)}`, 24)) return failure(429);
  const pageId = verifyTicket(request.headers.get("x-page-ticket"));
  if (!pageId) return failure(403);
  let report;
  try { report = validateReport(await readSmallBody(request)); } catch { return failure(400); }
  if (!report) return failure(400);
  if (report.event === "visit" && report.requestId !== pageId) return failure(400);
  if (!claimReport(`${report.event}:${report.requestId}`)) return NextResponse.json({ ok: true }, { headers });
  if (!limit(`page:${pageId}:${report.event}`, report.event === "visit" ? 1 : 6, 86_400_000)) return failure(429);
  if (!limit("global:delivery", 60, 3_600_000)) return failure(429);
  await sendTelegram(report);
  // Delivery details stay on the server; choosing a date always feels successful.
  return NextResponse.json({ ok: true }, { headers });
}
