# AAWRO — Booking Lifecycle

## Statuses

| Status | Meaning | Slot held? | Payment |
| --- | --- | --- | --- |
| `REQUESTED` | Customer sent a request | No | Not due |
| `ACCEPTED` | Provider accepted | Yes | Not due |
| `UPCOMING` | Accepted and starts within 24 h | Yes | Not due |
| `IN_PROGRESS` | Provider started the job | Yes | Not due |
| `COMPLETED` | Provider marked done | — | Due |
| `PAID` | Customer payment captured | — | Paid |
| `REVIEWED` | Customer left a review (terminal) | — | Paid |
| `DECLINED` | Provider declined, or auto-declined (terminal) | No | — |
| `EXPIRED` | No response by deadline (terminal) | No | — |
| `CANCELLED` | Cancelled by customer, provider or admin (terminal) | Released | Fee may apply |
| `DISPUTED` | Customer reported a problem | — | On hold |

## Diagram

```
REQUESTED ──accept──▶ ACCEPTED ──(T-24h)──▶ UPCOMING ──start──▶ IN_PROGRESS ──complete──▶ COMPLETED ──pay──▶ PAID ──review──▶ REVIEWED
    │                    │                     │                     │                         │               │
    ├─decline─▶ DECLINED  ├─cancel─▶ CANCELLED  ├─cancel─▶ CANCELLED  └─admin cancel─▶ CANCELLED ├─dispute─▶ DISPUTED ◀─dispute─┤
    ├─timeout─▶ EXPIRED   │                     │                                               │
    └─cancel──▶ CANCELLED                                                                       └─(admin) resolve ─▶ PAID / CANCELLED (refund)
```

## Transitions

| From | To | Trigger | Who | Conditions | Side effects |
| --- | --- | --- | --- | --- | --- |
| — | REQUESTED | Create | Customer | Hours open on provider grid; service published; provider active; start ≥ 2 h from now | Expiry job scheduled; push to provider |
| REQUESTED | ACCEPTED | Accept | Provider | Hours still free; before deadline | Lock hours; auto-decline overlapping REQUESTED; cancel expiry job |
| REQUESTED | DECLINED | Decline | Provider | Reason required | Push customer |
| REQUESTED | DECLINED | Auto | System | Overlapping request accepted | Reason "Slot no longer available" |
| REQUESTED | EXPIRED | Timer | System | Deadline passed | Push customer with 3 similar providers |
| REQUESTED | CANCELLED | Cancel | Customer | — | No fee |
| ACCEPTED | UPCOMING | Timer | System | 24 h before start | Reminder push both sides |
| ACCEPTED / UPCOMING | CANCELLED | Cancel | Customer | ≥ 4 h before start: no fee; < 4 h: 20% fee | Release hours |
| ACCEPTED / UPCOMING | CANCELLED | Cancel | Provider | Reason required | Release hours; strike on provider record |
| ACCEPTED / UPCOMING | IN_PROGRESS | Start | Provider | From 30 min before start | `started_at` set |
| UPCOMING | CANCELLED | No-show | Customer report / Admin | 30 min past start, not started | Provider strike |
| IN_PROGRESS | COMPLETED | Complete | Provider | Actual hours ≥ booked − 0, ≤ booked + 4 | Amount finalised; payment due push |
| COMPLETED | PAID | Pay | Customer / System | Razorpay `payment.captured` webhook | Earnings recorded; review prompt |
| COMPLETED / PAID | DISPUTED | Dispute | Customer | Within 48 h of completion | Ticket; payout hold |
| PAID | REVIEWED | Review | Customer | Once | Update provider rating |
| DISPUTED | PAID / REVIEWED | Resolve (no refund) | Admin | Reason required | Release payout |
| DISPUTED | CANCELLED | Resolve (full refund) | Admin | Reason required | Refund; no payout |
| DISPUTED | PAID | Resolve (partial refund) | Admin | Amount + reason | Partial refund; adjusted payout |
| Any non-terminal | CANCELLED | Admin cancel | Admin | Reason required | Audit log; refund if paid |

Any other transition returns `409 INVALID_TRANSITION`.

## Timers (BullMQ)

| Job | Scheduled at | Action |
| --- | --- | --- |
| `booking.expire` | create; runs at `min(created + 6 h, start − 1 h)` | REQUESTED → EXPIRED |
| `booking.upcoming` | accept; runs at `start − 24 h` (or now if sooner) | ACCEPTED → UPCOMING |
| `booking.reminder` | accept; `start − 1 h` | Push both sides |
| `booking.noshow_check` | accept; `start + 30 min` | Flag to admin if not started |
| `payment.reminder` | complete; +2 h, +24 h, +72 h | Push / SMS customer |
| `dispute.window_close` | complete; +48 h | Disable dispute; make payout eligible |

All jobs re-check the current status before acting (idempotent).

## Concurrency (MongoDB)

- Accept runs in a MongoDB session transaction:
  1. `findOneAndUpdate({ _id, status: 'REQUESTED', version }, { $set: { status: 'ACCEPTED' }, $inc: { version: 1 } })` — no match → `409 INVALID_TRANSITION` / `VERSION_CONFLICT`.
  2. Insert one `slotLocks` document per booked hour (`{ providerId, hourStart }` unique index). Duplicate-key error → abort → `409 SLOT_UNAVAILABLE`.
  3. Set overlapping REQUESTED bookings to DECLINED ("Slot no longer available").
  4. Insert `outbox` events.
- Cancel / complete delete the booking's `slotLocks` in the same transaction.
- Every booking has a `version` field; all status updates match on it (optimistic locking).
- Transient transaction errors are retried up to 3 times (`withTransaction`).

## Amount calculation

```
service_amount   = hourly_rate × hours           (rate snapshot at request time)
convenience_fee  = 29
gst              = 18% × (commission + convenience_fee)
customer_total   = service_amount + convenience_fee + 18% × convenience_fee
commission       = 15% × service_amount
provider_payout  = service_amount − commission − 18% × commission
```

Extra hours added at completion use the same snapshot rate.

## What each app shows

| Status | Customer label | Provider label | Admin badge |
| --- | --- | --- | --- |
| REQUESTED | Waiting for response · expires in Xh | New request · respond in Xh | Blue |
| ACCEPTED | Confirmed | Confirmed | Indigo |
| UPCOMING | Tomorrow / Today at X | Today at X | Indigo |
| IN_PROGRESS | In progress | In progress · timer | Amber |
| COMPLETED | Pay ₹X | Awaiting payment | Amber |
| PAID | Paid · rate your pro | Paid · ₹X earned | Green |
| REVIEWED | Completed | Completed · ★X | Green |
| DECLINED | Declined · reason | — (hidden) | Grey |
| EXPIRED | No response · see others | — (hidden) | Grey |
| CANCELLED | Cancelled by X · reason | Cancelled by X · reason | Grey |
| DISPUTED | Under review | Under review · payout held | Red |
