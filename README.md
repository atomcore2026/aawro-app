# aawro-app

Mobile app built with React Native + Expo (runs in Expo Go).

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS). Your phone
and computer must be on the same Wi-Fi network.

## Backend URL

The app talks to the NestJS backend (`aawro-nestjs-backend`). By default it uses
your dev machine's LAN IP detected from the Expo dev server,
`http://<LAN-IP>:3000/api`, because `localhost` on a phone is the phone itself.
To override it, create `.env` from `.env.example` and set `EXPO_PUBLIC_API_URL`.

## Demo accounts

Run `npm run seed` in `aawro-nestjs-backend` first. Without MSG91 keys the
backend accepts the OTP **123456** for any number.

| Role | Phone | Notes |
| --- | --- | --- |
| Customer | 98110 42207 | Has bookings in every state, chats and notifications |
| Provider | 98730 11455 | Raj Plumbing Services: requests waiting, calendar, earnings |

Any other number creates a new account. A new provider goes through onboarding.

## How it's built

One Expo app for both roles. The entry screen picks customer or provider, and
the role is stored on the account (decision D26).

- `src/app/`: Expo Router routes. `(customer)/` and `(provider)/` are the two
  tab groups. Stack screens (provider profile, booking flow, booking detail,
  chat, payment, review, help, availability, services…) sit at the top level.
- `src/lib/`: API client with token refresh (`api.ts`), session (`auth.tsx`),
  Socket.IO realtime (`socket.ts`), TanStack Query hooks (`queries.ts`),
  formatting (₹ in paise, IST dates) and design tokens (`theme.ts`).
- `src/components/`: the UI kit (`ui.tsx`) and shared cards and lists.

Payments use the backend's built-in test gateway unless Razorpay keys are set
on the server.

To run in a browser: `npx expo start --web`. Set `EXPO_PUBLIC_API_URL=http://localhost:3000/api`.

## Scripts

```bash
npm start            # expo start
npm run android      # open on Android
npm run ios          # open on iOS
npx tsc --noEmit     # typecheck
npx expo install <pkg>  # add SDK-compatible packages
```

## Product documentation

Product and design specs for AAWRO (PRD, flows, booking lifecycle, data model,
API, realtime, payments, admin, design system and more) live in
[`docs/`](docs/README.md). The same `docs/` folder is kept in the
`aawro-nestjs-backend`, `aawro-admin` and `aawro-app` repos.
