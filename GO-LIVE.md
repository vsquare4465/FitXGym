# Fit X Gym — Go live checklist

Use this short checklist to launch. Full hosting details: **[DEPLOY.md](./DEPLOY.md)**

---

## Before you deploy

- [ ] **Domain** purchased (e.g. `fitxgym.in`)
- [ ] **PostgreSQL** created (Neon, Supabase, or Railway Postgres)
- [ ] **JWT secret** generated: `openssl rand -base64 32`
- [ ] **Owner email/password** chosen for `SEED_OWNER1_*` (not demo passwords)
- [ ] Project pushed to **GitHub** (private repo recommended)

---

## Environment variables (on your host)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<your-32+-char-secret>
PORT=3001
TRUST_PROXY=true
PUBLIC_SITE_URL=https://yourdomain.com
SEED_DEMO_DATA=false
SEED_OWNER1_EMAIL=you@yourdomain.com
SEED_OWNER1_PASSWORD=A-Strong-Password-Here
```

Do **not** commit `.env` to git.

---

## Deploy (pick one)

### Render (easiest)

You do **not** need Render Shell. Free plan has no Shell — that is expected.

1. [render.com](https://render.com) → New → Blueprint → connect repo (`render.yaml` included)
2. Set env vars (see below). Redeploy so `db:push` + `db:seed` run in the **build**.
3. Settings → Custom Domains → add `yourdomain.com` and `www.yourdomain.com`
4. Point DNS at GoDaddy (see **GoDaddy DNS** below)

**If the first deploy already finished before seed was in the build**, create the owner account from your laptop (no Shell):

```powershell
# Render → your Postgres → Connections → External Database URL
$env:DATABASE_URL="<External Database URL from Render, not Internal>"
$env:NODE_ENV="production"
$env:SEED_DEMO_DATA="false"
$env:SEED_OWNER1_EMAIL="you@yourdomain.com"
$env:SEED_OWNER1_PASSWORD="A-Strong-Password-Here"
npm run db:seed
```

### GoDaddy DNS (Render)

1. Render → **fitx-gym** service → **Settings** → **Custom Domains** → add:
   - `yourdomain.com`
   - `www.yourdomain.com`
2. Copy the exact records Render shows. Then in GoDaddy → **My Products** → domain → **DNS** → **DNS Records**:
   - **www**: Type `CNAME`, Name `www`, Value `fitx-gym.onrender.com` (use *your* Render URL — no `https://`)
   - **root (@)**: Type `A`, Name `@`, Value `216.24.57.1` (Render load balancer). GoDaddy does not support CNAME on `@`.
3. Delete anything that fights this:
   - Old `A` / `AAAA` records on `@`
   - GoDaddy **Domain Forwarding** / parking page
   - Parked-page `CNAME` on `www`
4. Wait for Render to show the domain as **Verified** (minutes, sometimes a few hours). SSL is automatic after that.

Then set `PUBLIC_SITE_URL=https://yourdomain.com` in Render env vars and redeploy.

### Railway

1. [railway.app](https://railway.app) → New project → GitHub repo
2. Add **PostgreSQL** plugin
3. Variables: `NODE_ENV=production`, `JWT_SECRET`, `TRUST_PROXY=true`, `PUBLIC_SITE_URL`
4. Shell once: `npm run db:seed`

### VPS / own server

See **Option C** in [DEPLOY.md](./DEPLOY.md) (PM2 + Nginx + Certbot).

---

## After deploy (first 15 minutes)

| Step | Action |
|------|--------|
| 1 | Open `https://yourdomain.com/api/health` → `{ "status": "ok", "db": "ok" }` |
| 2 | Login `https://yourdomain.com/admin/login` with seed owner email |
| 3 | **Profile** → change password immediately |
| 4 | **Website** → upload logo, edit text, gallery → **Publish** |
| 5 | **Plans** → confirm prices match your gym |
| 6 | **Attendance** → copy/print QR poster (uses your live domain) |
| 7 | Submit test enquiry on `/` → check **Leads** in admin |
| 8 | Add a real member (not demo data) |

---

## Verify locally before pushing (optional)

```powershell
# PowerShell — simulate production on your machine
$env:NODE_ENV="production"
$env:JWT_SECRET="<your-secret>"
$env:DATABASE_URL="<your-neon-url>"
$env:TRUST_PROXY="true"
npm run build
npm run prod:check
npm start
# Open http://localhost:3001
```

---

## Production vs development seed

| | Development | Production |
|---|-------------|------------|
| Owner accounts | Created/updated | Created/updated |
| Plans & website defaults | Full upsert | **Only missing keys** (won't overwrite your edits) |
| Demo members/payments | Loaded | **Skipped** unless `SEED_DEMO_DATA=true` |
| Gallery | Reset if demo | Only if gallery is empty |
| QR token | Created if none | Created if none |

**Never run `db:seed` on a live site with real data unless you know what it does.** It is safe for owners/plans; it will not wipe website content in production.

---

## Monthly cost (India, approximate)

| Item | Cost |
|------|------|
| Domain | ₹500–800/year |
| Render / Railway | ₹400–1,200/month |
| Neon Postgres free tier | ₹0 to start |
| Cloudflare (optional) | Free |

---

## Need help?

- Build fails → check Render/Railway logs; run `npm run build` locally
- 503 on `/api/health` → `DATABASE_URL` wrong or DB not reachable
- Blank website → run `npm run build` on deploy; check `dist/` exists
- Can't login → re-run seed once with correct `SEED_OWNER1_*` env vars
