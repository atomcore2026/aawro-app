# AAWRO — User Flows

## 0. Entry (both apps)

1. Splash → entry screen: **I need a service** / **I offer a service**.
2. The choice decides the app (separate customer and provider builds; the entry screen deep-links to the other store listing if the wrong app is installed).
3. Role is stored on the account and never switched in-app.

---

## Customer app

### C1. Onboarding
1. Enter phone number → `POST /auth/otp/request`
2. Enter 6-digit OTP → `POST /auth/otp/verify` → tokens
3. Enter name
4. Add address: pick city and area, house / street, pin; or use current location
5. Land on Home

Errors: wrong OTP (3 tries, then 60 s cooldown), resend after 30 s.

### C2. Home
- Greeting, current area (tap to change)
- Search bar → Search
- Popular categories, featured providers, promos
- "Everyday" home basics row

### C3. Explore (three levels)
1. **Categories**: 30 categories grouped by theme; each shows pro count and "from ₹X/hr"
2. **Services**: services within a category with price range
3. **Providers**: providers offering that service in the customer's area, sorted by rating, distance, price; filters: verified only, open on date, max rate

### C4. Search
- Type a service name; suggestion chips shown before typing
- Results are services and providers
- No results → "No pros here yet" + logged as `search.no_results`

### C5. Provider profile
- Name, photo, verified badge, rating, jobs done, area
- Services with hourly rates
- Portfolio images
- Reviews
- Open hours for the next 14 days
- **Book** button

### C6. Request a booking
1. Choose service
2. Pick date (next 14 days)
3. Pick start time (only open hours shown)
4. Pick hours (1–8, limited by consecutive open hours)
5. Confirm address, add note (optional)
6. Review summary: rate × hours + convenience fee + GST = estimate; "You pay after the job"
7. **Send request** → status `Requested`
8. Confirmation screen: "Waiting for {provider} to accept. Expires in 6 h."

The slot is **not** held. If another request for the same hours is accepted first, this one is auto-declined ("Slot no longer available").

### C7. Bookings
- Tabs: Upcoming (Requested, Accepted, Upcoming, In Progress) · Past (Completed, Paid, Reviewed, Disputed) · Cancelled (Declined, Expired, Cancelled)
- Detail: status, timeline, provider, date / time / hours, address, price, actions

Actions by status:

| Status | Customer actions |
| --- | --- |
| Requested | Cancel request, chat |
| Accepted / Upcoming | Cancel (fee if < 4 h), chat |
| In Progress | Chat |
| Completed | **Pay now**, raise dispute |
| Paid | Review, raise dispute (within 48 h) |
| Reviewed | View receipt |

### C8. Chat
- Opens from booking detail
- Available from Requested until 7 days after Paid
- Text and images; read ticks; phone numbers auto-masked

### C9. Pay
1. Provider marks complete → push "Job done. Pay ₹X"
2. Payment screen: breakdown, any extra hours added by provider (customer must confirm)
3. Razorpay Checkout (UPI / card / netbanking)
4. Success → status `Paid` → review prompt
5. Failure → stays `Completed`, retry; reminders at 2 h, 24 h, 72 h

### C10. Review
- 1–5 stars, optional text, optional tags (On time, Skilled, Friendly, Value)
- Submitting → status `Reviewed`; editable for 7 days

### C11. Dispute
1. From booking detail: **Report a problem**
2. Pick reason, describe, add photos
3. Status → `Disputed`; ticket created; provider payout held
4. Support replies in the ticket thread; outcome shown in booking

### C12. Profile
- Name, phone, email, saved addresses, payment history, notifications settings, help, log out, delete account

---

## Provider app

### P1. Onboarding (7 steps)
Login: phone → OTP → name.

| Step | Screen | Required |
| --- | --- | --- |
| 1 | Profile: display name, photo, about, base area, service radius (km), languages | name, photo, area |
| 2 | Categories: choose categories | ≥ 1 |
| 3 | Services and rates: per category pick up to **5** services; set hourly rate within admin min / max | ≥ 1 service |
| 4 | Availability: 24-hour grid per weekday (tap or drag hours on / off); presets "9 to 5", "Clear" | ≥ 1 hour |
| 5 | Portfolio and documents: photos of work; ID (Aadhaar / PAN), address proof; bank account / UPI | ID, bank |
| 6 | Preview: see public profile as customers will | — |
| 7 | Publish | — |

After publish: profile is live with "Verification pending"; admins review documents. Verified providers get a badge and rank higher.

### P2. Dashboard
- Pending requests (with countdown to expiry)
- Today's jobs
- This week's earnings, next payout
- Acceptance rate, rating

### P3. Requests
- Card: customer first name, service, date, time, hours, area, distance, note, estimated earnings
- **Accept** → `Accepted`; hours locked on the grid; overlapping pending requests auto-declined
- **Decline** → choose reason (Fully booked, Outside area, Needs specialist, Rate too low, Personal emergency) → `Declined`
- No action → `Expired` at deadline

### P4. Job day
1. `Upcoming` starts 24 h before start time (reminder push)
2. **Start job** (enabled 30 min before start) → `In Progress`
3. **Mark complete** → confirm actual hours (can add hours; customer approves at payment) → `Completed`
4. Customer pays → `Paid` → earnings credited to next payout

### P5. Availability
- Weekly 24-hour grid: 7 rows × 24 hour cells
- Tap cell toggles; drag selects a range
- Booked hours show the booking and cannot be toggled
- Date overrides: block a specific date (holiday) or open extra hours
- Changes save instantly and update the customer app

### P6. Services and rates
- List by category; each service: rate, published toggle
- Add service (max 5 per category)
- Edit rate (must be within admin min / max); applies to new requests only
- Delete blocked while the service has live bookings

### P7. Earnings
- Per-booking earnings: amount − commission − GST on commission
- Payouts: weekly list with status (Scheduled, Processing, Paid, Failed, On hold)
- Bank / UPI details (change requires OTP)

### P8. Reviews and profile
- Reviews received with rating breakdown; reply once per review
- Edit profile, categories, portfolio
- Public profile preview

### P9. Chat
Same as C8, from the provider side.

---

## Cross-app sync moments

| Action | Customer sees | Provider sees | Admin sees |
| --- | --- | --- | --- |
| Customer sends request | "Waiting" | New request card + push | `booking.requested` |
| Provider accepts | "Accepted" + push | Job on calendar | `booking.accepted` |
| Provider declines | "Declined" + reason | Removed | `booking.declined` |
| Request expires | "Expired" + suggestions | Removed | `request.expired` |
| Provider starts | "In progress" | Timer | `booking.started` |
| Provider completes | "Pay now" | "Awaiting payment" | `booking.completed` |
| Customer pays | Receipt | Earnings updated | `payment.captured` |
| Rate changed | New rate on profile | — | `rate.changed` |
| Hours toggled | Open hours change | — | `slot.opened` / `slot.closed` |
| Admin cancels | "Cancelled by AAWRO" + reason | Same | Audit entry |
