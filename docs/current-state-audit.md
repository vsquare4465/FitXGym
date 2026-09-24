# FitX Gym — Current State Audit

**Audit date:** September 13, 2026  
**Scope:** Full review of all 11 source files under `src/` plus project configuration  
**Code changes:** None (audit only)

---

## Executive Summary

FitX Gym is a **single-page React application** built as a Google AI Studio prototype. It combines a public marketing website, member self-service portal, online registration, QR attendance simulation, and an admin management console in one app shell.

The application is **functionally rich as a demo** but **not production-ready**. All business data lives in **browser `localStorage`** with mock seed data. There is **no backend**, **no real authentication**, and **no payment gateway**. The UI is polished but oriented toward a large “premium fitness chain” rather than a small local gym with ~40–50 members.

---

## 1. Current Architecture

### Framework & tooling

| Layer | Technology |
|-------|------------|
| UI framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` in `index.css`) |
| Icons | lucide-react |
| Animation | motion (Framer Motion successor) |
| Routing | **None** — view switching via `useState` in `App.tsx` |
| State management | React `useState` in `App.tsx` (central store) |
| Backend | **None implemented** (Express and `@google/genai` in `package.json` are unused) |
| Database | **None** |

**Source files (entire application):**

```
src/
├── App.tsx                 # Root: navigation, auth gate, all data state, handlers
├── main.tsx
├── index.css
├── types.ts
├── data/mockData.ts
└── components/
    ├── VisitorWebsite.tsx
    ├── LoginPortal.tsx
    ├── RegistrationPortal.tsx
    ├── MemberPortal.tsx
    ├── QRScannerPortal.tsx
    └── AdminDashboard.tsx   # ~2,250 lines — monolithic admin UI
```

### Routing approach

There is **no URL-based routing** (no React Router). Navigation uses:

- `currentView`: `'visitor' | 'member' | 'register' | 'scanner' | 'admin'`
- A **global sticky nav bar** in `App.tsx` visible on every view
- Admin-only tabs (Scanner, Management Hub) shown when `loggedInUser.role === 'admin'`

**Implications:**

- No deep links, no SEO-friendly URLs, no shareable admin routes
- Browser back/forward does not map to app sections
- Public site and admin are not separated at deploy/routing level

### State management

All domain data is lifted to `App.tsx` and passed as props:

- `members`, `staff`, `expenses`, `payments`, `attendance`, `inventory`, `plans`, `gallery`, `testimonials`, `auditLogs`, `lobbyToken`, `logoUrl`, `ownerPhoto`, `loggedInUser`

Child components call handler props (`onUpdateMember`, `onAddExpense`, etc.) to mutate parent state.

### Data storage & persistence

| Storage key | Content |
|-------------|---------|
| `fitx_members` | Member records |
| `fitx_staff` | Staff records |
| `fitx_expenses` | Expenses |
| `fitx_payments` | Payments |
| `fitx_attendance` | Attendance records |
| `fitx_inventory` | Inventory items |
| `fitx_plans` | Membership plans |
| `fitx_gallery` | Gallery image URLs / base64 |
| `fitx_testimonials` | Reviews |
| `fitx_audit_logs` | String log entries |
| `fitx_lobby_token` | QR lobby token string |
| `fitx_logo_url` | Logo (URL or base64) |
| `fitx_owner_photo` | Owner photo |
| `fitx_logged_in_user` | Session object |

**Persistence behavior:**

- Data **survives browser refresh** on the same device/browser
- Data is **per-browser, per-device** — not shared between owners, phones, or computers
- Clearing site data resets to mock seeds (or empty overrides)
- **Not multi-user safe** — two owners on different browsers see different data
- Base64 images in localStorage can hit quota limits quickly

### Authentication

**Member login** (`LoginPortal.tsx`):

- Match email or phone against `members` array
- Password compared in plain text (`member.password` or fallback `'123456'`)
- No hashing, no lockout, no session expiry, no server validation

**Admin login:**

- Hardcoded: username `admin` or `admin@fitx.com`, password `admin`
- Error message literally hints credentials to the user

**Session:**

- Stored in `localStorage` as `fitx_logged_in_user`
- Persists across refresh — no token, no expiry

### Authorization

- **Frontend-only** role check: `loggedInUser?.role === 'admin'`
- Admin dashboard has a **cosmetic role dropdown** (`Owner | Manager | Reception | Trainer`) that only hides some nav tabs — not real permissions
- Anyone who knows `admin/admin` has full access
- Member passwords stored in member objects (visible in DevTools / localStorage)

### Component structure

```
App (global nav + all state)
├── VisitorWebsite      → public marketing site
├── LoginPortal         → member + admin login
├── RegistrationPortal  → 3-step online signup wizard
├── MemberPortal        → member profile, biometrics, billing, renewals
├── QRScannerPortal     → lobby QR + manual ID check-in/out
└── AdminDashboard      → all admin features in horizontal sub-tabs
```

### Public website vs admin portal separation

| Aspect | Current state |
|--------|---------------|
| Code separation | Different components, same app shell |
| Nav separation | **Poor** — global bar always shows Home, My Profile, Register Online; Portal Login visible on public site |
| URL separation | **None** |
| Auth separation | Login portal has Member/Admin tabs on same screen |
| Data separation | Shared same state tree |

**Requirement gap:** Public site should NOT expose admin login — currently **Portal Login** is in the global header for all visitors.

### How members are stored

Single `Member` interface embeds **identity, membership, fitness tracking, coaching, and messaging** in one object:

- Core: `id`, `name`, `email`, `phone`, `password`, `photo`, `joinDate`, `expiryDate`, `planId`, `status`
- Emergency & medical: `emergencyContact`, `medicalHistory`, `idProofUrl`
- Fitness (overbuilt): `weightHistory`, `measurementsHistory`, `bmi`, `bodyFat`, `progressImages`, `workoutPlan`, `dietPlan`, `messages`
- QR: `qrCodeValue` (per-member, but **not used** in actual attendance flow)

**4 mock members** seeded; registration can add more.

### How payments are stored

`Payment` records in `payments` array:

- Linked by `memberId`, denormalized `memberName`
- Categories: Membership, Personal Training, Supplements, Merchandise, Registration
- Status supports `Pending` in type but **UI always creates `Completed`**
- No link to a separate Membership entity

### How expenses are stored

`Expense` records with category, amount, date, description, paymentMethod, status.

- Create/edit/delete works in admin UI
- Duplicate entry forms exist in Finance tab and Expenses tab
- No receipt file attachment (despite type implying business need)
- No date-range filter in UI

### How attendance works

`AttendanceRecord`: memberId, date, checkIn, checkOut, duration, status.

- Check-in creates new record via `handleCheckInSuccess` in `App.tsx`
- Check-out updates today's open record
- **No duplicate check-in prevention** at App level (QR portal checks `isMemberInside` before toggling)
- Checkout **duration is random** (45–120 min) in QRScannerPortal, not computed from timestamps
- Staff attendance mixed in same array (`role: 'Staff'`)
- **No dedicated admin attendance management UI** — `onCheckInMember`/`onCheckOutMember` props passed to AdminDashboard but **never used**
- `checkedInCount` calculated in AdminDashboard but **never displayed**

### How QR attendance works

**Advertised flow:** One generic lobby QR → member scans → identifies → check-in/out.

**Actual flow:**

1. Static decorative `QrCode` icon (not a real scannable encoding of URL/token)
2. `lobbyToken` string displayed (e.g. `FTX_TOKEN_7841`) — rotatable via button
3. Member enters **Member ID or phone** manually in kiosk form
4. System toggles check-in/out based on whether open record exists today
5. **Token is never validated** during check-in
6. Per-member `qrCodeValue` from registration is **not part of check-in logic**

### How gallery works

- Public: `VisitorWebsite` renders `gallery` prop (URLs or base64)
- Admin: upload adds base64 to array in localStorage via Overview tab
- Default: Unsplash stock images
- No captions, ordering, or categories

### How website settings work

Editable from Admin Overview tab:

- Logo upload → `fitx_logo_url`
- Owner photo → `fitx_owner_photo`
- Gallery images → `fitx_gallery`
- Membership plans → `fitx_plans` (Plans Config tab)
- Testimonials → approve/delete in Reviews Approval tab

**Not configurable:** gym name, address, phone, hours, social links, SEO meta — all hardcoded in `VisitorWebsite.tsx`.

### How WhatsApp works

**Real functionality:** `wa.me` deep links only.

| Location | Behavior |
|----------|----------|
| Admin Members table | "Remind" button for expired members — opens WhatsApp with pre-filled renewal message |
| Admin Marketing tab | Select members → individual "Send Msg" opens WhatsApp per recipient |
| Public site footer | Link to `wa.me/919999988888` |

**Simulated (not real):** SMS broadcast button shows success alert without sending.

### Mock vs production-ready

| Area | Status |
|------|--------|
| Public website layout/content | **Demo** — stock photos, fake metrics, corporate copy |
| Member registration form | **Partially working** — creates local member + payment record; payment is simulated |
| Member portal | **Working locally** — progress tracking, renewals (simulated payment) |
| Admin CRUD (members, expenses, plans) | **Working locally** |
| Dashboard metrics | **Partially accurate** — totals from records, chart is hardcoded |
| QR attendance | **Mock** — no camera scan, no token validation |
| Authentication | **Mock** — hardcoded credentials |
| WhatsApp | **Working** — deep links only (acceptable for v1) |
| Payments gateway | **Mock** — setTimeout + alert |
| Trial/contact forms | **Mock** — audit log or local alert only; no lead storage |
| Receipt/invoice PDF | **Mock** — alert only |
| Gemini AI | **Unused** — dependency present, no code |
| Multi-device sync | **Not production** |
| Security | **Not production** |

---

## 2. Feature Inventory

| Feature | Status | Notes |
|---------|--------|-------|
| **Public website** | PARTIALLY WORKING | Rich sections exist; content is demo/corporate; SEO poor (`index.html` title still "My Google AI Studio App") |
| **Admin dashboard** | PARTIALLY WORKING | Large monolith; core local CRUD works; many dead props/metrics |
| **Members** | PARTIALLY WORKING | Search/filter/edit/extend/suspend; no create-from-admin; no profile view; delete handler unused |
| **Memberships** | MOCK DATA | Plan catalog works; no Membership entity or history |
| **Payments** | PARTIALLY WORKING | Ledger display + auto-create on register/renew/POS; no manual payment form; no partial/pending UI |
| **Expenses** | WORKING (local) | Create/edit/delete; missing date filter, receipt upload |
| **Income** | PARTIALLY WORKING | Same as payments ledger; no separate income types beyond payment categories |
| **Inventory** | PARTIALLY WORKING | Stock + POS; overbuilt for small gym |
| **Staff** | MOCK DATA | Read-only cards; no CRUD, no login accounts |
| **Attendance** | PARTIALLY WORKING | QR kiosk only; no admin attendance tab/history |
| **QR** | UI ONLY | Decorative QR; manual ID entry; token not enforced |
| **Gallery** | WORKING (local) | Admin upload + public display |
| **Testimonials** | WORKING (local) | Submit → pending → admin approve |
| **Registration** | PARTIALLY WORKING | Full wizard; simulated payment |
| **Member portal** | PARTIALLY WORKING | Biometrics, workouts, billing; trainer messaging type exists but **no UI** |
| **WhatsApp** | WORKING | Deep links for individual + bulk prep |
| **Reports** | MISSING | No reports section |
| **Audit logs** | PARTIALLY WORKING | Append-only strings in localStorage; no search/filter/export |
| **Website CMS** | PARTIALLY WORKING | Logo, owner photo, gallery, plans, testimonials only |
| **Authentication** | MOCK DATA | Hardcoded admin; plaintext member passwords |
| **Roles** | UI ONLY | Dropdown does not enforce permissions |
| **Permissions** | MISSING | No real RBAC |
| **Leads / enquiries** | MOCK DATA | Trial + contact forms don't persist leads |
| **Leads dashboard** | MISSING | — |
| **Settings** | PARTIALLY WORKING | Scattered across Overview/Plans; no unified settings |
| **Blog / transformations** | MOCK DATA | Hardcoded in VisitorWebsite from mockData |
| **Trainer messaging** | MISSING (UI) | Data model exists, no interface |
| **Payment reminders** | PARTIALLY WORKING | WhatsApp remind for expired only |
| **Receipt generation** | UI ONLY | Alert simulates PDF download |

---

## 3. Data Model Critical Review

### Member model — keep vs separate

**Keep on Member (profile):**

- `id`, `name`, `email`, `phone`, `photo`, `joinDate`, `emergencyContact`, `medicalHistory`, `status` (as account status)

**Move to Membership entity:**

- `planId`, `expiryDate`, active/inactive membership state
- Historical memberships array

**Move to separate tables/collections:**

- `weightHistory`, `measurementsHistory`, `workoutPlan`, `dietPlan`, `messages` → optional future "Training" module or remove for v1
- `password` → auth system only (hashed server-side)
- `qrCodeValue` → replace with secure attendance identity flow
- `bmi`, `bodyFat` → computed fields, not stored defaults

### Membership / Plan / Payment separation

**Current (incorrect for requirements):**

```
Plan (catalog) ←── planId on Member (single current plan)
Payment (transactions, no membership link)
```

**Missing:**

- `Membership` record with `startDate`, `endDate`, `planId`, `status`, `memberId`
- Renewal creates new Membership; Member points to active membership
- Payment links to `membershipId` when applicable

**Renewal behavior today:** Overwrites `member.planId`, `member.expiryDate`, `member.status` — **history lost**.

---

## 4. Financial Logic Accuracy

| Metric | Source | Accurate? |
|--------|--------|-----------|
| Total revenue | `payments.reduce(sum)` | **All-time only** — not monthly/yearly |
| Total expenses | `expenses.reduce(sum)` | **All-time only** |
| Net profit | revenue − expenses | **Correct formula, wrong time scope** |
| Monthly revenue card (MemberPortal admin) | Same all-time total | **Mislabeled** |
| Revenue trend chart | Hardcoded Jan–Jun + current totals as Jul | **Misleading** — labeled "actual ledger" but mostly fake |
| Pending payments | Not calculated | **Missing** |
| New members | Not on dashboard | **Missing** |

---

## 5. Known Bugs & Dead Code

| Issue | Severity |
|-------|----------|
| `onDeleteMember` passed to AdminDashboard but never called | LOW |
| `onCheckInMember` / `onCheckOutMember` never used in admin | MEDIUM |
| `handleFreezeToggle` defined but no UI trigger | LOW |
| `checkedInCount` computed but not displayed | LOW |
| `activeSubTab` type missing `'testimonials'` but used | LOW (TS may warn) |
| QR checkout duration random, not real | MEDIUM |
| Duplicate check-in possible if flow bypassed | MEDIUM |
| Inconsistent owner names (Deepak vs Siddharth vs Siddharth Sharma) | LOW (content) |
| Location inconsistency (Khurja vs Noida in admin copy) | LOW |
| `@google/genai`, Express unused dependencies | LOW |

---

## 6. What Is Already Good (Preview)

- Single codebase already covers both public and admin experiences
- localStorage sync pattern is consistent and easy to migrate to API calls
- Membership plan CRUD propagates to public site and registration
- Expense tracking with categories matches gym needs
- WhatsApp deep-link pattern is appropriate for small gym
- Testimonial approval workflow is sensible
- Mobile-responsive Tailwind layouts exist (need UX refinement, not rewrite)
- TypeScript types provide a starting schema for backend design

---

*See also: `product-requirements.md`, `ui-ux-plan.md`, `technical-debt.md`, `missing-features.md`, `refactoring-plan.md`*
