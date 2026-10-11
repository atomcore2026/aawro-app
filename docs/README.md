# AAWRO

An hourly local-services marketplace for India. Customers find, book and pay verified local professionals by the hour. Providers list services and hourly rates, set availability, and accept or decline booking requests. AAWRO staff run the platform from an admin console.

## Applications

| App | Users | Built with | Purpose |
| --- | --- | --- | --- |
| Customer app | Customers | React Native + Expo (Expo Go in development) | Explore, request bookings, chat, pay after the job, review |
| Provider app | Service providers | React Native + Expo (Expo Go in development) | Onboarding, services and rates, availability, requests, earnings |
| Admin console | AAWRO staff | Next.js (App Router) + Tailwind CSS | Live activity, bookings, disputes, payouts, verification, reports, audit |
| API | All apps | NestJS (TypeScript) | Single backend; the only link between the apps |
| Database | — | MongoDB (replica set) | All data |

A user picks a role once at the shared entry screen. Neither mobile app offers role switching.

## Core rules

- A booking is a **request**. The provider accepts or declines. The slot stays open to others until accepted. Unanswered requests expire after 6 hours.
- **Pay after service.** Nothing is charged upfront; the customer pays once the provider marks the job complete.
- **Fixed hourly rates.** No bidding.
- **Max 5 services per category** per provider.
- **24-hour availability grid** per weekday. Accepted bookings lock their hours.
- **Chat is scoped to a booking.**
- **Every admin action needs a reason** and is written to the audit log.

## Booking statuses

`Requested → Accepted → Upcoming → In Progress → Completed → Paid → Reviewed`
Branches: `Declined`, `Expired`, `Cancelled`, `Disputed`. Details in [BOOKING-LIFECYCLE.md](BOOKING-LIFECYCLE.md).

## Tech stack

| Layer | Choice |
| --- | --- |
| Mobile apps | React Native, Expo SDK, Expo Router, TypeScript; run in **Expo Go** during development |
| Mobile data | TanStack Query (server state), Zustand (UI state), `socket.io-client` |
| Admin console | Next.js 14+ (App Router), Tailwind CSS, TypeScript, TanStack Query / Table, `socket.io-client` |
| API | NestJS 10, REST (JSON), OpenAPI via `@nestjs/swagger`, `class-validator` |
| Database | MongoDB 7 (replica set, for transactions and change streams), Mongoose via `@nestjs/mongoose` |
| Realtime | NestJS WebSocket gateway (Socket.IO) + Redis adapter |
| Jobs and timers | BullMQ on Redis (request expiry, reminders, payout batches) |
| Auth | Phone OTP (MSG91) for customers and providers; email + password + TOTP for admins; JWT access + refresh |
| Files | S3-compatible storage (AWS S3 / Cloudflare R2), presigned uploads |
| Payments | Razorpay (hosted Checkout in Expo Go; native SDK in a dev build), RazorpayX Payouts |
| Push | Expo Push Notifications |
| Hosting | API on AWS (ECS) or Render/Railway; MongoDB Atlas; Redis (Upstash / ElastiCache); admin on Vercel |
| Monitoring | Sentry, Pino logs |

### Expo Go constraint

Expo Go only runs libraries bundled in the Expo SDK. Anything with custom native code (for example `react-native-razorpay`) does not run in Expo Go. v1 therefore opens Razorpay's hosted checkout in `expo-web-browser` / `react-native-webview`. When native modules are needed, switch to an Expo **development build** (EAS) with no code changes elsewhere.

## Repository layout

```
/apps
  /customer          Expo app (customer)
  /provider          Expo app (provider)
  /admin             Next.js + Tailwind admin console
  /api               NestJS API
/packages
  /shared            Types, enums (statuses, roles), zod schemas, pricing, formatters
  /api-client        Typed REST + socket client generated from OpenAPI
  /ui-native         Shared React Native components and tokens
/api/src/seed        30 categories, 300 services, sample providers
/docs                This documentation
/prototype           HTML design prototype
```

## Prototype

Browser prototype with in-memory sample data; a reload resets it.

| File | What it is |
| --- | --- |
| `AAWRO.dc.html` | App prototype: customer and provider phones side by side on one shared store |
| `AAWROApp.dc.html` | App screens (child of the app prototype) |
| `AAWRO Admin.dc.html` | Admin console prototype |
| `AdminBlocks.dc.html` | Admin building blocks (child of the admin prototype) |
| `aawro-data.js` | 30 categories, 300 services, 106 providers, seed bookings, chat |
| `admin-data.js` | Admin sample data: bookings, customers, payments, payouts, tickets, audit log, settings |
| `aawro-images.js` | Image references |

## Local setup

```bash
pnpm install
docker compose up -d                 # mongo (single-node replica set), redis
pnpm --filter api seed               # catalogue + sample providers
pnpm --filter api start:dev          # http://localhost:3000, Swagger at /docs
pnpm --filter customer start         # scan QR with Expo Go
pnpm --filter provider start         # scan QR with Expo Go
pnpm --filter admin dev              # http://localhost:3001
```

`docker-compose.yml` runs Mongo with `--replSet rs0` (transactions need a replica set).

### Environment — API (`apps/api/.env`)

```
MONGODB_URI=mongodb://localhost:27017/aawro?replicaSet=rs0
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAYX_ACCOUNT_NUMBER=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
EXPO_ACCESS_TOKEN=
SENTRY_DSN=
```

### Environment — Expo apps

```
EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000
EXPO_PUBLIC_WS_URL=ws://<your-LAN-IP>:3000
```
Use the machine's LAN IP, not `localhost`, so the phone running Expo Go can reach the API.

### Environment — Admin (`apps/admin/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## Documentation

| Doc | Covers |
| --- | --- |
| [PRD.md](PRD.md) | Problem, users, goals, scope, metrics |
| [FLOWS.md](FLOWS.md) | Customer and provider flows |
| [BOOKING-LIFECYCLE.md](BOOKING-LIFECYCLE.md) | Statuses, transitions, timers |
| [DATA-MODEL.md](DATA-MODEL.md) | MongoDB collections, fields, indexes |
| [API.md](API.md) | REST endpoints |
| [REALTIME.md](REALTIME.md) | Socket rooms and events |
| [PERMISSIONS.md](PERMISSIONS.md) | Roles, guards, ownership rules |
| [ADMIN.md](ADMIN.md) | Console modules, audit trail |
| [PAYMENTS.md](PAYMENTS.md) | Razorpay, fees, refunds, payouts |
| [LOCATION.md](LOCATION.md) | Areas, radius matching |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Tokens, components, screen inventory |
| [DECISIONS.md](DECISIONS.md) | Decision log |
| [ROADMAP.md](ROADMAP.md) | Phases to launch |
| [TESTING.md](TESTING.md) | Test plan and cases |
| [LEGAL-AND-STORE.md](LEGAL-AND-STORE.md) | Privacy policy, terms, compliance, Play Store and App Store submission |
