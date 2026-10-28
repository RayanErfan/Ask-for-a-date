import test from 'node:test';
import assert from 'node:assert/strict';
import { issueTicket, verifyTicket, limit, claimReport } from '../lib/report-security';
import { sendTelegram, telegramMessage } from '../lib/telegram';
import type { Report } from '../lib/validation';
const report: Report = { event: 'final', requestId: 'efaeef99-7ccb-4a62-a477-87929667394b', date: '2026-10-17', timezoneOffset: 0, note: '<b>just us</b>' };
test('signed page tickets reject tampering and in-process deduplication is atomic', () => {
  const ticket = issueTicket();
  assert.equal(verifyTicket(ticket.ticket), ticket.pageId);
  assert.equal(verifyTicket(ticket.ticket + 'x'), null);
  assert.equal(verifyTicket('invalid'), null);
  const key = crypto.randomUUID();
  assert.equal(claimReport(key), true); assert.equal(claimReport(key), false);
  assert.equal(limit(key, 1), true); assert.equal(limit(key, 1), false);
});
test('Telegram formatting omits unchosen options and uses actual weekdays', () => {
  const message = telegramMessage(report);
  assert.ok(message.includes('Saturday, 17 October 2026'));
  assert.ok(!message.includes('vibe:')); assert.ok(!message.includes('time:'));
});
test('Telegram retries only explicit brief throttles; never leaks fetch error URLs', async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChat = process.env.TELEGRAM_CHAT_ID;
  // Deliberately invalid test-only values; fetch is mocked before use.
  process.env.TELEGRAM_BOT_TOKEN = 'test-only'; process.env.TELEGRAM_CHAT_ID = 'test-only';
  const logs: string[] = []; console.error = (...args) => logs.push(JSON.stringify(args));
  let calls = 0;
  try {
    globalThis.fetch = async (_input, init) => {
      calls++;
      const body = JSON.parse(String(init?.body));
      assert.equal(body.parse_mode, undefined);
      assert.equal(body.link_preview_options.is_disabled, true);
      return calls === 1 ? Response.json({ ok: false, error_code: 429, parameters: { retry_after: 0 } }, { status: 429 }) : Response.json({ ok: true });
    };
    await sendTelegram(report); assert.equal(calls, 2);
    calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error('https://secret-token.example/'); };
    await sendTelegram(report); assert.equal(calls, 1);
    assert.ok(!logs.join('').includes('secret-token'));
    calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({ ok: false }, { status: 500 }); };
    await sendTelegram(report); assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch; console.error = originalError;
    if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = originalToken;
    if (originalChat === undefined) delete process.env.TELEGRAM_CHAT_ID; else process.env.TELEGRAM_CHAT_ID = originalChat;
  }
});
