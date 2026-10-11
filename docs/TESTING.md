# AAWRO — Testing

## Strategy

| Level | Tool | Scope |
| --- | --- | --- |
| Unit | Jest | Services: pricing, status machine, availability math, permissions |
| Integration | Jest + `mongodb-memory-server` (replica set mode) or Testcontainers (Mongo, Redis) | API endpoints against a real MongoDB |
| Contract | OpenAPI schema check | API client matches server |
| Realtime | socket.io-client in Jest | Events reach the right rooms |
| E2E mobile | Maestro (on Expo Go, then EAS builds before launch) | Customer and provider critical flows on Android emulator + iOS simulator |
| E2E admin | Playwright | Next.js console flows |
| Load | k6 | Booking create / accept, sockets |
| Payments | Razorpay test mode + webhook replay | Collection, refunds, payouts |

CI gate: unit + integration must pass; coverage ≥ 80% on `bookings`, `payments`, `availability`, `auth`.

## Test cases

### Auth
| ID | Case | Expected |
| --- | --- | --- |
| A1 | Valid OTP | Tokens issued, `isNew` true for first sign-in |
| A2 | Wrong OTP × 3 | Locked 60 s |
| A3 | Customer phone signs in on provider app | 403 ROLE_MISMATCH |
| A4 | Refresh token reused after rotation | All tokens for device revoked |
| A5 | Admin login without TOTP | 401 |

### Catalogue and provider setup
| ID | Case | Expected |
| --- | --- | --- |
| C1 | Add 6th service in one category | 409 SERVICE_LIMIT_REACHED |
| C2 | Rate below service min | 422 RATE_OUT_OF_RANGE |
| C3 | Delete service with an ACCEPTED booking | 409 HAS_LIVE_BOOKINGS |
| C4 | Publish without ID document | 400 with missing steps |
| C5 | Change rate | Customer profile shows new rate live; existing bookings keep snapshot |
| C6 | Toggle booked hour off | Ignored, warning returned |

### Booking
| ID | Case | Expected |
| --- | --- | --- |
| B1 | Request open hours | REQUESTED, provider push, expiry job set |
| B2 | Request closed hours | 409 SLOT_UNAVAILABLE |
| B3 | Request start < 2 h from now | 400 |
| B4 | Two customers request same hours; provider accepts one | Other auto-DECLINED "Slot no longer available" |
| B5 | Two accept calls in parallel for overlapping bookings | Exactly one succeeds (unique `slotLocks`); other 409 SLOT_UNAVAILABLE |
| B6 | No response for 6 h | EXPIRED, customer push with alternatives |
| B7 | Request 3 h before start, no response | Expires at start − 1 h |
| B8 | Customer cancels 5 h before | CANCELLED, fee 0 |
| B9 | Customer cancels 2 h before | CANCELLED, fee 20% added as due |
| B10 | Provider cancels | Reason required; strike +1 |
| B11 | Start 1 h before start time | 409 (allowed from 30 min before) |
| B12 | Complete with extra hours | Amount recalculated; customer sees extra hours to confirm |
| B13 | Decline without reason | 400 |
| B14 | Any disallowed transition (e.g. REQUESTED → COMPLETED) | 409 INVALID_TRANSITION |
| B15 | Stale `version` on accept | 409 VERSION_CONFLICT |
| B16 | Address outside provider radius | 422 OUTSIDE_SERVICE_AREA |
| B17 | Upcoming timer when already cancelled | No-op |

### Payment
| ID | Case | Expected |
| --- | --- | --- |
| P1 | Pay COMPLETED booking | Order created; capture webhook → PAID |
| P2 | Pay before COMPLETED | 409 |
| P3 | Webhook delivered twice | Processed once |
| P4 | Invalid webhook signature | 401, nothing changed |
| P5 | Payment fails | Stays COMPLETED; reminders scheduled |
| P6 | Unpaid 72 h | `payment_hold`; new requests blocked |
| P7 | Price breakdown ₹500 × 2 h | Customer ₹1,034.22; provider ₹823.00 |
| P8 | Full refund on dispute | Refund created; payout excluded |
| P9 | Refund after payout | Negative balance on next payout |
| P10 | Payout batch with disputed booking | Booking excluded, held |
| P11 | Payout fails | Status FAILED; retry works after bank fix |

### Chat and realtime
| ID | Case | Expected |
| --- | --- | --- |
| R1 | Customer sends message | Provider receives `message.new` < 2 s |
| R2 | Message contains phone number | Masked for recipient |
| R3 | Non-party joins `booking:{id}` | FORBIDDEN |
| R4 | Provider accepts | Customer, provider and admin receive `booking.updated` |
| R5 | Client offline during accept, reconnects | Refetch shows ACCEPTED |
| R6 | Old event arrives after newer version | Ignored |
| R7 | Transaction rolls back | No outbox document, no event emitted |
| R8 | Cancel accepted booking | `slotLocks` removed; hours reopen on customer app |

### Reviews and disputes
| ID | Case | Expected |
| --- | --- | --- |
| V1 | Review on PAID | REVIEWED; provider rating updated |
| V2 | Second review | 409 |
| V3 | Dispute at 49 h after completion | 422 DISPUTE_WINDOW_CLOSED |
| V4 | Dispute | DISPUTED, ticket created, payout held |

### Admin
| ID | Case | Expected |
| --- | --- | --- |
| D1 | Cancel without reason | 400 |
| D2 | Cancel with reason | Booking CANCELLED (ADMIN); `auditLogs` entry with before/after; both apps updated |
| D3 | Reassign to provider without the service | 422 |
| D4 | Support role opens Payouts | 403 |
| D5 | Support refund ₹6,000 | 403 (needs Finance) |
| D6 | Change commission as Operations | 403 |
| D7 | Audit document update / delete attempt with the API's Mongo user | Mongo rejects (insert/find-only role) |
| D8 | View document | Signed URL expires in 60 s; `pii.view` audited |

### Location
| ID | Case | Expected |
| --- | --- | --- |
| L1 | Provider 7 km away, radius 8 km | Listed |
| L2 | Provider 9 km away, radius 8 km | Not listed |
| L3 | Disabled area | No providers; banner "Coming soon" |

## Mobile E2E flows (Maestro)

1. Customer: sign up → Explore → provider → request → (provider accepts via API) → see Accepted
2. Provider: sign up → onboarding 7 steps → publish
3. Provider: accept request → start → complete
4. Customer: pay (Razorpay test UPI `success@razorpay`) → review
5. Customer: cancel within 4 h → fee shown
6. Two devices: chat both ways

## Non-functional

| Test | Target |
| --- | --- |
| k6: 50 req/s booking create + accept for 10 min | p95 < 300 ms, 0 double bookings |
| 500 concurrent sockets | Event delivery < 2 s p95 |
| Cold start, mid-range Android | < 3 s |
| Accessibility (screen reader pass on critical flows) | All controls labelled |

## Test data

Seed: 30 categories, 300 services, 106 providers across multiple Indian cities, 1 test customer (`+91 90000 00001`, OTP `123456` in staging only), bookings in every status.
