# Fit X Gym — Cloudflare deployment

Fit X Gym runs entirely on Cloudflare: React static assets, an Express API on Workers, D1 for gym records, and KV for uploaded images/PDFs. Your PC can be off. No Render service, external PostgreSQL database, Container, or Tunnel is required.

## Existing account and resources

- Account: `5462c982f4be958c61aba04069f0a333`
- Worker: `fitx-gym`
- D1: `fitx-gym-db` / `0949ab84-751d-406c-b6fd-6c3d89ca6074`
- KV binding: `MEDIA`
- Configuration: `wrangler.jsonc`
- Owner credentials: `.wrangler/owner-login.txt` (private, ignored by Git). Change the password after first login.

The database starts with the owner, membership plans, and website defaults. It has no old members/payments. Render data could not be recovered because no backup was available.

## Update the app

```powershell
npm ci
npm run db:cf:remote
npm run deploy:cf
```

Wrangler builds the frontend and generates the Workers-specific Prisma client. Use `npm run types:cf` after changing bindings. Keep Workers on Free; do not enable Containers or upgrade the Workers subscription.

## Local Cloudflare development

```powershell
npm run setup:cf:local
npm run dev:cf
```

In another terminal:

```powershell
npm run test:cf
```

This uses separate local D1/KV data and `.dev.vars`. The older Node/Postgres development commands remain available for that environment. Production uses `prisma/schema.d1.prisma`, generated from `prisma/schema.prisma`; do not run `prisma db push` against D1.

`npm run setup:cf:remote` is a first-time initializer. It preserves an existing owner and uses ignored bootstrap state; do not delete that state and rerun against an initialized database, because its secrets protect existing logins.

## Activate fitxgymkhurja.com

On 14 November 2026, the GoDaddy nameservers were changed successfully to Cloudflare, and public DNS confirmed both assigned nameservers. Cloudflare subsequently activated the zone; both custom-domain HTTPS addresses and HTTP redirects passed live verification. The registrar setup was:

1. Open Domain Portfolio → fitxgymkhurja.com → DNS → Nameservers.
2. Choose **Change Nameservers → I'll use my own nameservers**.
3. Set exactly `keanu.ns.cloudflare.com` and `vera.ns.cloudflare.com`.
4. Save and complete any registrar verification.
5. In Cloudflare, wait for the zone to become **Active**. MX, SPF, DMARC, and the email CNAME were verified. The two missing GoDaddy DKIM CNAMEs were restored and verified directly against Cloudflare's authoritative nameserver.
6. The Worker routes fitxgymkhurja.com/* and www.fitxgymkhurja.com/* are declared in wrangler.jsonc. In Cloudflare DNS, ensure the existing website A/AAAA/CNAME records have Proxy status set to Proxied (orange cloud). The Worker handles all matching requests, so it does not contact the old Render origin. Preserve MX/TXT records.

Both website DNS records were verified as **Proxied** in the Cloudflare dashboard. **Always Use HTTPS** is now enabled. Universal SSL is enabled and HTTPS now works on both the root domain and www. The Workers-provided HTTPS address works independently of domain activation. Both custom-domain `/api/health` responses were verified with healthy D1 connectivity after activation. Print a fresh QR attendance poster using the final public domain.

## Email and WhatsApp

Password reset generation and one-time verification run in D1. Owners can generate a reset code from **Team → Reset code** without an email service.

Automatic email delivery needs an existing mailbox password or a verified Resend account. Configure secrets privately:

```powershell
npx wrangler secret put SMTP_PASS
# Or, with a verified sending domain:
npx wrangler secret put RESEND_API_KEY
```

The SMTP host/user/from address in wrangler.jsonc preserve the existing gym mailbox configuration. Automatic WhatsApp/SMS needs its own provider credentials; those providers may charge. The app does not buy or activate messaging services. Delivery cannot be verified until credentials are configured.

## Free-tier capacity

As checked against Cloudflare documentation on 13 November 2026:

- Workers: 100,000 requests/day, 10 ms CPU per invocation. Static assets are served separately.
- D1: 500 MB per database; 5 million rows read and 100,000 rows written per day.
- KV uploads: 1 GB storage, 100,000 reads/day, 1,000 writes/day. Each uploaded file is limited by this app to 8 MB.

Free-tier exhaustion causes operations to fail until limits reset; free hosting is not an unlimited availability guarantee. Domain renewals and any external messaging service remain separate. No paid hosting subscription is enabled by the project.

Uploads use random capability URLs. Treat private photo/document URLs as confidential: anyone who possesses the URL can fetch the file. Removed/replaced uploads can remain in KV; review storage usage in the dashboard.

## Backups and recovery

Export D1 before important changes and periodically while using the gym system:

```powershell
npm run backup:cf
```

Or double-click `Backup Gym.cmd`. This creates a dated private ZIP under `.wrangler/backups` containing the D1 database, KV uploads and metadata, application source, and login-recovery secrets. Copy the ZIP and checksum somewhere private outside this PC. Follow `BACKUPS.md` for daily retention and recovery. D1 also provides Time Travel recovery within its current free-plan retention window; inspect it with `npx wrangler d1 time-travel info fitx-gym-db` before a restore. Do not publish backups or secrets.

## Implementation notes

- API paths and screens remain the same. Express 5 provides async error handling on Workers.
- Native Web Crypto password hashes use PBKDF2-SHA256, a unique salt, 100,000 iterations, and an independent `AUTH_PEPPER` Worker secret. This is a fresh database; old bcrypt hashes were not imported.
- `JWT_SECRET` and `AUTH_PEPPER` are secrets, not tracked configuration. Preserve the pepper when redeploying or existing passwords will stop verifying.
- Multi-record member, renewal, registration, payment, and lead-conversion writes use atomic D1 batches. Bulk settings/gallery saves use bounded multi-row SQL statements.
- Rate limiting is shared through D1. A daily Worker cron removes expired limiter rows and old reset codes.
- The old `cloudflare/worker.js` Container implementation and Docker/Tunnel files are legacy alternatives and are not deployment entrypoints.

Official limits: https://developers.cloudflare.com/workers/platform/limits/ , https://developers.cloudflare.com/d1/platform/limits/ , https://developers.cloudflare.com/kv/platform/pricing/

## Verification on 13 November 2026

Live URL: https://fitx-gym.vaishalivvarshney.workers.dev

81 core API checks passed locally and in production. Another 22 production checks verified plan editing, phone-only member login, coaching messages, workout/diet records, profile/password changes, and SPA deep links. The public website and admin sign-in page were also checked in a browser. TypeScript passed. Automatic email/WhatsApp delivery requires provider secrets and was not included in delivery tests.

Use npm run backup:cf to export D1 without printing a signed download URL. The initial backup is private under .wrangler/.

## Final connection checks on 14 November 2026

A 1 MB upload was persisted in KV and downloaded intact. The local server was stopped and the deployed app still reported healthy D1 connectivity. Production business tables were cleared of the explicitly created test rows; one owner login remains.

SMTP_PASS is now an encrypted Worker secret. An owner-only connection test at POST /api/auth/check-email currently returns ESOCKET / CONN with a proxy connection failure, before SMTP authentication. No test email was sent. Automatic email OTP delivery remains unresolved; use Team-generated reset codes until the mailbox connection is fixed or a verified HTTP email provider is configured.

The password was initially added as a plain variable, and Wrangler printed it while reporting dashboard configuration differences. Change that mailbox password at the email provider and update SMTP_PASS as a Secret. Do not store it as a Text variable or in tracked files.

A direct Custom Domain attachment was rejected because Cloudflare manages an existing website record. Standard Worker routes are configured instead, preserving existing DNS. They require the domain zone to be Active and the website DNS record to be Proxied. The zone is now Active; both routes have passed live HTTPS and database-health checks.

The final deployment successfully published both standard Worker routes: fitxgymkhurja.com/* and www.fitxgymkhurja.com/*. Live health remained ok with the local runtime stopped. Cloudflare OAuth permits managing the Worker/routes but did not permit reading DNS record details or subscriptions. The website proxy settings were subsequently verified through the signed-in dashboard; any pre-existing billing subscription was not independently verified. No paid plan was enabled during this migration.
