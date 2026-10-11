# AAWRO — Roadmap

| Phase | Weeks | Outcome |
| --- | --- | --- |
| 0. Prototype | done | Clickable customer, provider and admin prototypes |
| 1. Foundations | 1–3 | Monorepo, NestJS API skeleton, DB schema, auth, CI/CD |
| 2. Catalogue and providers | 4–6 | Provider onboarding, services, availability live |
| 3. Booking core | 7–10 | Request → accept → complete end to end, chat, realtime |
| 4. Payments | 11–13 | Pay after service, refunds, payouts |
| 5. Admin console | 9–14 (parallel) | All modules on live API, audit |
| 6. Location | 12–14 | MongoDB `$geoNear` matching and ranking |
| 7. Beta | 15–18 | 100 providers, 500 customers in pilot cities |
| 8. Launch | 19–20 | Public launch in India on Play Store and App Store |

## Phase 1 — Foundations
- pnpm monorepo: `apps/customer`, `apps/provider` (Expo), `apps/admin` (Next.js + Tailwind), `apps/api` (NestJS), `packages/shared`, `packages/ui-native`, `packages/api-client`
- NestJS modules scaffold, config, Pino logging, Sentry, health check
- MongoDB Atlas (staging, prod) + local replica set; Mongoose schemas and indexes for all collections in DATA-MODEL.md; seed script (30 categories, 300 services)
- Auth: OTP (MSG91), JWT, refresh rotation; admin login with TOTP
- Expo apps (Expo Router) running in Expo Go with navigation, theme tokens, API client
- Next.js admin shell: login, layout, sidebar, Tailwind tokens
- CI: lint, typecheck, unit tests, index sync check; API deploy to staging; admin preview deploys on Vercel; EAS Update for Expo Go testers

## Phase 2 — Catalogue and providers
- Catalogue endpoints, Explore three levels, search
- Provider onboarding 7 steps, file uploads, documents
- Services (5 per category limit, rate range)
- 24-hour availability grid + overrides; open-hours endpoint

## Phase 3 — Booking core
- Quote and create request; accept / decline / cancel / start / complete
- `slotLocks` + transactions, optimistic locking, auto-decline overlaps
- BullMQ timers: expiry, upcoming, reminders, no-show
- Socket.IO gateway, rooms, outbox relay; Expo push
- Chat with masking; notifications inbox

## Phase 4 — Payments
- Razorpay orders, hosted checkout via `expo-web-browser`, webhooks, reminders, payment hold
- Reviews, disputes and tickets
- Refunds; RazorpayX fund account validation; weekly payout batches
- Invoices, statements, reconciliation job

## Phase 5 — Admin console
- Dashboard, live activity, bookings with actions, disputes, customers, providers, verification
- Catalogue, reviews, payments, refunds, payouts, coupons, campaigns
- Reports + CSV, settings, team and permissions, audit log

## Phase 6 — Location
- Geocoding, GeoJSON points, provider radius
- `$geoNear` matching, ranking score, distance in UI
- Search-gap report by area

## Phase 7 — Beta
- Recruit and verify 100 providers across top 10 categories
- Load test (500 concurrent sockets, 50 req/s)
- Security review, penetration test, DPDP checklist
- Fix list from beta feedback

## Phase 8 — Launch
- Move from Expo Go to EAS production builds (native Razorpay SDK optional)
- Legal pages, store listings, Data safety / App Privacy forms, reviewer accounts (see LEGAL-AND-STORE.md)
- Support rota and SLAs
- Monitoring dashboards and on-call

## After launch (v1.1+)
Hindi language · recurring bookings · provider teams · in-app calling with masked numbers · wallet and credits · more cities · provider subscription for featured placement
