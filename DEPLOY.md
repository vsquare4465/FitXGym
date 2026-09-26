# Fit X Gym — Production Deployment Guide

## What YOU need to add or update before going live

Use this checklist. Do not skip the security items.

### Required (must do)

| # | Item | Where / how |
|---|------|-------------|
| 1 | **Domain name** | Buy e.g. `fitxgym.in` from Hostinger, GoDaddy, Namecheap |
| 2 | **PostgreSQL database** | Neon, Supabase, Railway, or Render Postgres — copy `DATABASE_URL` |
| 3 | **JWT secret** | Generate 32+ random characters: `openssl rand -base64 32` |
| 4 | **Owner passwords** | Change from seed defaults (`FitXOwner1!`) in Admin after first login, or set new `SEED_OWNER*_PASSWORD` before first seed |
| 5 | **Environment variables** | Set on your host (see below) |
| 6 | **HTTPS** | Enable via host (Render/Railway auto) or Cloudflare / Let's Encrypt on VPS |
| 7 | **Website content** | Admin → Website: logo, hero, plans, gallery, contact, legal pages |
| 8 | **QR check-in poster** | Admin → Attendance → print QR with your **live domain** URL |

### Recommended

| # | Item | Notes |
|---|------|-------|
| 9 | **Cloudflare** | Free SSL, caching, DDoS protection — point DNS through Cloudflare |
| 10 | **Database backups** | Enable on Neon/Supabase/Railway or cron `pg_dump` on VPS |
| 11 | **Logo as PNG** | Transparent background, 400–800px wide |
| 12 | **Google Business Profile** | Add gym address, hours, website link |
| 13 | **WhatsApp number** | Verify in Admin → Website settings |
| 14 | **Remove demo data** | Delete sample members/expenses if not needed (optional) |

### Optional (later)

- Custom email (`info@yourdomain.in`) via Zoho or Google Workspace
- Cloudinary / S3 for images instead of base64 in database (faster loads)
- Google Analytics
- Uptime monitoring (UptimeRobot — free)

---

## Environment variables (production)

Set these on your hosting platform:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/fitxgym?sslmode=require
JWT_SECRET=<your-32+-char-random-secret>
PORT=3001
TRUST_PROXY=true
```

Optional:

```env
ALLOWED_ORIGINS=https://fitxgym.in,https://www.fitxgym.in
PUBLIC_SITE_URL=https://fitxgym.in
```

**Never commit `.env` to git.** Use your host's secret/env UI.

---

## How production works

One Node process serves **both**:

- React website (`dist/`) — public site, admin, check-in
- Express API (`/api/*`)

Commands:

```bash
npm install
npm run db:push          # create/update tables
npm run db:seed          # first time only — demo data + owner accounts
npm run build            # build React app → dist/
NODE_ENV=production npm start
```

Or in one step (local test):

```bash
# PowerShell
$env:NODE_ENV="production"
npm run start:prod
```

Open: http://localhost:3001 (website + API on same port)

Health check: http://localhost:3001/api/health

---

## Option A — Render (easiest)

1. Push project to **GitHub** (private repo)
2. Create account at [render.com](https://render.com)
3. **New → Blueprint** → connect repo → uses `render.yaml`
4. Set `JWT_SECRET` manually in Render dashboard (override generated if needed)
5. Seed runs in the **build** (`npm run db:seed`). Free plan has no Shell — that is fine.
   - Or seed once from your laptop with Render’s **External** `DATABASE_URL` (see [GO-LIVE.md](./GO-LIVE.md)).
6. Add custom domain in Render → update DNS at registrar (GoDaddy steps in [GO-LIVE.md](./GO-LIVE.md))
7. Login: `https://yourdomain.com/admin/login`

**Build command:** `npm ci && npx prisma generate && npm run build && npx prisma db push`  
**Start command:** `npm start`  
**Health check:** `/api/health`

---

## Option B — Railway

1. Push to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add **PostgreSQL** plugin → auto-injects `DATABASE_URL`
4. Set variables: `NODE_ENV=production`, `JWT_SECRET`, `TRUST_PROXY=true`
5. Settings → Build: `npm run build && npx prisma db push`
6. Settings → Start: `npm start`
7. Generate domain or add custom domain
8. Run seed once via Railway shell: `npm run db:seed`

---

## Option C — VPS (Hostinger / DigitalOcean)

### 1. Server setup (Ubuntu 22+)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

### 2. Clone & configure

```bash
git clone <your-repo> /var/www/fitxgym
cd /var/www/fitxgym
cp .env.example .env
nano .env   # set DATABASE_URL, JWT_SECRET, NODE_ENV=production, TRUST_PROXY=true
npm ci
npm run db:push
npm run db:seed   # first time only
npm run build
```

### 3. Run with PM2

```bash
NODE_ENV=production pm2 start npm --name fitxgym -- start
pm2 save
pm2 startup
```

### 4. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name fitxgym.in www.fitxgym.in;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fitxgym /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fitxgym.in -d www.fitxgym.in
```

---

## Option D — Docker

```bash
docker build -t fitxgym .
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e TRUST_PROXY=true \
  fitxgym
```

Use managed Postgres (Neon/Supabase) for `DATABASE_URL`, not localhost inside container.

---

## Post-deploy verification

| Test | URL |
|------|-----|
| Health | `/api/health` → `{ "status": "ok", "env": "production" }` |
| Public site | `/` |
| Admin login | `/admin/login` |
| Check-in | `/checkin?t=<token from admin>` |
| Contact form | Submit enquiry → appears in Admin → Leads |
| Gallery save | Admin → Website → Save gallery → visible on `/` |

---

## Updating after launch

```bash
git pull
npm ci
npm run db:push    # if schema changed
npm run build
pm2 restart fitxgym   # or redeploy on Render/Railway
```

---

## Monthly cost estimate (India)

| Service | Cost |
|---------|------|
| Domain | ~₹500–800/year |
| Render / Railway | ~₹400–1,200/month |
| Neon Postgres (free tier) | ₹0 to start |
| Cloudflare | Free |
| VPS alternative | ~₹400–800/month |

---

## Security reminders

- Change owner password immediately after first login
- Use a unique `JWT_SECRET` (never the example value)
- Keep `.env` out of git
- Enable HTTPS only (redirect HTTP → HTTPS)
- Regenerate QR token if the check-in URL was ever leaked
