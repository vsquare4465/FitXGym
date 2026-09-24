# FitX Gym — Product Requirements Comparison

This document compares the **target system** for a small local gym (~40–50 members) against the **current implementation**.

---

## Target Users

| User | Needs |
|------|-------|
| 2 owners | Daily operations: members, payments, expenses, attendance, WhatsApp |
| Optional staff | Reception/trainer with limited permissions |
| Members | View membership, pay/renew, check-in, optional profile |
| Public visitors | Discover gym, view plans, enquire, book trial |

---

## 3. Public Website Requirements

| Requirement | Target | Current | Gap |
|-------------|--------|---------|-----|
| Home | Yes | Hero + metrics | **WORKING** but corporate/demo content |
| About | Yes | About + facilities | **WORKING** |
| Membership plans | Yes | Plans section with tabs | **WORKING** — synced from admin plans |
| Gallery | Yes | Gallery section | **WORKING** |
| Opening hours | Yes | Weekday/weekend in history block; also false "24/7" claim | **PARTIAL** — inconsistent |
| Contact | Yes | Contact form | **UI ONLY** — not stored |
| Location | Yes | Address in map section | **WORKING** |
| Google Maps | Yes | Link + simulated map | **PARTIAL** — no embedded map |
| WhatsApp contact | Yes | Footer link | **WORKING** |
| Instagram/social | Yes | Instagram, Facebook links | **WORKING** (placeholder URLs) |
| Inquiry form | Yes | Contact form | **UI ONLY** |
| Trial/enquiry | Yes | Free trial form | **UI ONLY** — alert/audit only |
| Testimonials | Yes | Approved reviews + submit | **WORKING** |
| No admin login on public site | **Required** | Portal Login in global nav | **FAIL** — exposed on all views |
| SEO-friendly | Yes | Generic title, no meta description, no SSR | **FAIL** |
| Feels like local gym | Yes | Reads like premium chain / AI template | **FAIL** |

### Public website content issues

- Hero claims: "10k+ sq.ft", "25+ Championship Prizes", "4.9★ Google Rating" — unverified
- Equipment brands (Hammer Strength, Eleiko, Rogue) may not match reality
- Blog section with 3 long science articles — heavy for small gym
- Transformations section with duplicate before/after images
- 4 named trainers section — may exceed actual staff
- Founder section very long with championship timeline
- Name/branding inconsistency: Fit X Power Gym / Elite Club / Siddharth vs Deepak

---

## 4. Admin System — Navigation Comparison

| Target nav | Current equivalent | Status |
|------------|-------------------|--------|
| Dashboard | Bento Overview | PARTIAL |
| Members | Members Portal tab | PARTIAL |
| Memberships | Embedded in member edit + Plans Config | MISSING as entity |
| Payments | Cash Ledger tab | PARTIAL |
| Expenses | Expense Tracker tab | WORKING (local) |
| Income | Combined with Cash Ledger | PARTIAL |
| Attendance | QR Scanner separate view only | MISSING in admin |
| Leads / Enquiries | — | MISSING |
| Gallery | Overview tab section | PARTIAL |
| Website Content | Scattered (logo, owner, gallery, plans, reviews) | PARTIAL |
| WhatsApp | Marketing tab + member remind | PARTIAL |
| Reports | — | MISSING |
| Staff / Users | Staff Schedules tab (read-only) | PARTIAL |
| Settings | Role dropdown + scattered config | MISSING unified |
| Inventory | Supplement POS tab | EXISTS (evaluate simplify) |

### Current admin tabs

1. Bento Overview  
2. Members Portal  
3. Staff Schedules (Owner/Manager only)  
4. Cash Ledger  
5. Expense Tracker  
6. Supplement POS  
7. Text Blaster (Owner/Manager only)  
8. Plans Config (Owner/Manager only)  
9. Reviews Approval  

**Problems:**

- Horizontal scroll tab bar with jargon labels ("Bento Overview", "Text Blaster")
- No attendance or leads section
- Finance split across 3 tabs (Cash Ledger, Expense Tracker, Inventory POS)
- Website management split across Overview + Plans + Reviews

---

## 5. Dashboard Requirements

| Metric / widget | Required | Current | Accurate? |
|-----------------|----------|---------|-----------|
| Total members | Yes | Total in active card subtitle | YES |
| Active members | Yes | Active count card | YES |
| New members | Yes | — | **MISSING** |
| Renewals due | Yes | "About to Renew (15 Days)" | YES (15-day window) |
| Pending payments | Yes | — | **MISSING** |
| Monthly revenue | Yes | — | **MISSING** (shows all-time) |
| Yearly revenue | Yes | — | **MISSING** |
| Expenses | Yes | Gross outflow card (all-time) | PARTIAL |
| Profit | Yes | Net profit in expense card | PARTIAL (all-time) |
| Revenue trend | Yes | Chart with hardcoded months | **INACCURATE** |
| Expense trend | Yes | Same chart | **INACCURATE** |
| Today's attendance | Yes | `checkedInCount` computed | **NOT SHOWN** |
| Upcoming renewals list | Yes | Count only | **MISSING list** |
| Pending payments list | Yes | — | **MISSING** |
| Recent activity | Yes | Audit log ticker (last 10) | PARTIAL |

---

## 6. Member Management Requirements

| Capability | Target | Current |
|------------|--------|---------|
| Create member | Admin + online registration | Registration portal only |
| Edit member | Yes | Edit modal (basic fields) |
| View member | Full profile | Table row only; MemberPortal for admin "view-as" |
| Deactivate member | Yes | Suspend → sets Expired; no true deactivate |
| Delete member | Optional | Handler exists, **not wired** |
| Search | Yes | By name, ID, phone |
| Filter | Yes | By status (missing Pending in filter UI) |
| Member profile | Yes | Scattered in MemberPortal |
| Membership history | Yes | **MISSING** |
| Payment history | Yes | MemberPortal billing tab; not in admin member view |
| Attendance history | Yes | **MISSING** |
| Renewal | Yes | Extend days modal; no payment-linked renewal in admin |
| Pending payment | Yes | **MISSING** |
| WhatsApp contact | Yes | Remind button for expired |
| Freeze membership | Yes | Handler exists, **no UI** |

---

## 7. Membership System Requirements

| Requirement | Current |
|-------------|---------|
| Separate Plan catalog | YES — `Plan` type + admin CRUD |
| Separate Membership records | **NO** — planId + expiry on Member |
| Separate Payment records | YES — but not linked to membership ID |
| Multiple historical memberships | **NO** — overwrite on renewal |
| Preserve history on renewal | **NO** |

**Verdict:** Data model does **not** correctly support required membership lifecycle.

---

## 8. Payments Requirements

| Capability | Target | Current |
|------------|--------|---------|
| New membership payment | Yes | On registration (simulated) |
| Renewal payment | Yes | Member portal (simulated) |
| Partial payment | Yes | **MISSING** |
| Pending payment | Yes | Type exists, never created in UI |
| Payment history | Yes | Cash Ledger (last 8), member billing tab |
| Payment method | Yes | UPI/Card/Cash/NetBanking |
| Transaction/reference number | Yes | `invoiceNo` only |
| Date | Yes | YES |
| Receipt/invoice | Yes | Alert mock only |
| Admin record payment | Yes | **MISSING** dedicated form |
| Link payment to membership | Yes | **MISSING** |

---

## 9. Expense Management Requirements

| Capability | Target | Current |
|------------|--------|---------|
| Categories (rent, utilities, salary, etc.) | Yes | 10 categories — good coverage |
| Create | Yes | YES |
| Edit | Yes | YES (Expenses tab) |
| View | Yes | Table list |
| Filter | Yes | **MISSING** |
| Date range | Yes | **MISSING** |
| Category filter | Yes | **MISSING** |
| Amount | Yes | YES |
| Payment method | Yes | YES |
| Receipt attachment | Yes | **MISSING** |
| Notes | Yes | Description field |
| Pending expenses | Optional | Type supports; always creates Paid |

**Missing categories vs target:** Internet, Trainer (as distinct from Salary), Supplies (could use Miscellaneous)

---

## 10. Financial Logic Requirements

| Rule | Current compliance |
|------|------------------|
| Revenue from payment records | YES for totals |
| Expenses from expense records | YES for totals |
| Profit = Revenue − Expenses | YES for all-time |
| Monthly/yearly views | **NO** |
| No hardcoded financial data | **VIOLATED** — chart uses fake monthly arrays |

---

## 11. Attendance Requirements

| Capability | Target | Current |
|------------|--------|---------|
| Manual check-in | Yes | **MISSING in admin** (props unused) |
| Manual check-out | Yes | **MISSING in admin** |
| Today's attendance | Yes | QR portal side panel only |
| Attendance history | Yes | **MISSING** |
| Member attendance history | Yes | **MISSING** |
| Currently inside gym | Yes | QR portal "Active Lobby Occupants" |
| Check-in time | Yes | YES |
| Check-out time | Yes | YES |
| Duration | Yes | Random on QR checkout |
| Prevent duplicate records | Yes | Partial (QR only) |

---

## 12. QR Attendance Requirements

### Target flow

1. One generic gym QR code  
2. Owner can regenerate/revoke  
3. Member scans QR  
4. Member securely identifies  
5. System validates membership  
6. Check-in; later check-out  

### Current flow

1. One lobby poster with decorative QR + token display  
2. Token rotatable — **not enforced**  
3. No real scan — manual ID/phone entry  
4. Identification by Member ID or phone — **insecure**  
5. Validates Expired status only — not Pending/Frozen  
6. Toggle check-in/out works locally  

### Security problems

| Issue | Risk |
|-------|------|
| Anyone can check in as any member knowing ID/phone | HIGH |
| Lobby token displayed but never validated | HIGH |
| No member PIN/OTP after scan | HIGH |
| No session binding to device | MEDIUM |
| Per-member QR from registration unused | MEDIUM |
| Admin "view-as" exposes all members in nav | MEDIUM |

### Recommended practical flow (small gym, not over-engineered)

1. **Lobby QR encodes URL:** `https://app.fitxgym.in/checkin?t={signedToken}`  
2. **Token rotated** by owner; old URLs invalid  
3. Member opens link → if not logged in, login with phone + 4–6 digit PIN (set at registration)  
4. Show confirm screen → Check In / Check Out  
5. Server validates active membership  
6. Rate-limit and log attempts  

**Alternative minimal v1:** Keep deep link + member login session on phone; no PIN if member already logged in.

---

## 13. WhatsApp Requirements

| Capability | Target | Current |
|------------|--------|---------|
| Individual member WhatsApp | Yes | Remind + marketing send |
| Payment reminder | Yes | Expired members only |
| Expiry reminder | Yes | Partial (same remind message) |
| Welcome message | Yes | **MISSING** template |
| General broadcast | Yes | Marketing composer |
| Multi-select for broadcast | Yes | YES |
| Owner WhatsApp numbers (1–2) | Yes | Hardcoded public link only |
| Deep links acceptable | Yes | YES |
| WhatsApp Business API | Not required | Not used — correct |

**Gaps:** No configurable owner number in settings; no auto-template for welcome/expiry; SMS channel is fake.

---

## Priority Matrix (Product)

| Priority | Item |
|----------|------|
| P0 | Real backend + auth + persistent shared data |
| P0 | Separate public site from admin (routing + hide admin login) |
| P0 | Membership entity + payment linkage |
| P1 | Admin mobile UX + simplified navigation |
| P1 | Leads capture from trial/contact forms |
| P1 | Attendance admin view + secure check-in |
| P1 | Dashboard accurate monthly/yearly metrics |
| P2 | Reports export |
| P2 | Receipt PDF generation |
| P3 | Inventory/POS (simplify or defer) |
| P3 | Member fitness tracking (simplify or defer) |
| REMOVE | Fake SMS, hardcoded chart data, blog/transformations if not real |
