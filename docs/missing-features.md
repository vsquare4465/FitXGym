# FitX Gym — Missing Features & Gaps

Comprehensive list of what the target system requires but the current app lacks or only partially implements.

---

## Critical Missing (Blocks daily owner use)

| Feature | Detail | Current state |
|---------|--------|---------------|
| Shared database | Owners on different devices see different data | localStorage only |
| Server authentication | Secure login for 2 owners | admin/admin in JS |
| Admin route separation | Private admin URL, no public login link | Global nav exposes portal |
| Membership entity | Historical memberships per member | Single planId on member |
| Admin create member | Walk-in registration at desk | Registration portal only (public flow) |
| Record payment (admin) | Log cash/UPI without member self-service | No admin payment form |
| Pending payments | Track dues, partial payments | Type exists, never used |
| Leads / enquiries inbox | Trial + contact form submissions | Alert only, not stored |
| Attendance admin module | History, manual in/out, today's list | QR view only |
| Accurate dashboard periods | Monthly/yearly revenue/expense/profit | All-time totals only |
| Secure QR check-in | Token + member verification | ID typing only |

---

## High Priority Missing

| Feature | Detail |
|---------|--------|
| New members metric | Dashboard count this month |
| Renewals due list | Names + expiry dates, not just count |
| Pending payments list | Who owes what |
| Today's attendance on dashboard | Computed but not shown |
| Member detail page (admin) | Unified profile + tabs |
| Membership history view | Past plans and dates |
| Payment-linked renewal (admin) | Extend with payment record |
| Expense date picker | Backdate expenses |
| Expense filters | Category, date range |
| Expense receipt upload | Photo/PDF attachment |
| Website settings CMS | Phone, address, hours, socials, SEO |
| Google Maps embed | Real iframe map |
| Staff user accounts | Login for reception with limited access |
| Real permissions RBAC | Not cosmetic dropdown |
| Receipt/invoice PDF | Downloadable document |
| Welcome WhatsApp template | New member trigger |
| Expiry reminder templates | 7-day / 1-day before |
| Configurable owner WhatsApp # | Settings field |
| Member deactivate (soft) | vs conflating with Expired |
| Delete member (optional) | Handler exists, unwired |
| Freeze membership UI | Handler exists, unwired |
| Duplicate check-in prevention | App-level guard |
| Real checkout duration | From timestamps |
| SEO meta tags | title, description, OG |
| URL routing | /admin, /plans, etc. |

---

## Medium Priority Missing

| Feature | Detail |
|---------|--------|
| Reports section | Revenue, attendance, renewals export CSV |
| Income vs payments clarity | Separate non-member income if needed |
| Transaction reference field | Beyond invoiceNo |
| NetBanking in registration | In type, limited UI |
| Partial payment recording | Split across days |
| Member attendance history | Per member in admin |
| Currently inside gym (dashboard) | Only in QR portal |
| Audit log search/export | String array only |
| Gallery captions/order | Drag reorder |
| Plan archive (not delete) | Hide old plans |
| Opening hours admin edit | Hardcoded in website |
| Internet expense category | Category enum gap |
| Trainer expense category | Use Salary or add |
| Supplies category | Minor |
| Email notifications | Optional for receipts |
| Loading/error states | Proper UX |
| Toast notifications | Replace alert() |
| Empty states | Many screens |
| Integration tests | None |
| Data export/backup | None |
| Multi-gym support | Out of scope |

---

## Low Priority / Future

| Feature | Detail |
|---------|--------|
| Member workout/diet plans | Overbuilt for small gym admin |
| Trainer in-app messaging | WhatsApp sufficient |
| Progress photos | localStorage heavy |
| BMI/body fat tracking | Not admin priority |
| Inventory POS | If no supplement sales |
| Staff task management | Demo feature |
| Blog CMS | Removed from public site ideally |
| Transformations CMS | Optional marketing |
| SMS integration | WhatsApp enough |
| WhatsApp Business API | Not needed initially |
| Gemini AI features | Unused dependency |
| Biometric hardware | Out of scope |
| Mobile native app | PWA sufficient |
| Member QR codes (personal) | If lobby QR + login used |
| Competition/event promos | Marketing templates exist |

---

## Broken or Misleading (User thinks it works, it doesn't)

| Feature | Issue |
|---------|-------|
| SMS broadcast | Shows success, sends nothing |
| Payment gateway | "PROCESSING REGISTRATION" — no gateway |
| Receipt PDF download | Alert only |
| Revenue trend chart | Labeled "actual ledger" — mostly hardcoded |
| 24/7 opening hours claim | Contradicts weekday hours shown |
| QR scan | Cannot scan; decorative icon |
| Lobby token security | Rotating token doesn't affect check-in |
| Contact form response | "Neha will reply in 2 hours" — no notification |
| Role permissions | Switching role doesn't restrict data |
| Member delete (trash icon) | Suspends instead |

---

## Feature Status by Target Admin Nav

| Nav item | Completeness |
|----------|--------------|
| Dashboard | 40% |
| Members | 55% |
| Memberships | 15% |
| Payments | 45% |
| Expenses | 70% |
| Income | 45% (same as payments) |
| Attendance | 25% |
| Leads | 0% |
| Gallery | 60% |
| Website Content | 35% |
| WhatsApp | 65% |
| Reports | 0% |
| Staff / Users | 20% |
| Settings | 15% |
| Inventory | 70% (if needed) |

---

## Public Website Gap Checklist

- [ ] Remove admin/portal login from public header  
- [ ] Replace fake stats with real or none  
- [ ] Single enquiry form feeding leads DB  
- [ ] Real gym photos only  
- [ ] Consistent owner name and location  
- [ ] Embedded Google Map  
- [ ] Configurable hours from admin  
- [ ] SEO title/description  
- [ ] Remove or drastically trim blog/transformations/trainers  
- [ ] One clear primary CTA  
- [ ] Remove duplicate register entry points  

---

## Minimum Viable Product (MVP) Feature Set

For 2 owners managing ~50 members daily on mobile:

1. Login (owners)  
2. Dashboard with today's numbers (accurate)  
3. Members list + add/edit + search  
4. Membership assign/renew with history  
5. Record payment (full/partial/pending)  
6. Expenses list + add  
7. Attendance today + manual in/out + history  
8. Leads list from website forms  
9. WhatsApp quick actions  
10. Gallery + basic website settings  
11. Secure check-in page  
12. Public website (simplified)  

Everything else is **phase 2**.

---

*Cross-reference: `product-requirements.md` for requirement mapping, `refactoring-plan.md` for build order.*
