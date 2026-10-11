# AAWRO — API (NestJS)

Base URL `https://api.aawro.in/v1`. JSON over HTTPS. Auth: `Authorization: Bearer <access_token>`. OpenAPI at `/docs`.

## Conventions

- Ids are MongoDB ObjectId strings (24 hex); catalogue ids are slugs (`trip-planner`).

- Money in paise (integer). Times ISO 8601 with offset; displayed in IST.
- Pagination: `?cursor=&limit=` (default 20, max 100) → `{ items, nextCursor }`.
- Errors: `{ "error": { "code": "INVALID_TRANSITION", "message": "...", "details": {} } }`.
- Idempotency: `Idempotency-Key` header on all `POST` that create or move money or status.
- Rate limits: OTP 5 / hour / phone; general 120 / min / user.

| HTTP | Codes |
| --- | --- |
| 400 | VALIDATION_FAILED |
| 401 | UNAUTHENTICATED, OTP_INVALID, TOKEN_EXPIRED |
| 403 | FORBIDDEN, ROLE_MISMATCH |
| 404 | NOT_FOUND |
| 409 | INVALID_TRANSITION, SLOT_UNAVAILABLE, SERVICE_LIMIT_REACHED, HAS_LIVE_BOOKINGS, VERSION_CONFLICT |
| 422 | RATE_OUT_OF_RANGE, OUTSIDE_SERVICE_AREA, DISPUTE_WINDOW_CLOSED |
| 429 | RATE_LIMITED |

## NestJS modules

Each module owns its Mongoose schemas (`MongooseModule.forFeature`). Modules:

`AuthModule`, `UsersModule`, `CatalogModule`, `ProvidersModule`, `AvailabilityModule`, `SearchModule`, `BookingsModule`, `ChatModule`, `PaymentsModule`, `PayoutsModule`, `ReviewsModule`, `TicketsModule`, `NotificationsModule`, `AdminModule`, `AuditModule`, `SettingsModule`, `RealtimeModule` (gateway), `JobsModule` (BullMQ processors), `FilesModule`.

---

## Auth

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/otp/request` | `{ phone, role }` | `{ retryAfter: 30 }` |
| POST | `/auth/otp/verify` | `{ phone, code, role, device: { pushToken, platform } }` | `{ accessToken, refreshToken, user, isNew }` |
| POST | `/auth/refresh` | `{ refreshToken }` | new token pair (rotation) |
| POST | `/auth/logout` | `{ refreshToken }` | 204 |
| POST | `/admin/auth/login` | `{ email, password, totp }` | `{ accessToken, refreshToken, admin }` |

`role` on verify must match an existing account's role, else `403 ROLE_MISMATCH`.

## Me

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` | user + profile |
| PATCH | `/me` | name, email |
| GET/POST/PATCH/DELETE | `/me/addresses[/:id]` | customer |
| DELETE | `/me` | account deletion request |
| GET | `/me/notifications` | paginated |
| POST | `/me/notifications/read` | `{ ids }` |

## Catalogue (public)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/catalog/groups` | groups with categories, pro count and min rate for `?areaId=` |
| GET | `/catalog/categories/:id/services` | services with price ranges |
| GET | `/catalog/home?areaId=` | popular, featured providers, promos |

## Search

`GET /search?q=&areaId=&lat=&lng=` → `{ services: [...], providers: [...] }`. Zero results are logged to `search_logs`.

`GET /services/:serviceId/providers?lat=&lng=&date=&verified=&maxRate=&sort=rating|distance|price` →
```json
{ "items": [{ "id": "…", "displayName": "Raj Plumbing Services", "photoUrl": "…", "verified": true,
  "rating": 4.8, "ratingCount": 132, "distanceKm": 3.2, "hourlyRate": 45000, "nextOpen": "2026-10-11T09:00:00+05:30" }] }
```

## Providers (public)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/providers/:id` | profile, services, portfolio, rating summary |
| GET | `/providers/:id/reviews` | paginated |
| GET | `/providers/:id/open-hours?from=&days=14` | `{ "2026-10-11": [9,10,11,14,15], … }` (open minus held bookings) |

## Provider self-service (role PROVIDER)

| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/provider/me` | profile + onboarding step |
| PATCH | `/provider/me` | displayName, about, photo, baseLocation, radiusKm, languages |
| PUT | `/provider/categories` | `{ categoryIds }` |
| GET | `/provider/services` | |
| POST | `/provider/services` | `{ serviceId, hourlyRate }` → 409 `SERVICE_LIMIT_REACHED` past 5 per category; 422 `RATE_OUT_OF_RANGE` |
| PATCH | `/provider/services/:id` | `{ hourlyRate?, published? }` |
| DELETE | `/provider/services/:id` | 409 `HAS_LIVE_BOOKINGS` |
| GET | `/provider/availability` | `{ weekly: { "0": [9,10,…], … }, overrides: [...] }` |
| PUT | `/provider/availability/weekly` | `{ weekday, hours: number[] }`; booked hours ignored with warning |
| PUT | `/provider/availability/overrides/:date` | `{ hours, reason }` |
| DELETE | `/provider/availability/overrides/:date` | |
| POST | `/provider/portfolio` | `{ fileKey, caption }` |
| DELETE | `/provider/portfolio/:id` | |
| POST | `/provider/documents` | `{ type, fileKey }` |
| PUT | `/provider/bank-account` | `{ type, … , otp }` |
| POST | `/provider/publish` | validates steps 1–5 → status ACTIVE, verification PENDING |
| GET | `/provider/dashboard` | pending, today, weekEarnings, nextPayout, acceptanceRate, rating |
| GET | `/provider/earnings?from=&to=` | per-booking lines |
| GET | `/provider/payouts` | |
| POST | `/reviews/:id/reply` | `{ text }` once |

## Files

`POST /files/upload-url` `{ kind: "avatar|portfolio|document|chat", contentType }` → `{ uploadUrl, fileKey }` (S3 presigned PUT, 5 min). Documents go to a private bucket.

## Bookings

| Method | Path | Who | Body |
| --- | --- | --- | --- |
| POST | `/bookings/quote` | Customer | `{ providerServiceId, startAt, hours, couponCode? }` → price breakdown |
| POST | `/bookings` | Customer | `{ providerServiceId, startAt, hours, addressId, note?, couponCode? }` → 201 booking (REQUESTED) |
| GET | `/bookings?status=&role=` | Both | own bookings |
| GET | `/bookings/:id` | Party / Admin | booking + timeline |
| POST | `/bookings/:id/accept` | Provider | `{ version }` |
| POST | `/bookings/:id/decline` | Provider | `{ reason }` |
| POST | `/bookings/:id/cancel` | Customer / Provider | `{ reason }` → includes `cancelFee` |
| POST | `/bookings/:id/start` | Provider | — |
| POST | `/bookings/:id/complete` | Provider | `{ actualHours }` |
| POST | `/bookings/:id/dispute` | Customer | `{ reason, description, attachments[] }` → ticket |

Example booking:
```json
{
  "id": "6716f2c1a9e4b2d1c0f3a811", "code": "BK-2411", "status": "REQUESTED",
  "provider": { "id": "…", "displayName": "CoolTech AC Services" },
  "service": { "id": "ac-service", "name": "AC Service" },
  "startAt": "2026-10-13T11:00:00+05:30", "hours": 2,
  "hourlyRate": 50000, "serviceAmount": 100000, "convenienceFee": 2900, "gst": 522,
  "customerTotal": 103422, "expiresAt": "2026-10-10T18:00:00+05:30",
  "actions": ["cancel", "chat"], "version": 1
}
```
`actions` is computed server-side for the caller so apps never hard-code transition rules.

## Chat

| Method | Path | Body |
| --- | --- | --- |
| GET | `/bookings/:id/messages?cursor=` | |
| POST | `/bookings/:id/messages` | `{ body?, attachmentKey?, clientId }` |
| POST | `/bookings/:id/messages/read` | `{ upToId }` |

Server masks phone numbers and emails in `body`.

## Payments

| Method | Path | Body / notes |
| --- | --- | --- |
| POST | `/bookings/:id/pay` | Customer; status COMPLETED → `{ razorpayOrderId, amount, keyId, checkoutUrl }` (`checkoutUrl` = hosted page opened in Expo Go) |
| POST | `/payments/verify` | `{ razorpayOrderId, razorpayPaymentId, signature }` → optimistic PAID |
| POST | `/webhooks/razorpay` | `payment.captured`, `payment.failed`, `refund.processed`, `payout.processed`, `payout.failed` (HMAC verified) |
| GET | `/me/payments` | customer history + invoices |

Webhook is the source of truth; `/payments/verify` gives fast UI feedback.

## Reviews

`POST /bookings/:id/review` `{ rating, text?, tags? }` (status PAID). `PATCH /reviews/:id` within 7 days.

## Tickets (customer / provider)

`GET /tickets`, `POST /tickets` `{ subject, description, bookingId? }`, `GET /tickets/:id`, `POST /tickets/:id/messages`.

---

## Admin API (`/admin/*`, admin JWT + permission guard)

Every mutating admin endpoint requires `reason` (min 10 chars) and writes an `auditLogs` document.

| Area | Endpoints |
| --- | --- |
| Dashboard | `GET /admin/dashboard` (KPIs), `GET /admin/activity?cursor=&types=` |
| Bookings | `GET /admin/bookings?status=&q=&from=&to=&area=`, `GET /admin/bookings/:id`, `POST /admin/bookings/:id/cancel {reason, refund?}`, `POST /admin/bookings/:id/reassign {providerId, reason}`, `POST /admin/bookings/:id/refund {amount, reason}`, `POST /admin/bookings/:id/note {text}` |
| Tickets | `GET /admin/tickets`, `PATCH /admin/tickets/:id {status, priority, assigneeId}`, `POST /admin/tickets/:id/messages {body, internal}`, `POST /admin/tickets/:id/resolve {outcome: NO_REFUND|PARTIAL|FULL, amount?, reason}` |
| Customers | `GET /admin/customers`, `GET /admin/customers/:id`, `POST /admin/customers/:id/block {reason}` / `unblock` |
| Providers | `GET /admin/providers`, `GET /admin/providers/:id`, `POST …/suspend {reason}`, `…/reinstate`, `…/feature {featured, reason}` |
| Verification | `GET /admin/verification?status=PENDING`, `POST /admin/verification/:providerId/approve {reason}`, `…/reject {reason}`, `GET /admin/documents/:id/url` (signed, 60 s) |
| Catalogue | CRUD `/admin/catalog/groups`, `/categories`, `/services` (incl. `minRate`, `maxRate`) |
| Reviews | `GET /admin/reviews?rating=&hidden=`, `POST /admin/reviews/:id/hide {reason}` / `unhide` |
| Payments | `GET /admin/payments`, `GET /admin/refunds`, `GET /admin/invoices/:paymentId` (PDF) |
| Payouts | `GET /admin/payouts?batch=&status=`, `POST /admin/payouts/run {batch, reason}`, `POST /admin/payouts/:id/retry {reason}`, `POST …/hold` / `release` |
| Coupons | CRUD `/admin/coupons` |
| Notifications | `GET/POST /admin/campaigns {title, body, channel: PUSH|SMS|EMAIL, audience, scheduleAt}` |
| Reports | `GET /admin/reports/{gmv,top-services,leaderboard,areas,search-gaps,reasons}?from=&to=`, `?format=csv` |
| Settings | `GET /admin/settings`, `PATCH /admin/settings {…, reason}` |
| Team | `GET/POST /admin/team` (invite), `PATCH /admin/team/:id {role, status}`, `GET/PUT /admin/roles/:role/permissions` |
| Audit | `GET /admin/audit?adminId=&targetType=&targetId=&from=&to=` |
