import "server-only";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
const localSecret = randomBytes(32).toString("hex");
const secret = () => process.env.TELEGRAM_BOT_TOKEN || localSecret;
const sign = (text: string) => createHmac("sha256", secret()).update(text).digest("base64url");
export function issueTicket() {
  const pageId = randomUUID();
  const payload = `${pageId}.${Date.now()}`;
  return { pageId, ticket: `${payload}.${sign(payload)}` };
}
export function verifyTicket(value: string | null): string | null {
  if (!value || value.length > 180) return null;
  const [id, timestamp, signature, extra] = value.split(".");
  if (extra || !id || !timestamp || !signature || !/^\d{13}$/.test(timestamp)) return null;
  const age = Date.now() - Number(timestamp);
  if (age < 0 || age > 86_400_000) return null;
  const expected = Buffer.from(sign(`${id}.${timestamp}`));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? id : null;
}
type Bucket = { count: number; expires: number };
const buckets = new Map<string, Bucket>();
const seen = new Map<string, number>();
function prune<T extends { expires: number }>(map: Map<string, T>) {
  const now = Date.now();
  for (const [key, entry] of map) if (entry.expires <= now) map.delete(key);
}
export function limit(key: string, maximum: number, window = 60_000): boolean {
  prune(buckets);
  const entry = buckets.get(key);
  if (entry) { entry.count++; return entry.count <= maximum; }
  if (buckets.size >= 10_000) return false;
  buckets.set(key, { count: 1, expires: Date.now() + window });
  return true;
}
export function callerKey(request: Request): string {
  // Only trust Vercel's overwritten forwarding header in that environment.
  // Other hosts share a conservative bucket unless adapted to their trusted proxy.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
  return sign(`rate:${ip}`); // Ephemeral keyed digest; never persisted or logged.
}
export function claimReport(key: string): boolean {
  const now = Date.now();
  for (const [id, expires] of seen) if (expires <= now) seen.delete(id);
  if (seen.has(key) || seen.size >= 10_000) return false;
  seen.set(key, now + 86_400_000);
  return true;
}
