# FitX Gym — Implementation Roadmap

**Purpose:** Phased plan to improve the **existing** application without a from-scratch rebuild.  
**Based on:** `/docs/current-state-audit.md` and related audit documents.  
**Status:** Planning only — **no implementation code yet.**

---

## Guiding Principles

1. **Evolve, don't replace** — keep working patterns (central handlers, types, localStorage sync) until Phase 9 migrates to API.
2. **UI and navigation first** — owners must enjoy using the app on mobile before backend work.
3. **One source of truth per domain** — prepare types and service layers so Phase 9 is a swap, not a rewrite.
4. **Delete demo theater** — remove fake SMS, hardcoded charts, misleading labels as soon as touched.
5. **Every phase must leave the app runnable** — no broken intermediate states.

---

## Target Folder Structure (End State)

Current flat structure grows incrementally; full target by Phase 9:

```
src/
├── api/                    # Phase 9 — HTTP clients
├── components/
│   ui/                     # Phase 1 — design system
│   layouts/                # Phase 2 — PublicLayout, AdminLayout
│   public/                 # Phase 7 — VisitorWebsite sections
│   admin/                  # Phases 2–6 — split from AdminDashboard
│   member/                 # Phase 3 — split from MemberPortal
│   auth/                   # Phase 8 — split from LoginPortal
│   checkin/                # Phase 5 — split from QRScannerPortal
├── hooks/                  # Phase 1+
├── lib/                    # Phase 1 — formatters, dates, currency
├── pages/                  # Phase 2+ — route entry points
├── services/               # Phase 3+ — domain logic (localStorage → API)
├── store/                  # Phase 3+ — optional context for app state
├── types/                  # Phase 3+ — split from types.ts
├── data/mockData.ts        # Retained as seed until Phase 9
├── App.tsx                 # Slim router shell by Phase 2
├── main.tsx
└── index.css
```

---

## Component Disposition Summary

| Component / file | Action | Phase | Notes |
|------------------|--------|-------|-------|
| `src/index.css` | **Refactor** | 1 | Design tokens, typography base |
| `src/types.ts` | **Split** | 3, 4 | → `types/member.ts`, `membership.ts`, `payment.ts`, etc. |
| `src/data/mockData.ts` | **Retain** | 1–8 | Seed data; becomes seed script in Phase 9 |
| `src/App.tsx` | **Refactor** | 1, 2, 8 | Router + providers; shrink state over time |
| `src/main.tsx` | **Retain** | 2 | Wrap with Router |
| `src/components/AdminDashboard.tsx` | **Split** | 2–6 | Delete monolith after extraction (~2250 lines) |
| `src/components/VisitorWebsite.tsx` | **Split + refactor** | 1, 7 | Section components; simplify content |
| `src/components/MemberPortal.tsx` | **Split + refactor** | 3 | Remove admin duplication |
| `src/components/LoginPortal.tsx` | **Split** | 8 | Admin vs member login pages |
| `src/components/RegistrationPortal.tsx` | **Refactor** | 3, 7 | Simpler flow, shared form components |
| `src/components/QRScannerPortal.tsx` | **Split + refactor** | 5 | Check-in page + admin QR settings |
| `index.html` | **Refactor** | 7 | SEO meta |
| `vite.config.ts` | **Retain** | 9 | May add API proxy |
| `package.json` | **Refactor** | 1, 2, 9 | Add router; remove unused deps |

### AdminDashboard.tsx — extraction map

| Future module | Source content (approx) |
|---------------|-------------------------|
| `admin/DashboardPage.tsx` | Overview tab, KPI cards, audit ticker |
| `admin/MembersPage.tsx` | Members tab, search, table, modals |
| `admin/MemberDetailDrawer.tsx` | Edit modal + extend modal → unified drawer |
| `admin/StaffPage.tsx` | Staff tab (simplified) |
| `admin/PaymentsPage.tsx` | Cash Ledger + new payment form |
| `admin/ExpensesPage.tsx` | Expense Tracker (merge duplicate finance form) |
| `admin/InventoryPage.tsx` | Optional — simplify or defer |
| `admin/WhatsAppPage.tsx` | Marketing tab |
| `admin/PlansPage.tsx` | Plans Config |
| `admin/TestimonialsPage.tsx` | Reviews Approval |
| `admin/WebsiteSettingsPanel.tsx` | Logo, owner photo, gallery from Overview |
| `admin/AttendancePage.tsx` | New — Phase 5 |
| `admin/LeadsPage.tsx` | New — Phase 6 |
| `admin/ReportsPage.tsx` | New — Phase 4 (basic) / Phase 10 (export) |

### VisitorWebsite.tsx — extraction map

| Future module | Action |
|---------------|--------|
| `public/HeroSection.tsx` | Refactor — simplify |
| `public/AboutSection.tsx` | Retain |
| `public/PlansSection.tsx` | Retain |
| `public/GallerySection.tsx` | Retain |
| `public/LocationSection.tsx` | Refactor — real map |
| `public/TestimonialsSection.tsx` | Retain |
| `public/EnquirySection.tsx` | Merge trial + contact — Phase 7 |
| `public/TrainersSection.tsx` | **Delete** or merge into About |
| `public/TransformationsSection.tsx` | **Delete** Phase 7 |
| `public/BlogSection.tsx` | **Delete** Phase 7 |

### Merge candidates

| Merge | Into | Phase |
|-------|------|-------|
| Finance tab expense form | ExpensesPage | 4 |
| Admin Overview gallery/logo/owner | WebsiteSettingsPanel | 7 |
| Trial form + Contact form | Single EnquirySection | 7 |
| MemberPortal admin profile tab | Remove — use admin dashboard only | 3 |

### Delete list (by phase)

| Item | Phase |
|------|-------|
| Fake SMS broadcast UI | 6 |
| Hardcoded revenue chart (Jan–Jun fake data) | 2 |
| Admin view-as member shortcuts bar in App.tsx | 3 |
| MemberPortal admin "System Control Desk" | 3 |
| Blog + Transformations sections | 7 |
| Cosmetic admin role dropdown (until real RBAC) | 8 |
| `@google/genai` dependency | 1 |
| Unused Express import/dep (until Phase 9 server) | 1 or 9 |

---

## Phase Overview & Dependencies

```
Phase 1  Design system + UI foundation
    ↓
Phase 2  Admin navigation + dashboard UX
    ↓
Phase 3  Member + membership experience ──→ Phase 4  Payments + financial
    ↓                                              ↓
Phase 5  Attendance + QR                    Phase 6  Leads + WhatsApp
    ↓                                              ↓
Phase 7  Public website redesign  ←─────────────────┘
    ↓
Phase 8  Authentication + roles + security
    ↓
Phase 9  Backend/database persistence
    ↓
Phase 10 Testing + performance + production hardening
```

**Cross-dependencies:**
- Phases 1–7 can use **localStorage** with improved **service layer** abstraction.
- Phase 8 secures what Phases 2–7 built (must not ship production before 8+9).
- Phase 9 replaces service implementations; UI from 1–7 should need minimal changes if services are done right.

---

# PHASE 1 — Design System + UI Foundation

**Goal:** One consistent visual language across public site, admin, and member areas. Shared primitives so later phases don't reinvent buttons and tables.

**Depends on:** Nothing (first phase).

---

### Files / components affected

| File | Change |
|------|--------|
| `src/index.css` | Add CSS variables (colors, radius, spacing), base typography |
| `src/components/ui/*` | **New** — Button, Input, Select, Textarea, Label, Card, Badge, Modal, Sheet, Toast, EmptyState, PageHeader, StatCard, DataList, Table, Spinner, Alert |
| `src/lib/format.ts` | **New** — `formatCurrency`, `formatDate`, `formatPhone` |
| `src/lib/cn.ts` | **New** — className merge utility |
| `src/hooks/useToast.ts` | **New** — toast state |
| `src/components/AdminDashboard.tsx` | Replace inline button/input classes in **one pilot section** (e.g. expense form) to validate components |
| `src/components/LoginPortal.tsx` | Adopt ui/Button, ui/Input |
| `src/App.tsx` | Wrap with ToastProvider |
| `package.json` | Add `react-router-dom` (prep Phase 2); remove `@google/genai` if confirmed unused |

### Functionality changed

- Replace `alert()` with toast notifications (start with admin actions; full sweep in Phases 2–4).
- Standardize label copy: sentence case, remove ALL CAPS micro-labels in pilot areas.
- Replace non-standard `zinc-850` / `zinc-855` with standard Tailwind tokens.

### Functionality added

- Design token layer (primary orange, surfaces, semantic colors).
- Reusable empty and loading states.
- Mobile-friendly touch targets (min 44px on primary actions in ui/Button).

### Functionality removed / simplified

- Remove `@google/genai` from dependencies.
- Stop adding new one-off styled buttons/inputs in touched files.

### Database / backend implications

- None. Pure frontend.

### UI / UX implications

- **High impact** — foundation for all subsequent phases.
- Document tokens in code comments or `docs/design-tokens.md` (optional, not required unless requested).
- Inter/system font stack; reduce gradient overuse on secondary buttons.

### Security implications

- None directly.

### Testing required

- Visual check at 375, 390, 768, 1024, 1440 px on pilot screens.
- Verify toast doesn't block mobile interaction.
- `npm run lint` (tsc) passes.
- Manual: Button disabled/loading states work.

### Deliverables checklist

- [ ] `components/ui/` with at least 12 primitives
- [ ] index.css tokens defined
- [ ] LoginPortal + one admin section migrated to ui components
- [ ] Toast replaces alerts in migrated sections

---

# PHASE 2 — Admin Navigation + Dashboard UX

**Goal:** Admin feels like a daily-use mobile app for 2 owners — clear sidebar/bottom nav, accurate dashboard, no horizontal tab sprawl.

**Depends on:** Phase 1 (ui components, toasts).

---

### Files / components affected

| File | Change |
|------|--------|
| `package.json` | `react-router-dom` active |
| `src/main.tsx` | BrowserRouter |
| `src/App.tsx` | **Major refactor** — routes, strip global demo nav from admin routes |
| `src/components/layouts/AdminLayout.tsx` | **New** — sidebar (desktop), bottom nav (mobile), header with logout |
| `src/components/layouts/PublicLayout.tsx` | **New** — minimal public header/footer shell |
| `src/pages/admin/DashboardPage.tsx` | **New** — extracted from AdminDashboard overview |
| `src/components/admin/DashboardStats.tsx` | **New** |
| `src/components/admin/RevenueChart.tsx` | **New** — honest chart or empty state |
| `src/components/admin/RenewalsDueList.tsx` | **New** |
| `src/components/admin/RecentActivity.tsx` | **New** — audit log |
| `src/components/admin/TodayAttendanceSummary.tsx` | **New** — uses existing attendance data |
| `src/components/AdminDashboard.tsx` | **Partial deletion** — overview extracted; other tabs remain temporarily behind legacy route OR stub redirects |
| `src/services/dashboardService.ts` | **New** — compute metrics from payments/members/expenses/attendance arrays |
| `index.html` | Title → "FitX Gym Admin" for admin routes (or dynamic later in Phase 7) |

### Functionality changed

- **Navigation:** Replace 9 horizontal tabs with sidebar items:
  - Dashboard, Members, Payments, Expenses, Attendance (stub → Phase 5), Leads (stub → Phase 6), WhatsApp (stub → Phase 6), Website (stub → Phase 7), Settings (stub → Phase 8)
- **Dashboard KPIs:** Wire `checkedInCount` (currently dead) to Today's Attendance widget.
- **Renewals:** Show list of members expiring in 15 days, not just count.
- **Revenue chart:** Remove hardcoded Jan–Jun arrays; show either (a) real monthly aggregation from payment dates or (b) honest "Not enough data" empty state until Phase 4 improves payment dates.
- **App.tsx global nav:** Remove "Management Hub" / "Lobby Scanner" from public header; admin only via `/admin` after Phase 8 login gate (Phase 2 can use temporary route without auth).

### Functionality added

- URL routes: `/admin`, `/admin/dashboard` (additional routes added in later phases).
- Period selector on dashboard: This month / Last month / This year / All time.
- Quick action buttons: Add member (stub → Phase 3), Record payment (stub → Phase 4), Log expense (link to expenses).
- Mobile bottom nav: Dashboard, Members, Payments, More (sheet with remaining items).

### Functionality removed / simplified

- Delete hardcoded `revs = [120000, 145000, ...]` chart data.
- Remove labels: "Bento Overview", "Text Blaster", "Cash Ledger" → plain language.
- Remove emoji from admin navigation.
- Hide admin role dropdown until Phase 8 (or show read-only "Owner").

### Database / backend implications

- `dashboardService.ts` abstracts calculations — Phase 9 adds `GET /reports/dashboard?period=month`.
- Metric definitions documented for future SQL:
  - `activeMembers`, `newMembersThisPeriod`, `renewalsDue`, `pendingPayments`, `revenuePeriod`, `expensesPeriod`, `profitPeriod`, `attendanceToday`.

### UI / UX implications

- **Critical mobile improvement** — bottom nav + no double sticky headers on admin.
- Desktop: fixed left sidebar 240px, content scrolls independently.
- Dashboard cards max 2 columns on mobile, 4 on desktop.

### Security implications

- Phase 2 routes are **not yet protected** — temporary; document that admin URLs must not be linked publicly (Phase 7 removes public admin link).
- Do not expose sensitive data in URL params.

### Testing required

- Navigate all admin sidebar items (stubs show "Coming in Phase X" or legacy embed).
- Dashboard numbers match manual calculation from mock/localStorage data.
- Chart shows real aggregated data or empty state — never fake numbers.
- Mobile: bottom nav usable one-handed; sidebar hidden < 768px.
- Browser back button works with router.
- Refresh on `/admin/dashboard` restores state from localStorage.

### Deliverables checklist

- [ ] React Router with AdminLayout + PublicLayout
- [ ] Global demo nav removed from admin experience
- [ ] DashboardPage live with accurate period metrics
- [ ] Renewals due list + today's attendance visible
- [ ] Fake chart data removed

---

# PHASE 3 — Member + Membership Experience

**Goal:** Correct membership model, practical member admin for owners, simplified member portal.

**Depends on:** Phase 1 (ui), Phase 2 (admin routes, Members nav slot).

---

### Files / components affected

| File | Change |
|------|--------|
| `src/types.ts` | Add `Membership` interface; deprecate inline plan/expiry on Member |
| `src/types/membership.ts` | **New** |
| `src/types/member.ts` | **New** — slim Member profile |
| `src/services/memberService.ts` | **New** — CRUD, search, filter |
| `src/services/membershipService.ts` | **New** — create, renew, history, active membership resolver |
| `src/pages/admin/MembersPage.tsx` | **New** — from AdminDashboard members tab |
| `src/components/admin/MemberTable.tsx` | **New** — desktop table |
| `src/components/admin/MemberCardList.tsx` | **New** — mobile cards |
| `src/components/admin/MemberDetailDrawer.tsx` | **New** — tabs: Profile, Membership, Payments (stub), Attendance (stub) |
| `src/components/admin/MemberForm.tsx` | **New** — create + edit |
| `src/components/admin/MembershipForm.tsx` | **New** — assign plan, dates |
| `src/App.tsx` | Add `memberships` state array; migration on load from legacy `member.planId/expiryDate` |
| `src/data/mockData.ts` | Add `INITIAL_MEMBERSHIPS` derived from existing members |
| `src/components/AdminDashboard.tsx` | Remove members tab after extraction |
| `src/components/MemberPortal.tsx` | **Refactor** — use active membership; remove admin profile tab |
| `src/components/RegistrationPortal.tsx` | Create Membership record on register |
| `src/App.tsx` | Remove admin view-as shortcuts bar |

### Functionality changed

- **Data model:** Member profile separated from Membership lifecycle.
- **Renewal (`handleRenewSuccess`):** Creates new Membership row + Payment (Phase 4) instead of overwriting.
- **Member edit:** Drawer replaces modal; shows membership history timeline.
- **Member list mobile:** Card layout with status badge, expiry, WhatsApp icon.
- **Registration:** Still creates Member + initial Membership.
- **Suspend vs delete:** Trash → "Deactivate" (status inactive); optional hard delete behind confirm in drawer footer.
- **Freeze:** Wire `handleFreezeToggle` to UI toggle on membership or member status.

### Functionality added

- **Admin create member** — form without full public registration wizard (name, phone, plan optional).
- **Membership history** — list past memberships with plan name, start, end, status.
- **Active membership resolver** — single function used everywhere (portal, QR, dashboard).
- **localStorage key:** `fitx_memberships`.

### Functionality removed / simplified

- Remove Member fields from active code path: `workoutPlan`, `dietPlan`, `messages`, `weightHistory`, `measurementsHistory`, `progressImages`, `bmi`, `bodyFat` from **admin** views (keep in type as optional legacy until cleanup, or move to `MemberFitness` optional type).
- Remove admin view-as bar from `App.tsx`.
- Remove MemberPortal admin profile / System Control Desk duplicate dashboard.
- Remove per-member QR display emphasis in registration success (lobby QR is primary — Phase 5).

### Database / backend implications

- Schema preview (Phase 9):

```sql
members (id, name, email, phone, photo, join_date, status, emergency_*, medical_*, ...)
memberships (id, member_id, plan_id, start_date, end_date, status, created_at)
-- member.active_membership_id FK optional
```

- `membershipService` interface mirrors future API:
  - `getActiveMembership(memberId)`
  - `getMembershipHistory(memberId)`
  - `createMembership(...)`, `renewMembership(...)`

### UI / UX implications

- Member detail drawer is primary admin interaction — no full page navigation for edits.
- Search debounced; filters: All, Active, Expired, Pending, Frozen.
- Member portal shows one membership card with days remaining from active membership.

### Security implications

- Member PII still in localStorage — acceptable until Phase 9.
- Admin create member should not display other members' passwords.

### Testing required

- Register new member → Membership created with correct end date per plan.
- Renew member → old membership archived, new active membership.
- Edit member profile doesn't corrupt membership dates.
- Migration: existing localStorage members get synthetic membership records on first load.
- Mobile: member cards tappable; drawer scrolls; forms usable at 375px.
- Deactivate member → cannot check in (prep for Phase 5 validation).
- `handleDeleteMember` either wired with confirm or removed from props.

### Deliverables checklist

- [ ] Membership type + service + localStorage sync
- [ ] MembersPage with table/cards + detail drawer
- [ ] Admin create member flow
- [ ] Legacy member data migration
- [ ] MemberPortal simplified (member-only)
- [ ] Admin view-as bar removed

---

# PHASE 4 — Payments + Financial Management

**Goal:** Trustworthy money tracking — record payments, pending/partial, accurate dashboard revenue, expenses unified.

**Depends on:** Phase 3 (memberships link to payments), Phase 2 (dashboard, routes).

---

### Files / components affected

| File | Change |
|------|--------|
| `src/types/payment.ts` | **New** — extend Payment with `membershipId?`, `referenceNo?`, `amountPaid`, `amountDue?` |
| `src/services/paymentService.ts` | **New** |
| `src/services/expenseService.ts` | **New** — extract from AdminDashboard |
| `src/services/financeService.ts` | **New** — period aggregates, profit |
| `src/pages/admin/PaymentsPage.tsx` | **New** — from Cash Ledger tab |
| `src/pages/admin/ExpensesPage.tsx` | **New** — merge Expense Tracker + remove duplicate finance form |
| `src/components/admin/PaymentForm.tsx` | **New** — record payment modal |
| `src/components/admin/PaymentTable.tsx` | **New** |
| `src/components/admin/ExpenseForm.tsx` | **New** |
| `src/components/admin/ExpenseTable.tsx` | **New** — with filters |
| `src/components/admin/RevenueChart.tsx` | **Update** — real monthly series from payments/expenses |
| `src/pages/admin/DashboardPage.tsx` | Wire pending payments, monthly/yearly revenue |
| `src/components/AdminDashboard.tsx` | Remove finance + expenses tabs |
| `src/App.tsx` | Handlers delegate to paymentService |
| `src/components/MemberPortal.tsx` | Billing tab uses paymentService; receipt stub improved |
| `src/components/RegistrationPortal.tsx` | Creates payment via service; support Pending status |

### Functionality changed

- **Dashboard revenue:** Filter payments by selected period; same for expenses and profit.
- **Payment list:** Full list with filters (member, status, category, date range) — not just last 8.
- **Renewal/register:** Link payment to `membershipId`.
- **Expense create:** Add date picker (not always today).
- **Expense duplicate forms:** Single form on ExpensesPage only.

### Functionality added

- **Admin record payment:** New membership, renewal, partial, ad-hoc (supplements/PT).
- **Pending payment:** Create with `status: 'Pending'`, `amountDue` tracked.
- **Partial payment:** Multiple payments against one membership invoice group (via shared `referenceNo` or `invoiceNo` prefix).
- **Payment methods:** UPI, Cash, Card, NetBanking — all selectable.
- **Reference/transaction number** field.
- **Receipt preview:** HTML template + browser print (PDF via print dialog) — not fake alert.
- **Basic reports section** on Payments page: export CSV of payments for period (client-side blob download).

### Functionality removed / simplified

- Inventory POS tab → **defer** to optional sub-page or simplify to "Record sale" inside Payments (category Supplements/Merchandise) unless owner confirms inventory need.
- Remove misleading "Monthly Sales" label showing all-time total in MemberPortal admin remnants.
- GST breakdown on registration → optional collapsible; default show plan price only.

### Database / backend implications

```sql
payments (id, member_id, membership_id, amount, amount_due, date, category,
          payment_method, status, invoice_no, reference_no, notes, created_at)
expenses (id, category, amount, date, description, payment_method, status, receipt_url, ...)
```

- `financeService.getDashboardMetrics(period)` → Phase 9 `GET /reports/dashboard`.

### UI / UX implications

- Payments page: primary action FAB "Record payment" on mobile.
- Expense filters: category chips + date range at top.
- Pending payments highlighted amber on dashboard list.
- Currency always `₹` formatted via `formatCurrency`.

### Security implications

- Financial writes go through service layer (single place to add auth checks in Phase 8/9).
- CSV export contains PII — warn in UI.

### Testing required

- Record full payment → membership active, dashboard revenue updates for month.
- Record partial → pending balance shown; second payment completes.
- Expense backdate → appears in correct month on chart.
- Profit = sum(completed payments) − sum(expenses) for period — manual verify.
- Delete/edit expense still works.
- POS/inventory path: either works via payment record or cleanly hidden.
- Receipt print opens sensible layout.

### Deliverables checklist

- [ ] PaymentsPage + PaymentForm with all payment types
- [ ] ExpensesPage unified with date + filters
- [ ] Dashboard financial metrics accurate by period
- [ ] Revenue chart from real data
- [ ] CSV export for payments
- [ ] Inventory tab simplified or deferred

---

# PHASE 5 — Attendance + QR

**Goal:** Practical attendance for owners; fix QR bugs; prep secure flow for Phase 8.

**Depends on:** Phase 3 (active membership validation), Phase 2 (Attendance nav slot).

---

### Files / components affected

| File | Change |
|------|--------|
| `src/pages/admin/AttendancePage.tsx` | **New** |
| `src/pages/checkin/CheckInPage.tsx` | **New** — from QRScannerPortal member-facing flow |
| `src/components/admin/AttendanceTable.tsx` | **New** |
| `src/components/admin/ManualCheckInForm.tsx` | **New** — uses `onCheckInMember` / `onCheckOutMember` |
| `src/components/admin/CurrentlyInsideList.tsx` | **New** — from QRScannerPortal right column |
| `src/components/admin/LobbyQrPanel.tsx` | **New** — token display, regenerate, real QR encoding URL |
| `src/services/attendanceService.ts` | **New** |
| `src/services/checkInTokenService.ts` | **New** |
| `src/components/QRScannerPortal.tsx` | **Split/delete** after migration |
| `src/App.tsx` | Fix `handleCheckInSuccess` duplicate guard; real duration calc |
| `src/pages/admin/DashboardPage.tsx` | Today's attendance from attendanceService |

### Functionality changed

- **Check-in validation:** Reject Expired, Pending, Frozen memberships; use `membershipService.getActiveMembership`.
- **Duplicate check-in:** `attendanceService.checkIn` throws if open session exists for member today.
- **Check-out duration:** Compute from check-in timestamp, not random 45–120 min.
- **QR code:** Generate real scannable QR encoding `/checkin?t={lobbyToken}` (Phase 2 router).
- **Lobby token:** Validated on check-in page load (Phase 8 adds server validation).
- **Manual admin check-in/out:** Wire previously unused props on AttendancePage.

### Functionality added

- **Attendance history** — filter by date, member; paginated list.
- **Member attendance tab** in MemberDetailDrawer (from Phase 3).
- **Staff attendance** — optional separate filter; don't mix in member default view.
- **Today's summary** — count in, count out, currently inside.

### Functionality removed / simplified

- Remove "Quick Select simulation helper" chips from production check-in UI (dev-only flag optional).
- Remove "DECRYPTING SECURE TOKEN" fake loading copy.
- QRScannerPortal deleted after split.
- Separate admin "Lobby Scanner" app nav view → `/checkin` public route + admin QR panel under Attendance.

### Database / backend implications

```sql
attendance (id, member_id, date, check_in, check_out, duration_minutes, source, created_at)
qr_tokens (token, created_at, revoked_at, is_active)
```

- `attendanceService` methods: `checkIn`, `checkOut`, `getToday`, `getHistory`, `getCurrentlyInside`.

### UI / UX implications

- Check-in page: large buttons, minimal text, works on member phone browser.
- Admin attendance: mobile list of who's in gym right now at top.
- Manual check-in: member search autocomplete.

### Security implications

- Phase 5 (local): token in URL + member session or PIN (Phase 8).
- Remove anonymous check-in by typing any Member ID without auth — **gate behind member login or staff manual override**.
- Staff manual override logged in audit.

### Testing required

- Check in → check out → duration matches clock.
- Double check-in blocked.
- Expired member rejected at check-in.
- Regenerate token → old QR URL shows "invalid token" message.
- Manual admin check-in/out works.
- Dashboard today count matches attendance page.
- Member drawer attendance tab shows history.

### Deliverables checklist

- [ ] AttendancePage with history + manual + currently inside
- [ ] CheckInPage with token validation
- [ ] Real QR code generation
- [ ] Duplicate + duration bugs fixed
- [ ] QRScannerPortal removed

---

# PHASE 6 — Leads + WhatsApp

**Goal:** Capture website enquiries; practical WhatsApp tools for owners.

**Depends on:** Phase 2 (nav slots), Phase 1 (ui), Phase 7 partial (forms can be wired before full redesign).

---

### Files / components affected

| File | Change |
|------|--------|
| `src/types/lead.ts` | **New** |
| `src/services/leadService.ts` | **New** |
| `src/pages/admin/LeadsPage.tsx` | **New** |
| `src/pages/admin/WhatsAppPage.tsx` | **New** — from marketing tab |
| `src/components/admin/LeadTable.tsx` | **New** |
| `src/components/admin/WhatsAppComposer.tsx` | **New** |
| `src/components/admin/MessageTemplates.tsx` | **New** |
| `src/App.tsx` | `handleBookTrialSuccess`, contact submit → leadService |
| `src/components/VisitorWebsite.tsx` | Wire forms to leadService (minimal change before Phase 7) |
| `src/components/AdminDashboard.tsx` | Remove marketing tab |
| `src/pages/admin/MembersPage.tsx` | Standardize per-member WhatsApp actions |

### Functionality changed

- Trial booking + contact form → persist Lead records (`fitx_leads` localStorage).
- WhatsApp remind on expired members → use templates.
- Marketing multi-select → WhatsApp page with templates.

### Functionality added

- **Lead statuses:** New, Contacted, Converted, Closed.
- **Lead sources:** Trial, Contact, Registration abandoned (future).
- **Templates:** Payment reminder, Expiry reminder (7 day), Welcome, General announcement, Gym closed.
- **Configurable owner WhatsApp numbers** (1–2) in settings stub → Phase 7/8 settings page.
- **Bulk WhatsApp prep:** Select members → open wa.me links with template (keep manual per-recipient pattern).

### Functionality removed / simplified

- **Delete fake SMS broadcast** entirely.
- Remove broadcast "Dispatched Successfully" alert for SMS.
- Simplify marketing presets to 4–5 gym-relevant templates.

### Database / backend implications

```sql
leads (id, name, phone, email, message, source, status, created_at, notes)
settings (key, value) -- whatsapp_owner_1, whatsapp_owner_2
```

### UI / UX implications

- Leads inbox: unread count badge on sidebar.
- One tap: Call | WhatsApp | Mark contacted.
- WhatsApp page: template picker + member filter (expired, due soon, all active).

### Security implications

- Leads contain PII — protect admin route in Phase 8.
- WhatsApp links expose phone numbers client-side only — acceptable.

### Testing required

- Submit trial on public site → lead appears in admin.
- Submit contact form → lead appears.
- Update lead status persists after refresh.
- WhatsApp template encodes correct message for Hindi/English gym name placeholder.
- Expired member remind opens correct wa.me URL.
- Bulk select 3 members → 3 send buttons work.

### Deliverables checklist

- [ ] LeadsPage with CRUD status
- [ ] Public forms persist leads
- [ ] WhatsAppPage with templates + multi-select
- [ ] SMS fake feature removed
- [ ] Sidebar badge for new leads

---

# PHASE 7 — Public Website Redesign

**Goal:** Simple, professional, local gym website — SEO-friendly, no admin exposure, CMS-driven content.

**Depends on:** Phase 1 (ui), Phase 6 (leads wired), Phase 3 (plans), Phase 2 (PublicLayout).

---

### Files / components affected

| File | Change |
|------|--------|
| `src/components/layouts/PublicLayout.tsx` | Public header: logo, Plans, Gallery, Contact; **no admin login** |
| `src/pages/public/HomePage.tsx` | **New** — composes sections |
| `src/components/public/*` | **New** — split from VisitorWebsite |
| `src/components/VisitorWebsite.tsx` | **Delete** after migration |
| `src/pages/admin/WebsitePage.tsx` | **New** — logo, owner photo, gallery, hours, phone, address, socials, SEO fields |
| `src/services/websiteSettingsService.ts` | **New** — `fitx_settings` localStorage |
| `src/App.tsx` | Route `/` → HomePage; remove visitor from view switcher |
| `index.html` | Default meta; dynamic title/description via settings optional |
| `src/data/mockData.ts` | Remove MOCK_BLOGS, MOCK_TRANSFORMATIONS from public imports |

### Functionality changed

- **Content:** Authentic local copy; remove 10k sqft, 25 championships, 24/7 false claim.
- **Hours:** Single source from website settings.
- **Location/phone/socials:** From settings, not hardcoded.
- **Navigation:** Single sticky header; remove duplicate section pill nav OR simplify to 4 anchors.
- **Enquiry:** Merged trial + contact with type selector → leads.
- **Registration CTA:** Clear path to `/register` without cluttering header.

### Functionality added

- **Google Maps embed** (iframe) with fallback link.
- **SEO fields** in admin: page title, meta description, OG image URL.
- **Opening hours editor** in WebsitePage (weekday/weekend).
- **Plans section** unchanged data source (`plans` prop / settings).

### Functionality removed / simplified

- **Delete:** Blog section, Transformations section, 4-trainer grid (replace with founder bio block).
- **Delete:** Fake hero metrics (or replace with editable optional stats in settings).
- **Delete:** Global App.tsx nav buttons (Home, My Profile, Register) from public layout — use proper header/footer links.
- **Simplify:** Founder section — one photo, short bio, credentials optional.
- **Simplify:** Testimonials — keep approval workflow, reduce visual noise.

### Database / backend implications

```sql
website_settings (key, value, updated_at)
gallery_images (id, url, caption, sort_order, created_at)
```

### UI / UX implications

- **Major visual improvement** for visitors.
- Lighter page weight — fewer sections, less animation.
- Mobile: hamburger menu with 5 links max.
- Lighthouse SEO pass targets: title, meta, h1, alt tags on gallery.

### Security implications

- No admin links on public pages.
- Member login at `/login` only — not labeled "admin".

### Testing required

- Public site has zero admin navigation.
- All settings changes reflect on homepage after refresh.
- Maps embed loads; external link fallback works.
- Trial/enquiry still creates leads.
- Plans display matches admin plan config.
- Testimonials show only approved.
- Responsive 375–1440 px.
- View page source shows sensible meta.

### Deliverables checklist

- [ ] VisitorWebsite split into public sections + deleted
- [ ] WebsitePage admin CMS for contact/hours/SEO
- [ ] PublicLayout without demo nav
- [ ] Blog/transformations/trainers removed
- [ ] Maps embed live

---

# PHASE 8 — Authentication + Roles + Security

**Goal:** Real login for 2 owners + optional staff; protect admin routes; secure check-in identity.

**Depends on:** Phases 2–7 (routes and features exist). Can implement **client-side auth layer** before Phase 9 server auth.

---

### Files / components affected

| File | Change |
|------|--------|
| `src/pages/auth/AdminLoginPage.tsx` | **New** — from LoginPortal admin tab |
| `src/pages/auth/MemberLoginPage.tsx` | **New** — from LoginPortal member tab |
| `src/components/auth/ProtectedRoute.tsx` | **New** |
| `src/services/authService.ts` | **New** — session management |
| `src/types/user.ts` | **New** — User, Role |
| `src/components/LoginPortal.tsx` | **Delete** after split |
| `src/App.tsx` | Protected `/admin/*`; remove hardcoded credential check from component |
| `src/pages/checkin/CheckInPage.tsx` | Require member auth or PIN |
| `src/pages/admin/SettingsPage.tsx` | **New** — change password stub, staff users stub |
| `src/data/mockData.ts` | Replace admin password with hashed placeholder instructions for Phase 9 |

### Functionality changed

- **Admin login:** Route `/admin/login`; no credentials in source (Phase 8 client: env-based or hashed local users file; Phase 9: API).
- **Member login:** `/login` for member portal only.
- **Session:** Timeout optional (8 hours); logout clears session.
- **Check-in:** Member must be logged in OR enter phone + PIN set at registration.
- **Remove** credential hints from login UI ("use admin/admin").

### Functionality added

- **User accounts:** 2 owner seeds, optional reception staff (view members, attendance, leads — no finance delete).
- **RBAC permissions matrix:**

| Permission | Owner | Reception | Trainer (optional) |
|------------|-------|-----------|---------------------|
| Dashboard | ✓ | ✓ | ✗ |
| Members | ✓ | ✓ | read |
| Payments | ✓ | ✓ | ✗ |
| Expenses | ✓ | ✗ | ✗ |
| Attendance | ✓ | ✓ | ✓ |
| Leads | ✓ | ✓ | ✗ |
| WhatsApp | ✓ | ✓ | ✗ |
| Website settings | ✓ | ✗ | ✗ |
| Staff management | ✓ | ✗ | ✗ |

- **Audit:** Log login failures, permission denials.
- **PIN for check-in:** 4–6 digits, stored hashed (Phase 9).

### Functionality removed / simplified

- Delete cosmetic role dropdown from old AdminDashboard (replaced by real logged-in user role).
- Remove member passwords from being displayed anywhere in admin UI.
- Remove admin view-as unless reimplemented as explicit impersonation with audit (default: remove).

### Database / backend implications

```sql
users (id, email, password_hash, name, role, phone, is_active, created_at)
member_pins (member_id, pin_hash) -- or column on members
sessions / refresh_tokens -- Phase 9
```

- Phase 8 interim: `authService` with local user store in localStorage (better than admin/admin, still not production — document clearly).

### UI / UX implications

- Clean login pages using Phase 1 ui components.
- Redirect to `/admin/login` when unauthenticated admin access attempted.
- Permission denied → friendly page, not broken blank.

### Security implications

- **CRITICAL phase** for client-side improvement.
- Still not production-grade until Phase 9 server validation.
- Remove all hardcoded passwords from repo.
- CSRF/XSS: sanitize testimonial/lead text inputs.
- Rate limit login attempts (client counter + Phase 9 server).

### Testing required

- Unauthenticated `/admin/dashboard` → redirect login.
- Owner login → full access.
- Reception login → expenses/settings blocked.
- Wrong password → error, no hint.
- Member login → member portal only.
- Check-in without auth → blocked.
- Logout clears session; refresh requires re-login.
- No admin link on public site (regression).

### Deliverables checklist

- [ ] Split login pages + ProtectedRoute
- [ ] authService + RBAC guards on admin pages
- [ ] Hardcoded admin/admin removed
- [ ] Check-in requires member identity
- [ ] SettingsPage for user management stub

---

# PHASE 9 — Backend + Database Persistence

**Goal:** Shared truth for 2 owners across devices; replace localStorage with API while preserving UI from Phases 1–8.

**Depends on:** All prior phases (service layer must exist).

---

### Files / components affected

| File | Change |
|------|--------|
| `server/` or `api/` | **New** — Express/Fastify + Prisma |
| `prisma/schema.prisma` | **New** — full schema |
| `src/api/client.ts` | **New** — fetch wrapper, auth headers |
| `src/services/*.ts` | **Refactor** — swap localStorage for API calls |
| `src/App.tsx` | Remove localStorage sync effects; use Query provider |
| `package.json` | Server scripts, prisma, bcrypt, jsonwebtoken |
| `vite.config.ts` | Dev proxy `/api` → server |
| `.env.example` | DATABASE_URL, JWT_SECRET, etc. |
| `src/data/mockData.ts` | `prisma/seed.ts` |
| `README.md` | Deployment instructions |

### Functionality changed

- All CRUD goes through REST (or tRPC) endpoints.
- **localStorage:** Only auth token / UI preferences — not business data.
- **File uploads:** Gallery, logo, photos → storage bucket URLs.
- **Migration tool:** One-time import from browser localStorage export.

### Functionality added

- **API endpoints** matching service methods (document in `docs/api.md` when implemented).
- **Automated backups** documented for Postgres.
- **Health check** `/api/health`.

### Functionality removed / simplified

- Remove all `fitx_*` localStorage business keys from App.tsx useEffects.
- Remove duplicate state initialization from localStorage in App.tsx.

### Database / backend implications

**Full schema** — members, memberships, plans, payments, expenses, attendance, leads, testimonials, users, gallery, settings, audit_logs, qr_tokens.

**Hosting:** Frontend static + API on Railway/Render/Fly; DB on Neon/Supabase.

### UI / UX implications

- Loading skeletons on lists (TanStack Query).
- Optimistic updates optional for attendance check-in speed.
- Error toasts on network failure with retry.

### Security implications

- **Production gate:** bcrypt passwords, JWT httpOnly cookies, server RBAC middleware, HTTPS only.
- Validate all inputs server-side.
- Audit log writes server-side only.
- QR token validation server-side.

### Testing required

- Integration tests for API routes (auth, members, payments).
- Two browser profiles see same data after sync.
- Import from legacy localStorage works.
- File upload stores URL, not base64 in DB.
- Permission enforced server-side (reception cannot DELETE expenses even via curl).
- Load test light: 50 members, 500 payments — acceptable latency on mobile.

### Deliverables checklist

- [ ] Prisma schema + migrations
- [ ] API matches existing service interfaces
- [ ] Frontend uses API via TanStack Query
- [ ] localStorage business data removed
- [ ] Seed script from mockData
- [ ] Migration/import path documented
- [ ] Deployed staging environment

---

# PHASE 10 — Testing + Performance + Production Hardening

**Goal:** Ship confidently — automated tests, performance, monitoring, ops runbook.

**Depends on:** Phase 9 (production backend).

---

### Files / components affected

| File | Change |
|------|--------|
| `vitest.config.ts` | **New** |
| `src/**/*.test.ts(x)` | **New** — unit + component tests |
| `e2e/` or `playwright.config.ts` | **New** — critical path e2e |
| `src/pages/admin/ReportsPage.tsx` | **New/complete** — CSV exports, period reports |
| `.github/workflows/ci.yml` | **New** — lint, test, build |
| `docs/runbook.md` | **New** — backup, restore, owner onboarding |
| All bundles | Code-split admin routes; lazy load charts |

### Functionality changed

- Error boundaries on admin and public layouts.
- Consistent loading/error states everywhere (audit gaps closed).

### Functionality added

- **Reports:** Monthly revenue, expenses, profit, attendance summary, renewals due export.
- **Performance:** Route-based code splitting; image lazy loading on gallery.
- **PWA optional:** manifest + icons for "Add to Home Screen" on owner phones.
- **Monitoring:** Sentry or similar optional hook points.

### Functionality removed / simplified

- Dev-only simulation helpers removed from production builds.
- Console.log cleanup.

### Database / backend implications

- Index payment.date, membership.end_date, attendance.date for report queries.
- Backup cron daily.

### UI / UX implications

- Perceived performance: admin dashboard LCP < 2.5s on 4G.
- Accessible focus states (Phase 1 ui audit).

### Security implications

- Dependency audit `npm audit`.
- Security headers on API (helmet).
- Rate limiting on auth endpoints.
- Pen test checklist: auth bypass, IDOR on member records.

### Testing required

| Area | Test type |
|------|-----------|
| financeService aggregates | Unit |
| membershipService renew | Unit |
| attendanceService duplicate block | Unit |
| PaymentForm | Component |
| Admin login → record payment | E2E |
| Public enquiry → lead in admin | E2E |
| Member check-in flow | E2E |
| RBAC reception blocked from expenses | E2E |
| Mobile viewport admin dashboard | E2E |

### Deliverables checklist

- [ ] CI pipeline green
- [ ] 80%+ coverage on services
- [ ] 5+ critical e2e tests
- [ ] Reports export working
- [ ] Runbook for gym owners
- [ ] Production deployment verified on mobile devices

---

## Cross-Phase: App.tsx Evolution

| After phase | App.tsx responsibility |
|-------------|------------------------|
| 1 | ToastProvider |
| 2 | Router + layouts; state still here |
| 3–6 | State + service delegation; shrinking handlers |
| 7 | Public routes only in PublicLayout; admin state in admin context |
| 8 | AuthProvider |
| 9 | QueryClientProvider; minimal state |
| 10 | Error boundaries |

---

## Cross-Phase: Preserve These Existing Behaviors

| Behavior | Where preserved |
|----------|-----------------|
| Plan CRUD → public plans display | PlansPage → plans service |
| Testimonial submit → approve → website | TestimonialsPage + public section |
| Expense categories | expenseService |
| WhatsApp wa.me deep links | WhatsAppPage |
| Registration wizard (simplified) | RegistrationPortal |
| Member renewal flow | membershipService + PaymentForm |
| Audit logging concept | auditService → server in Phase 9 |
| Gallery admin upload | WebsitePage + storage in Phase 9 |
| Gym branding (logo, owner photo) | WebsitePage settings |

---

## Risk Register by Phase

| Phase | Top risk | Mitigation |
|-------|----------|------------|
| 1 | Scope creep on ui library | Cap at 12 primitives; extend lazily |
| 2 | Router break existing flows | Keep legacy routes temporarily |
| 3 | Data migration bugs | Versioned migration on localStorage load |
| 4 | Partial payment complexity | Start with simple pending flag |
| 5 | Check-in auth friction | PIN + remember session 24h |
| 6 | Leads spam | Basic rate limit on public forms |
| 7 | Content still feels fake | Owner provides real copy/photos before launch |
| 8 | False sense of security pre-Phase 9 | Document "staging only" until Phase 9 |
| 9 | Big bang migration | Import tool + parallel run period |
| 10 | Untested financial reports | Cross-check with manual ledger |

---

## Estimated Effort (Rough)

| Phase | Focus | Relative effort |
|-------|-------|-----------------|
| 1 | Design system | 3–5 days |
| 2 | Admin nav + dashboard | 5–7 days |
| 3 | Members + memberships | 7–10 days |
| 4 | Payments + finance | 7–10 days |
| 5 | Attendance + QR | 5–7 days |
| 6 | Leads + WhatsApp | 3–5 days |
| 7 | Public website | 5–7 days |
| 8 | Auth + security | 5–7 days |
| 9 | Backend + DB | 10–14 days |
| 10 | Testing + hardening | 5–7 days |

**Total:** ~55–80 dev days for one developer (phases 6–7 can overlap slightly).

---

## Recommended Start

When you approve implementation, begin with **Phase 1**:

1. Create `src/components/ui/` primitives  
2. Add tokens to `index.css`  
3. Migrate `LoginPortal` to ui components  
4. Add toast provider  

Then **Phase 2** immediately follows — admin UX is the highest owner impact.

---

## Document Index

| Doc | Purpose |
|-----|---------|
| `implementation-roadmap.md` | **This file** — phased execution plan |
| `current-state-audit.md` | As-is architecture |
| `product-requirements.md` | Target vs current |
| `ui-ux-plan.md` | Design direction |
| `technical-debt.md` | Security + debt |
| `missing-features.md` | Gap list |
| `refactoring-plan.md` | Original summary + success criteria |

**No code has been implemented.** Awaiting your go-ahead on Phase 1.
