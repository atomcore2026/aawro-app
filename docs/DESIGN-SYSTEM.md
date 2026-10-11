# AAWRO — Design System

## Direction

White / blue / professional for the mobile apps. Clean white cards on a light blue-grey ground, one action blue, green for verified and confirmed. Real photography per category.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `color.bg` | `#f4f7fb` | App background |
| `color.surface` | `#ffffff` | Cards, sheets |
| `color.text` | `#0f172a` | Primary text |
| `color.textMuted` | `#64748b` | Secondary text |
| `color.border` | `#e2e8f0` | Dividers, inputs |
| `color.primary` | `#2563eb` | Buttons, links, selection |
| `color.primaryPressed` | `#1d4ed8` | Pressed |
| `color.primarySoft` | `#eff6ff` | Tinted fills |
| `color.success` | `#16a34a` | Verified, accepted, paid |
| `color.warning` | `#d97706` | In progress, payment due |
| `color.danger` | `#dc2626` | Disputed, errors |
| `color.neutral` | `#94a3b8` | Declined, expired, cancelled |
| `radius.sm / md / lg / pill` | 8 / 12 / 16 / 999 | |
| `space` | 4, 8, 12, 16, 20, 24, 32 | |
| `shadow.card` | `0 1px 2px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.04)` | |

### Type (Inter)

| Style | Size / line | Weight |
| --- | --- | --- |
| Display | 28 / 34 | 800 |
| Title | 20 / 26 | 700 |
| Heading | 17 / 22 | 600 |
| Body | 15 / 22 | 400 |
| Caption | 13 / 18 | 500 |
| Kicker | 11 / 14, uppercase, letter-spacing 1.5 | 700 |

Respect system font scaling up to 1.3×.

## Admin console (Next.js + Tailwind)

The same tokens map into `tailwind.config.ts`:

```ts
theme: { extend: {
  colors: { bg: '#f4f7fb', surface: '#ffffff', ink: '#0f172a', muted: '#64748b', line: '#e2e8f0',
            primary: { DEFAULT: '#2563eb', pressed: '#1d4ed8', soft: '#eff6ff' },
            success: '#16a34a', warning: '#d97706', danger: '#dc2626', neutral: '#94a3b8' },
  borderRadius: { sm: '8px', md: '12px', lg: '16px' },
  fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
  boxShadow: { card: '0 1px 2px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.04)' } } }
```

Admin components (`apps/admin/components`): `Sidebar`, `TopBar`, `DataTable`, `FilterBar`, `StatCard`, `StatusBadge`, `Timeline`, `ReasonDialog` (required reason), `Drawer`, `Tabs`, `Toast`, `EmptyState`, `Chart`, `PermissionMatrix`. Density: 14 px body, 40 px table rows.

## Mobile components (`packages/ui-native`)

| Component | Variants |
| --- | --- |
| `Button` | primary, secondary, ghost, danger; sm / md / lg; loading |
| `IconButton` | — |
| `Input`, `OtpInput`, `PhoneInput`, `TextArea` | error state |
| `Chip` | filter, suggestion, selected |
| `StatusBadge` | one per booking status (colours in BOOKING-LIFECYCLE.md) |
| `Card` | flat, elevated |
| `ProviderCard` | compact (list), large (featured) |
| `CategoryTile` | image, pro count, from-price |
| `ServiceRow` | name, rate, published toggle |
| `BookingCard` | customer view, provider view |
| `Timeline` | booking events |
| `HourGrid` | 7 × 24, tap / drag, booked cells locked |
| `DatePicker` (14-day strip), `TimeSlotPicker`, `HoursStepper` | |
| `PriceBreakdown` | |
| `RatingStars` | display, input |
| `ChatBubble`, `ChatComposer` | |
| `Sheet`, `Dialog`, `Toast` | |
| `EmptyState` | |
| `StepProgress` | onboarding 1–7 |
| `Avatar` | image, initials |
| `TabBar` | customer: Home, Explore, Bookings, Chat, Profile; provider: Dashboard, Requests, Calendar, Earnings, Profile |

Icons: Lucide (`lucide-react-native` on mobile, `lucide-react` on admin), 20 / 24 px. Inter loads with `expo-font` / `@expo-google-fonts/inter` (Expo Go compatible) and `next/font` on admin.
Touch targets ≥ 44 × 44 pt.

## Screen inventory

### Customer
Splash · Entry · Phone · OTP · Name · Address · Home · Search · Explore categories · Explore services · Provider list · Provider profile · Portfolio viewer · Reviews · Book: service · Book: date and time · Book: hours and address · Book: summary · Request sent · Bookings · Booking detail · Chat · Pay · Payment success · Review · Report a problem · Ticket · Notifications · Profile · Addresses · Payments history · Settings · Help

### Provider
Entry · Phone · OTP · Name · Onboarding 1 Profile · 2 Categories · 3 Services and rates · 4 Availability · 5 Portfolio and documents · 6 Preview · 7 Publish · Dashboard · Requests · Request detail · Bookings / Calendar · Booking detail · Start / complete job · Chat · Availability grid · Date overrides · Services · Edit service · Earnings · Payouts · Bank account · Reviews · Public profile preview · Notifications · Profile · Settings

### Admin
Login · Dashboard · Live activity · Bookings · Booking detail · Disputes & Support · Ticket · Customers · Customer detail · Providers · Provider detail · Verification · Categories & Services · Reviews · Payments · Refunds · Payouts · Coupons · Notifications · Reports · Settings · Admin team · Audit log

## Imagery

Photography per category group, provider hero and portfolio. Lazy-load with `expo-image` (Expo Go compatible) and blurhash placeholders; `next/image` on admin.

## Motion

200 ms ease-out for sheets and status changes; status badge cross-fades on realtime updates. Respect Reduce Motion.
