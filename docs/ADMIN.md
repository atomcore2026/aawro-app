# AAWRO — Admin Console

Next.js (App Router) + Tailwind CSS at `admin.aawro.in`, deployed on Vercel. Desktop-first, min width 1280 px. Sidebar navigation, top bar with global search (booking code, phone, provider code) and the signed-in admin.

## Tech notes

| Concern | Approach |
| --- | --- |
| Routing | `app/(auth)/login`, `app/(console)/[module]/…`; `middleware.ts` redirects to login without a session cookie |
| Data | Client components with TanStack Query against the NestJS API; tables with TanStack Table (server-side pagination, filters in URL search params) |
| Realtime | One `socket.io-client` connection in the console layout; `activity` and `booking.updated` update query caches |
| Styling | Tailwind with the tokens in DESIGN-SYSTEM.md mapped in `tailwind.config.ts`; headless primitives (Radix) for dialogs, menus, tabs |
| Forms | `react-hook-form` + zod schemas from `packages/shared` |
| Charts | Recharts |
| Auth | API sets httpOnly cookies; Next.js never stores tokens in JS |
| Permissions | Sidebar and actions hidden per role; API enforces regardless |

## Rules for every admin action

1. Action opens a confirm dialog with a **required reason** (min 10 chars).
2. API writes the change and an `auditLogs` document (`before`, `after`, `reason`, `ip`) in one transaction.
3. A realtime event updates the customer and provider apps immediately.
4. A toast confirms; the record's timeline shows "by AAWRO admin" (admin name is never shown to users).

## Modules

### 1. Dashboard
- KPIs: GMV today / 7 d / 30 d, bookings by status, acceptance rate, median time to accept, active providers, open disputes, payments overdue, payouts pending.
- Charts: bookings per day, GMV per month.
- Attention list: requests expiring in < 1 h, no-show flags, failed payments, failed payouts, verification queue size.

### 2. Live activity
- Stream of every app event (`activity` socket), newest first.
- Filters by event type, app (Customer / Provider / System), area.
- Pause / resume; click opens the booking, customer or provider.

### 3. Bookings
- Table: code, customer, provider, service, start, hours, amount, status, payment status, area.
- Filters: status (11), date range, area, category, payment status.
- Detail: timeline (`booking.timeline`), parties, price breakdown, chat (read-only), payments, tickets, internal notes.
- Actions:

| Action | Allowed when | Effect |
| --- | --- | --- |
| Cancel | Any non-terminal | CANCELLED (by ADMIN); refund if paid |
| Reassign | REQUESTED, ACCEPTED, UPCOMING | New provider must have the service and hours free; old provider notified |
| Refund (full / partial) | PAID, REVIEWED, DISPUTED | Razorpay refund; payout adjusted |
| Extend expiry | REQUESTED | +2 h once |
| Add note | Any | Internal only |

### 4. Disputes & Support
- Queue: ticket code, kind, subject, booking, priority, status, assignee, age (SLA: first reply 2 h, resolve 48 h).
- Thread with customer / provider; internal notes.
- Resolve: no refund / partial / full — sets booking status and payout hold accordingly.

### 5. Customers
- List with bookings count, total spent, last booking, status.
- Profile: addresses, bookings, payments, tickets, reviews written.
- Block / unblock (reason).

### 6. Providers
- List: code, name, categories, rating, jobs, acceptance, earnings, verification, status.
- Profile: services and rates, availability grid (read-only), documents, bookings, payouts, reviews, strikes.
- Suspend / reinstate, feature / unfeature (reason).

### 7. Verification
- Queue of PENDING providers, oldest first.
- Document viewer (signed URL), checklist: photo matches ID, name matches, address proof valid, bank holder name matches.
- Approve or reject (reason sent to provider).

### 8. Categories & Services
- Groups → categories → services tree.
- Edit names, images, sort, enabled, default / min / max hourly rate.
- Disabling a service hides it from search; existing bookings continue.

### 9. Reviews
- List with filters (rating, hidden, flagged).
- Hide / unhide (reason); rating averages recompute.

### 10. Payments
- Transactions (`TX-…`): booking, customer, method, amount, fee, status, time.
- Failed payments with reason; invoice download (GST invoice PDF).

### 11. Refunds
- Refund list: amount, reason, admin, status.
- Create refund from a booking or ticket.

### 12. Payouts
- Weekly batches (`BATCH-W40`): providers, amount, status.
- Run batch, retry failed, hold / release (reason).

### 13. Coupons & Promotions
- Create coupon: code, % or flat, cap, min amount, category, dates, limits.
- Usage stats.

### 14. Notifications
- Campaigns: title, body, channel (Push / SMS / Email), audience (all users, customers, providers, by category, by area), schedule.
- Sent / draft list with reach and opens.

### 15. Reports
- GMV and bookings, 12 months
- Demand vs supply: searches with no available pro by service and area
- Top services
- Provider leaderboard
- By area
- Cancellation and decline reasons
- CSV export on every table

### 16. Settings
Platform name, support email / phone, city, commission, GST, convenience fee, request expiry, free cancellation window, cancellation fee, max services per category, enabled areas, payout schedule and minimum, hold payouts on disputes, payment methods.

### 17. Admin Team & Roles
- Invite admin (email), set role, disable.
- Permission matrix (see PERMISSIONS.md).

### 18. Audit Log
- Every admin action: time, admin, action, target, before → after, reason, IP.
- Filters by admin, target type, date; CSV export. Read-only.
