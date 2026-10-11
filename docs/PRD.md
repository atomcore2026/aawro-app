# AAWRO — Product Requirements

## 1. Problem

People across India find local help (tutors, trip planners, photographers, cleaners, plumbers, assistants) through word of mouth and WhatsApp groups. Prices are unclear, availability is unknown until you call, and there is no recourse when a job goes wrong. Skilled independents have no simple way to publish their rates and calendar or get paid reliably.

## 2. Product

A marketplace where customers book verified professionals **by the hour** at published rates, and pay only after the job is done.

## 3. Users

| User | Needs |
| --- | --- |
| Customer | Find the right person fast, see real rates and open hours, book without calls, pay safely, get help if it goes wrong |
| Provider | Get steady work in their area, control their hours, set their own rates, get paid weekly |
| Admin (Super Admin, Operations, Support, Finance) | See everything live, intervene on bookings, resolve disputes, verify providers, run payouts, report |

## 4. Goals (first 6 months after launch)

| Goal | Metric | Target |
| --- | --- | --- |
| Liquidity | Requests accepted | ≥ 70% |
| Speed | Median time to accept | ≤ 30 min |
| Reliability | Completed of accepted | ≥ 90% |
| Trust | Disputes per 100 completed | ≤ 3 |
| Payment | Paid within 24 h of completion | ≥ 95% |
| Quality | Average rating | ≥ 4.5 |
| Supply | Active verified providers | 1,000 |
| Coverage | Searches with zero results | ≤ 10% |

## 5. Scope — v1

### Customer app
- Phone OTP sign-up, name, address and area
- Home: greeting, popular categories, featured providers, promos
- Explore: three levels — categories → services → providers
- Search by service name with suggestion chips
- Provider profile: services and rates, portfolio, reviews, verified badge, open hours
- Booking request: service, date, start time, hours, address, note; price estimate
- Bookings list by status; booking detail with timeline
- Chat per booking
- Cancel (free until 4 h before start; 20% fee after)
- Pay after completion (UPI, card, netbanking)
- Review (1–5 stars + text)
- Raise a dispute within 48 h of completion
- Notifications (push + in-app)
- Profile, saved addresses

### Provider app
- Phone OTP sign-up
- 7-step onboarding: profile → categories → services and rates (max 5 per category) → availability → portfolio and documents → preview → publish
- Dashboard: today's jobs, pending requests, earnings this week
- Requests: accept or decline (with reason) before expiry
- Booking actions: start, complete, cancel (with reason)
- Availability: 24-hour grid per weekday, plus date-specific blocks
- Services: add, edit rate, publish / unpublish, delete (blocked if live bookings)
- Chat per booking
- Earnings: per booking, weekly payouts, bank account
- Reviews received; public profile preview

### Admin console
- Dashboard KPIs; live activity stream
- Bookings: search, filter by status, detail, cancel / refund / reassign (reason required)
- Disputes and support tickets
- Customers, providers, verification queue
- Catalogue: categories, services, min / max hourly rates
- Reviews moderation
- Payments, refunds, payouts
- Coupons and notifications
- Reports and CSV export
- Settings: commission, GST, fees, expiry, cancellation, areas, payout schedule
- Admin team, roles and permissions; audit log

## 6. Out of scope for v1

- Bidding or price negotiation
- Upfront payment or deposits
- Multi-provider teams on one booking
- Recurring bookings
- In-app calling
- Provider-to-provider subcontracting
- Wallet / stored credit

## 7. Business rules (defaults, editable in admin Settings)

| Rule | Value |
| --- | --- |
| Commission | 15% of service amount |
| GST | 18% on commission and convenience fee |
| Convenience fee (customer) | ₹29 per booking |
| Request expiry | 6 hours, or 1 hour before start, whichever is sooner |
| Free cancellation | Until 4 hours before start |
| Late cancellation fee | 20% of service amount |
| Max services per category | 5 |
| Dispute window | 48 hours after completion |
| Payout schedule | Weekly (Monday), minimum ₹500 |
| Payouts on disputed bookings | Held until resolved |
| Payment methods | UPI, cards, netbanking (wallet off) |

## 8. Catalogue

30 categories grouped by theme (Personal & Lifestyle, Travel & Experiences, Learn & Grow, Create & Build, Home, Wellness, Events and more), 300 services total, each with a default hourly rate and admin-set min / max.

## 9. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | API p95 < 300 ms; app cold start < 3 s on mid-range Android |
| Realtime | Status and chat updates reach the other app in < 2 s |
| Availability | 99.5% monthly |
| Security | TLS everywhere, JWT with 15-min access token, hashed refresh tokens, OWASP ASVS L2 |
| Privacy | Phone numbers masked between parties; DPDP Act 2023 compliance; data export and deletion on request |
| Accessibility | Touch targets ≥ 44 pt, dynamic type, screen-reader labels |
| Localisation | English v1; Hindi v1.1; INR, IST, `en-IN` number format |
| Offline | Apps show cached data and queue chat messages when offline |

## 10. Legal and store

Privacy Policy, Terms of Service, Provider Terms, Cancellation and Refund Policy, Grievance Redressal, in-app account deletion and consent records are required for launch. Details in [LEGAL-AND-STORE.md](LEGAL-AND-STORE.md).

## 10a. Platforms

| Surface | Stack |
| --- | --- |
| Customer and provider apps | React Native + Expo (Expo Go in development; EAS builds for store release) |
| Admin console | Next.js + Tailwind CSS (web) |
| API | NestJS |
| Database | MongoDB |

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| Providers ignore requests | 6 h expiry, acceptance rate shown in admin and used in ranking |
| Customer skips payment | Payment due screen, reminders, account hold after 72 h |
| Off-platform deals | Masked numbers, chat inside bookings, dispute protection only on-platform |
| Low supply in some areas | Search-gap report in admin drives provider recruitment |
