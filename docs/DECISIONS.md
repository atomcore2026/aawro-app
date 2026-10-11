# AAWRO — Decision Log

| # | Date | Decision | Why | Alternatives considered |
| --- | --- | --- | --- | --- |
| D1 | 2026-09 | Two separate mobile apps (customer, provider) on one backend; role fixed at sign-up | Each side has a different job; no confusion from role switching | One app with a role toggle |
| D2 | 2026-09 | A booking is a **request** the provider must accept | Providers keep control of their time; avoids no-shows from auto-booked jobs | Instant booking |
| D3 | 2026-09 | The slot is **not held** while a request is pending; first accepted wins and overlapping requests auto-decline | Keeps calendars open; customers can send several requests | Hold slot for the requester |
| D4 | 2026-09 | Requests expire after 6 h (or 1 h before start) | Customers get a fast answer; drives provider responsiveness | 24 h, no expiry |
| D5 | 2026-09 | **Pay after service** | Builds trust in a new marketplace; matches how local services are paid in India | Upfront payment, deposit |
| D6 | 2026-09 | Fixed hourly rates, no bidding | Simple to compare; fast to book | Quotes / bids |
| D7 | 2026-09 | Admin sets min / max rate per service | Prevents unrealistic prices | Free pricing |
| D8 | 2026-10 | Max **5 services per category** per provider | Keeps profiles focused and search relevant | Unlimited; max 3 categories (earlier prototype) |
| D9 | 2026-10 | Availability is a **24-hour grid** per weekday, whole hours | Easy to set and understand; matches hourly pricing | Per-slot start / length controls (earlier prototype) |
| D10 | 2026-10 | 11 booking statuses incl. separate UPCOMING, PAID, REVIEWED, EXPIRED, DISPUTED | Each needs distinct UI and admin reporting | 6 statuses |
| D11 | 2026-09 | Chat only inside a booking | Keeps conversations tied to a job; reduces off-platform deals | Open messaging |
| D12 | 2026-09 | Verification is a badge, not a gate | Faster supply growth; customers can choose verified only | Block until verified |
| D13 | 2026-10 | Every admin action requires a reason and is audited | Accountability; dispute evidence | Optional notes |
| D14 | 2026-10 | Backend: **NestJS** + PostgreSQL/PostGIS + Prisma + Redis/BullMQ + Socket.IO | Team TypeScript skills across stack; full control of business rules and jobs | Supabase (earlier plan) |
| D15 | 2026-10 | Frontend: **React Native (Expo)** for both apps; admin on Expo web | One codebase skill set, shared components | Native apps; Next.js admin |
| D16 | 2026-10 | Realtime: REST is the source of truth; sockets push changes; outbox pattern | No lost or phantom events | Socket-only |
| D17 | 2026-10 | Money in paise integers | No floating-point errors | Decimal rupees |
| D18 | 2026-10 | Payments via Razorpay; payouts via RazorpayX weekly | Indian methods (UPI) and payouts in one provider | Cashfree, Stripe |
| D19 | 2026-10 | Location matching by provider radius (PostGIS `ST_DWithin`) | Providers decide how far they travel | Fixed area lists only |
| D20 | 2026-10 | Product name **AAWRO** (formerly SKILLX) | Branding | — |

| D21 | 2026-10 | Database: **MongoDB** (replica set) with Mongoose; supersedes the Postgres part of D14 | Team preference; flexible documents for provider profiles and catalogue | PostgreSQL + PostGIS |
| D22 | 2026-10 | Double booking prevented with a `slotLocks` collection (unique provider + hour) inside transactions | MongoDB has no range-exclusion constraint | Application-only checks |
| D23 | 2026-10 | Location via MongoDB `2dsphere` + `$geoNear`; supersedes PostGIS in D19 | Same radius rule on the chosen database | PostGIS |
| D24 | 2026-10 | Admin console: **Next.js + Tailwind CSS**; supersedes the Expo-web part of D15 | Desktop tables, SSR auth middleware, Vercel deploys | Expo web |
| D25 | 2026-10 | Mobile development in **Expo Go**; Razorpay via hosted checkout until a dev build is needed | Fast iteration with no native builds | EAS dev build from day one |

Add new decisions at the bottom with the next number. Do not edit past rows; supersede them with a new row.
