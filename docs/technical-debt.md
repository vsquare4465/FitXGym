# FitX Gym — Technical Debt & Security Audit

---

## 18. Overengineering Assessment

Features impressive for demo but unnecessary/distracting for ~40–50 member gym.

| Feature | Recommendation | Rationale |
|---------|----------------|-----------|
| Member weight/measurement charts | **SIMPLIFY** | Owner rarely needs SVG charts; optional notes field enough |
| Workout & diet plans on Member | **MOVE TO FUTURE** or **REMOVE** | Personal training add-on, not gym admin core |
| Trainer messaging (`messages[]`) | **REMOVE** (v1) | No UI; WhatsApp covers communication |
| Blog section (3 articles) | **REMOVE** | Not local gym website need |
| Transformations gallery | **SIMPLIFY** | 1–2 real photos max, or remove |
| 4-trainer roster + videos | **SIMPLIFY** | Show owner + maybe 1 trainer |
| Inventory POS + 6 SKUs + restock | **SIMPLIFY** or **MOVE TO FUTURE** | Only if gym sells supplements regularly |
| Staff task checklists | **REMOVE** | Not used operationally |
| Staff performance stars / attendance rate | **REMOVE** | Mock metrics |
| Admin "view-as" all members in header | **REMOVE** | Demo/debug feature |
| MemberPortal admin profile tab | **REMOVE** | Duplicates dashboard |
| Role dropdown (Owner/Manager/Reception/Trainer) | **SIMPLIFY** | Real RBAC later; remove fake switcher |
| SMS broadcast simulation | **REMOVE** | Misleading |
| Audit log "Real-time Operations Ticker" | **KEEP** | Useful if backed by server |
| QR decorative animations | **SIMPLIFY** | Functional scan > visual effects |
| Gemini AI dependency | **REMOVE** | Unused |
| Express dependency | **REMOVE** until backend added | Unused |
| Hardcoded financial trend chart | **REMOVE** | Replace with real aggregation or nothing |
| GST calculation on registration | **SIMPLIFY** | Show plan price; GST note optional |
| Payment gateway UI (Card/UPI selectors) | **SIMPLIFY** | Record method only until real gateway |
| Progress photo uploads to localStorage | **MOVE TO FUTURE** | Quota risk |
| Base64 gallery/logo in localStorage | **MOVE TO FUTURE** | Needs file storage backend |
| Biometric BMI calculation (fixed 1.75m height) | **REMOVE** | Incorrect assumption |
| Multiple membership plan tiers (7 plans) | **SIMPLIFY** | 3–4 plans typical for small gym |
| Corporate/enterprise copy throughout | **REMOVE** | Replace with authentic local copy |

---

## 19. Data / Backend Gap

### Distance from production

| Layer | Current | Production need |
|-------|---------|-----------------|
| Data store | localStorage | PostgreSQL or SQLite |
| API | None | REST or tRPC |
| Auth | Client password check | JWT/session + bcrypt |
| File uploads | base64 in localStorage | S3/Cloudinary/local disk |
| Email/SMS | Fake alerts | Optional: email for receipts |
| Payments | Simulated | Razorpay/Cashfree/manual record |
| Multi-user | No | 2 owner accounts minimum |
| Backup | None | Daily DB backup |
| Hosting | Static Vite | Frontend + API deployment |

### What needs a real database

- Members (profile fields only)
- Memberships (history)
- Plans
- Payments
- Expenses
- Attendance
- Leads/enquiries
- Testimonials
- Staff/users
- Audit logs (structured, not strings)
- Website settings (key-value)
- Gallery metadata + file URLs
- QR session tokens

### What needs backend APIs

All CRUD for above +:

- `/auth/login`, `/auth/logout`, `/auth/me`
- `/checkin/validate-token`
- `/checkin/session` (in/out)
- `/reports/summary?period=month`
- `/upload` for images

### What needs authentication

- All `/admin/*` routes
- Member portal (phone/email + password or OTP)
- Check-in flow (member session or PIN)

### What needs persistent file storage

- Member photos
- ID proofs
- Gallery images
- Logo
- Expense receipts (optional)
- Progress photos (if kept)

### What needs server-side authorization

- Owner vs staff role permissions
- Member can only access own data
- Audit log writes server-side only

### What needs audit logging

- Login/logout
- Member create/edit/deactivate
- Payment create/edit
- Expense create/edit/delete
- Plan changes
- Gallery/settings changes
- QR token rotation
- Check-in/out events

### What needs validation

- Phone/email uniqueness
- Payment amount > 0
- Membership dates logical
- Expense categories enum
- File type/size on upload
- Check-in: active membership required

### Minimum practical backend architecture (40–50 members)

```
┌──────────────┐     HTTPS      ┌──────────────┐
│  React SPA   │ ◄────────────► │  Node API    │
│  (Vite)      │                │  Express or  │
└──────────────┘                │  Fastify     │
                                └──────┬───────┘
                                       │
                                ┌──────▼───────┐
                                │  PostgreSQL  │
                                │  (or SQLite  │
                                │   for MVP)   │
                                └──────────────┘
                                       │
                                ┌──────▼───────┐
                                │  File store  │
                                │  (S3/local)  │
                                └──────────────┘
```

**MVP scope:**

- Single API service
- Postgres (Supabase/Neon free tier works)
- JWT auth, 2 owner users seeded
- No microservices, no Redis initially
- WhatsApp stays client-side deep links
- Razorpay optional — manual payment entry is fine for v1

**Hosting options:**

- Frontend: Vercel/Netlify/Cloudflare Pages
- API: Railway/Render/Fly.io
- Or single VPS with nginx

---

## 20. Security Audit

| Risk | Description | Level |
|------|-------------|-------|
| Hardcoded admin credentials | `admin`/`admin` in client code | **CRITICAL** |
| Plaintext member passwords | Stored in localStorage JSON | **CRITICAL** |
| Frontend-only authorization | Role check in React only | **CRITICAL** |
| No HTTPS enforcement | Dev assumption | **HIGH** (production) |
| Member PII in localStorage | Names, phones, medical history | **HIGH** |
| QR check-in by ID only | Impersonation trivial | **HIGH** |
| Lobby token not validated | Security theater | **HIGH** |
| Session in localStorage | XSS could steal session | **HIGH** |
| No input sanitization | XSS in testimonials/names | **MEDIUM** |
| base64 images unbounded | localStorage DoS | **MEDIUM** |
| Admin view-as member shortcuts | Information exposure | **MEDIUM** |
| Credentials in error hints | Login form tells password | **HIGH** |
| No CSRF protection | N/A until API | **MEDIUM** (future) |
| No rate limiting on login | Brute force easy | **HIGH** |
| File upload no validation | Accepts any image client-side | **MEDIUM** |
| Financial data client-only | Tampering possible | **CRITICAL** |
| `.env` Gemini key | Not used; risk if committed | **LOW** currently |

### Sensitive data inventory

- Member: name, email, phone, password, medical history, emergency contact, ID proof
- Payments: amounts, invoice numbers
- Expenses: business financial outflows
- Staff: salaries

**All currently readable in browser DevTools.**

---

## Technical Debt Register

| ID | Item | Impact | Effort |
|----|------|--------|--------|
| TD-01 | Monolithic AdminDashboard (~2250 lines) | Maintainability | High |
| TD-02 | No router — single App state | SEO, sharing, separation | Medium |
| TD-03 | Member type god-object | Schema migration pain | High |
| TD-04 | Duplicate expense forms | Confusion | Low |
| TD-05 | Dead props/handlers | Confusion | Low |
| TD-06 | Hardcoded chart data | Wrong business decisions | Medium |
| TD-07 | alert() for UX | Poor mobile UX | Low |
| TD-08 | Non-standard Tailwind colors (zinc-850) | Build fragility | Low |
| TD-09 | Mock date in attendance seed (2026-07-16) | Confusing demo | Low |
| TD-10 | Inconsistent naming/branding in copy | Trust | Medium |
| TD-11 | index.html generic title | SEO | Low |
| TD-12 | README still AI Studio template | Onboarding | Low |
| TD-13 | No tests | Regression risk | Medium |
| TD-14 | No lint beyond tsc | Quality | Low |
| TD-15 | Payment status Pending unused | Incomplete feature | Medium |
| TD-16 | Registration assigns fake workout/diet | Data bloat | Low |

---

## Risk Summary Table

| Issue | Level |
|-------|-------|
| No shared persistent database | CRITICAL |
| Hardcoded admin password | CRITICAL |
| Client-side financial records | CRITICAL |
| Plaintext member passwords | CRITICAL |
| QR impersonation | HIGH |
| Misleading dashboard analytics | HIGH |
| Public admin login exposure | HIGH |
| localStorage quota / data loss | HIGH |
| No leads persistence | MEDIUM |
| Overbuilt UI complexity | MEDIUM |
| Unused dependencies | LOW |
| Inconsistent branding copy | LOW |

---

*Remediation order: see `refactoring-plan.md`*
