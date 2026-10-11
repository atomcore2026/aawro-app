# AAWRO — Roles and Permissions

Access is enforced in the NestJS API (guards + service-layer ownership checks). The API connects to MongoDB with a least-privilege user (`readWrite` on the `aawro` database, plus a custom role that allows only `insert` and `find` on `auditLogs`). No other client talks to the database.

## Principals

| Principal | Auth | Token claims |
| --- | --- | --- |
| Customer | Phone OTP | `sub`, `role: CUSTOMER` |
| Provider | Phone OTP | `sub`, `role: PROVIDER`, `providerStatus` |
| Admin | Email + password + TOTP | `sub`, `kind: ADMIN`, `adminRole` |
| System | Internal (jobs, webhooks) | n/a |

Access token 15 min; mobile apps store the refresh token in `expo-secure-store` (works in Expo Go); the admin console keeps it in an httpOnly, Secure, SameSite=Strict cookie set by the API. Refresh token 30 days (users) / 12 h (admins), rotated on use, stored hashed, revocable per device.

## Guards

| Guard | Use |
| --- | --- |
| `JwtAuthGuard` | All non-public routes |
| `RolesGuard` + `@Roles('CUSTOMER')` | Role-only routes |
| `ActiveProviderGuard` | Provider routes needing status ACTIVE (e.g. accept) |
| `BookingPartyGuard` | `/bookings/:id/*` — caller is the customer or provider on the booking |
| `AdminGuard` + `@Permission('Bookings')` | Admin routes, checked against `rolePermissions` |
| `ReasonRequiredPipe` | Admin mutations — rejects missing / short `reason` |
| `RazorpaySignatureGuard` | Webhook route |

## Customer

| Resource | Read | Write |
| --- | --- | --- |
| Own profile, addresses | ✓ | ✓ |
| Catalogue, public provider profiles, reviews | ✓ | — |
| Own bookings | ✓ | create, cancel, pay, dispute, review |
| Messages on own bookings | ✓ | ✓ (until 7 days after PAID) |
| Provider phone / exact address | ✗ (masked) | — |
| Other customers | ✗ | ✗ |

## Provider

| Resource | Read | Write |
| --- | --- | --- |
| Own profile, services, availability, portfolio, documents, bank | ✓ | ✓ |
| Own bookings | ✓ | accept, decline, start, complete, cancel |
| Customer on own booking | first name, area; full address only from ACCEPTED until 24 h after COMPLETED | — |
| Messages on own bookings | ✓ | ✓ |
| Own earnings, payouts | ✓ | — |
| Reviews about self | ✓ | reply once |
| Own documents after upload | metadata only | replace |

Suspended providers can sign in and see bookings but cannot accept new ones and are hidden from search.

## Admin roles

| Area | Super Admin | Operations | Support | Finance |
| --- | --- | --- | --- | --- |
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Live activity | ✓ | ✓ | ✓ | |
| Bookings | ✓ | ✓ | ✓ | |
| Disputes & Support | ✓ | ✓ | ✓ | |
| Customers | ✓ | ✓ | ✓ | |
| Providers | ✓ | ✓ | ✓ | |
| Verification | ✓ | ✓ | | |
| Categories & Services | ✓ | ✓ | | |
| Reviews | ✓ | ✓ | ✓ | |
| Payments | ✓ | | | ✓ |
| Payouts | ✓ | | | ✓ |
| Refunds | ✓ | | ✓ | ✓ |
| Coupons & Promotions | ✓ | | | |
| Notifications | ✓ | | | |
| Reports | ✓ | ✓ | | ✓ |
| Settings | ✓ | | | |
| Admin Team & Roles | ✓ | | | |
| Audit Log | ✓ | | | |

Super Admin can edit this matrix in the console (`rolePermissions` collection); changes are audited.

### Extra limits

| Action | Rule |
| --- | --- |
| Refund > ₹5,000 | Finance or Super Admin |
| Payout batch run | Finance or Super Admin; second Finance/Super Admin approval above ₹5 lakh |
| Change commission / fees | Super Admin only |
| View provider documents | Signed URL, 60 s, logged |
| Export CSV with phone numbers | Super Admin only; others get masked columns |

## Data protection

- Phone numbers shown to the other party as `+91 98••• ••207`.
- Chat bodies are scanned and phone / email patterns masked.
- Document files in a private bucket, encrypted at rest (SSE-KMS).
- PII access by admins is logged to `auditLogs` with action `pii.view`.
- Account deletion: anonymise user, keep bookings and payments for 8 years (tax records).
