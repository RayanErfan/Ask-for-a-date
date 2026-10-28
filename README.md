# Ask-for-a-date

A small Next.js / React / TypeScript page that asks someone out: custom CSS, a keyboard-accessible calendar, a local keepsake, and server-only Telegram reporting. No UI kits, icon libraries, analytics, database, or external font requests.

## Personalise

The page addresses the reader as “you” by default, so it works for anyone. To put a name on it, change one line in `lib/recipient.ts`:

```ts
export const RECIPIENT = "Sara";
```

The uppercase inscription and the date card follow automatically. The rest of the copy is written for whoever opens it.

## Run

Use Node 22 or later.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. For production: `npm run build && npm start`.

## The original cat

The supplied cat is included. `public/cat.mp4` is the original 720 × 720, 7.5-second video, preserved byte-for-byte. `public/cat.png` is its first decoded frame, saved as PNG at the original resolution without retouching or rescaling. The sticker displays that frame and plays the original video once when tapped; it does not autoplay or loop. Reduced-motion mode keeps the still frame. The five-tap secret works in either mode.

Both assets are served locally without image optimization or external requests. To replace them, put your own cat at the same paths and rebuild.

## Telegram

In `.env.local`, set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Both are server-only. The example deliberately contains empty values. Never use a `NEXT_PUBLIC_` prefix. Revoke any token previously pasted into a conversation or committed to a repository, then use its replacement.

Start a conversation with your bot in Telegram first. Run the site, open a browser tab, and confirm the visit message arrives. Choose a date and seal it; confirm the final report arrives. Refresh to verify another visit arrives while the saved final plan remains. Double-clicking seal should send only one final report. Try blank credentials to check that missing reporting never blocks the keepsake. Server logs contain generic delivery failures, never tokens, notes, or Telegram response bodies.

Only `visit` and `final` events are accepted. Reports use plain Telegram text with link previews disabled: no Markdown/HTML interpolation. Notes are limited to 250 characters and stripped of control/bidi characters. Visit timestamps are labelled UTC; chosen dates are local calendar days. Only a broad device, browser, and OS family are reported. No raw user agent, location, persistent tracking ID, or IP is sent to Telegram. A fresh random page token is used only for request validation and deduplication.

## Vercel

1. Import this directory as a Next.js project. Keep the default build and output settings.
2. Set the two environment variables in project settings. The original cat assets are already included. Do not commit `.env.local`.
3. Add a Vercel Firewall rate-limit rule matching `/api/report`: start with 30 requests per IP per minute. Use your own access protection if the link must be authenticated; `noindex` and an unlisted URL are not authentication.
4. Deploy, then repeat the Telegram smoke test on the deployed URL.

## Live server: ask-for-a-date.lorqina.ir

The production site is served at **https://ask-for-a-date.lorqina.ir**. Nginx terminates TLS and proxies to a standalone Next.js service listening only on `127.0.0.1:3217`. HTTP redirects to HTTPS. The app runs as an isolated, unprivileged systemd user, starts at boot, and restarts on failure. Releases live under `/srv/ask-for-a-date/releases/`; `/srv/ask-for-a-date/current` points to the active release. Configuration templates are in `deploy/`.

Server credentials belong in `/etc/ask-for-a-date.env` (root-owned, mode `600`), outside the repository and release. Set the replacement `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, then run `sudo systemctl restart ask-for-a-date`. The server pins `APP_ORIGIN` so same-origin reporting works correctly behind HTTPS termination; it takes a comma-separated list, which keeps the previous host answering while a rename moves. Credentials were left empty at initial deployment.

The previous host `parmida.lorqina.ir` still answers from the same service. To finish the move, point the `ask-for-a-date` DNS record at the server, issue its certificate, then drop the old name from `server_name` and `APP_ORIGIN`.

Inspect service health with `systemctl status ask-for-a-date` and logs with `journalctl -u ask-for-a-date`. Nginx applies a 30-request/minute per-IP limit to `/api/report`, with a burst allowance of 10. Access logging is disabled for this domain. Let's Encrypt renews through the existing Certbot timer; a scoped renewal hook reloads Nginx for this certificate.

For a later release, run `npm ci && npm run build`, then `sudo sh deploy/publish.sh`. This copies the standalone build and public assets into a new release, switches the current symlink, restarts the service, and rolls back if the startup health check fails.

`node deploy/smoke.mjs` checks the actual HTTPS site, cat playback, date sealing, saved state, local calendar download, and cross-origin rejection. It generates normal visit/final reports if Telegram is configured; use it only when expecting those test notifications. Screenshots are saved to `test-results/live-*.png`.

The endpoint checks same-origin POSTs, signed expiring page tickets, content type, strict fields, bounded request bodies, and a 90-day date window. It limits tickets and reports, allows one visit and six final submissions per ticket, and caps notifications per server instance. Vercel's trusted forwarding header is used only as an ephemeral keyed rate-limit digest, never logged or persisted. Other hosts share a conservative local rate bucket until configured for a trusted proxy.

**Serverless limits:** the bounded in-memory rate and deduplication caches are per warm instance and reset on cold starts. Configure the edge rule above for distributed abuse protection. The browser prevents accidental duplicate final submissions and Strict Mode duplicate visits. This is not a globally exactly-once delivery system: that would require shared durable storage, and Telegram itself does not provide idempotent sends. There is no notification queue. A definite Telegram 429 rejection with a wait of at most one second is retried once; ambiguous network/timeout/5xx failures are logged without retry to avoid duplicates. Whoever is asked always gets their final card.

## Verify

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a production server on port 3100. It checks the full interaction, keyboard navigation, duplicate submissions, API rejection, offline/storage failure, and screenshots at 375, 390, 430, 768, and 1440 pixels. Screenshots go to `test-results/`. Run with blank Telegram credentials to avoid sending test notifications.

Dates are parsed as local noon, never as UTC midnight. The `.ics` is generated locally as an all-day event because afternoon/sunset/night are not exact times. Its exclusive end date, CRLF lines, escaping, and UTF-8 line folding follow RFC 5545. Nothing is sent to an external calendar. Local storage holds only the selected plan and a random event ID; “start over” clears it.

Fonts are self-hosted Newsreader, Afacad, and Kalam, with their OFL licenses in `public/fonts/`. The Content Security Policy permits inline scripts/styles required by the static Next.js page, while restricting resources and connections to the same origin and blocking framing. All motion respects reduced-motion preferences.

Implementation references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Telegram Bot API](https://core.telegram.org/bots/api#sendmessage), [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).
