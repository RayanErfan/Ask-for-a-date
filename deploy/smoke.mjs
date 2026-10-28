import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const origin = 'https://ask-for-a-date.lorqina.ir';
const redirect = await fetch('http://ask-for-a-date.lorqina.ir/', { redirect: 'manual' });
assert.equal(redirect.status, 301);
assert.equal(redirect.headers.get('location'), origin + '/');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const reports = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.url().endsWith('/api/report')) reports.push({ method: response.request().method(), status: response.status() });
  });
  await page.goto(origin);
  await expect(page.getByRole('button', { name: 'open it' })).toBeVisible();
  await expect.poll(() => page.locator('.cat-sticker img').evaluate(image => image.naturalWidth)).toBe(720);
  await page.screenshot({ path: 'test-results/live-opening.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Give the cat a little pat' }).click();
  await expect.poll(() => page.locator('.cat-video').evaluate(video => video.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'open it' }).click();
  await page.locator('[aria-current="date"]').click();
  await page.getByRole('button', { name: 'surprise me', exact: false }).click();
  await page.getByRole('button', { name: 'sunset', exact: true }).click();
  await page.getByRole('button', { name: 'seal the date' }).click();
  await expect(page.getByRole('heading', { name: "okay. it's a date." })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'save our date' }).click();
  assert.match((await download).suggestedFilename(), /^our-date-\d{4}-\d{2}-\d{2}\.ics$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: "okay. it's a date." })).toBeVisible();
  await page.screenshot({ path: 'test-results/live-final.png', fullPage: true, animations: 'disabled' });
  await expect.poll(() => reports.filter(r => r.method === 'POST').length).toBe(3);
  assert.ok(reports.every(r => r.status === 200));
  assert.deepEqual(errors, []);
  const denied = await fetch(origin + '/api/report', {
    method: 'POST', headers: { Origin: 'https://other.example', 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(denied.status, 403);
  console.log(JSON.stringify({ https: 'valid', redirect: 'passed', catPlayback: 'passed', finalCard: 'passed', calendarDownload: 'passed', restoredPlan: 'passed', reportStatuses: reports, crossOrigin: 'blocked', browserErrors: errors }));
} finally { await browser.close(); }
