# skiil-app

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
`aawro-nestjs-backend`, `aawro-admin` and `skiil-app` repos.
