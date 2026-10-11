# AAWRO — Data Model (MongoDB)

MongoDB 7, replica set (required for multi-document transactions and change streams). Schemas defined with Mongoose (`@nestjs/mongoose`). All documents have `_id: ObjectId`, `createdAt`, `updatedAt` (`timestamps: true`). Money is stored in **paise** as integers. Times are UTC `Date`; displayed in IST.

## Collections

```
users ──────────── addresses (embedded)
providers ─────────┬─ services[] (embedded provider services)
                   ├─ availability (embedded weekly grid)
                   ├─ portfolio[] (embedded)
                   └─ documents[] (embedded)
availabilityOverrides
categoryGroups ── categories ── services (catalogue)
bookings ─┬─ timeline[] (embedded events)
          ├─ messages (separate)
          ├─ payments ── refunds
          ├─ reviews
          └─ tickets ── ticketMessages
slotLocks
payouts
admins · rolePermissions · auditLogs · notifications · devices · otpCodes · refreshTokens
coupons · couponRedemptions · searchLogs · areas · settings · outbox · webhookEvents
```

**Embed vs reference.** Data read with its parent and bounded in size is embedded (addresses, provider services ≤ 150, weekly grid, portfolio, documents, booking timeline). Unbounded or independently queried data is a separate collection (messages, payments, reviews, audit logs).

## Enums (`packages/shared`)

```ts
UserRole        = 'CUSTOMER' | 'PROVIDER'
BookingStatus   = 'REQUESTED' | 'ACCEPTED' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'REVIEWED'
                | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'DISPUTED'
ActorType       = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SYSTEM'
Verification    = 'PENDING' | 'VERIFIED' | 'REJECTED'
ProviderStatus  = 'DRAFT' | 'ACTIVE' | 'SUSPENDED'
PaymentStatus   = 'CREATED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
PayoutStatus    = 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'ON_HOLD'
TicketStatus    = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'
AdminRole       = 'SUPER_ADMIN' | 'OPERATIONS' | 'SUPPORT' | 'FINANCE'
```

---

## users

```js
{
  _id, phone: "+919811042207",            // unique
  role: "CUSTOMER",                       // fixed at sign-up
  name: "Ananya Sharma", email: null,
  status: "ACTIVE",                       // ACTIVE | BLOCKED | DELETED
  addresses: [{
    _id, label: "Home", line1: "B-42, Second Floor", line2: "Greater Kailash 1",
    areaId: ObjectId, pincode: "110048",
    location: { type: "Point", coordinates: [77.2373, 28.5494] },   // [lng, lat]
    isDefault: true
  }],
  paymentHold: false,                     // unpaid > 72 h
  dueAmount: 0,                           // unpaid cancellation fees (paise)
  lastSeenAt
}
```
Indexes: `{ phone: 1 }` unique · `{ role: 1, createdAt: -1 }` · `{ "addresses.location": "2dsphere" }`.

## providers

One per provider user (`userId` = users._id).

```js
{
  _id, userId,                            // unique
  code: "PR-2001",                        // unique
  displayName: "Raj Plumbing Services", about, photoUrl,
  baseLocation: { type: "Point", coordinates: [lng, lat] },
  baseAreaId, radiusKm: 8, languages: ["Hindi", "English"],
  status: "ACTIVE", verification: "PENDING", rejectReason: null,
  featured: false, onboardingStep: 7, publishedAt,
  categoryIds: ["plumbing", "electrical-repair"],
  services: [{                            // max 5 per categoryId
    _id, serviceId: "pipe-repair", categoryId: "plumbing",
    hourlyRate: 45000, published: true
  }],
  availability: {                         // weekly 24-h grid; arrays of open hours 0–23
    mon: [9,10,11,12,14,15,16], tue: [...], wed: [...], thu: [...], fri: [...], sat: [...], sun: []
  },
  portfolio: [{ _id, imageUrl, caption, categoryId, sort }],
  documents: [{ _id, type: "AADHAAR", fileKey, status: "PENDING", reviewedBy, reviewedAt, note }],
  bank: { type: "UPI", upiId, accountLast4, ifsc, holderName, razorpayFundAccountId, verified },
  stats: { ratingAvg: 4.8, ratingCount: 132, jobsCompleted: 210, acceptanceRate: 0.86, cancelRate: 0.02, strikes: 0 }
}
```
Indexes: `{ userId: 1 }` unique · `{ code: 1 }` unique · `{ baseLocation: "2dsphere" }` · `{ status: 1, "services.serviceId": 1, "services.published": 1 }` · `{ verification: 1, publishedAt: 1 }`.

Validation: the service layer rejects a 6th `services` entry for one `categoryId` (`SERVICE_LIMIT_REACHED`); a JSON-schema validator on the collection is the backstop for rate ranges.

## availabilityOverrides

```js
{ _id, providerId, date: "2026-10-14", hours: [], reason: "Diwali" }
```
Replaces the weekly grid for that date. Index `{ providerId: 1, date: 1 }` unique.

## categoryGroups / categories / services (catalogue)

```js
// categoryGroups
{ _id: "travel", name: "Travel & Trip Planning", sort: 2 }
// categories (_id is a slug)
{ _id: "trip-planner", groupId: "travel", name: "Trip Planner", imageUrl, sort, enabled: true }
// services
{ _id: "itinerary-planning", categoryId: "trip-planner", name: "Itinerary planning",
  unit: "hour", defaultRate: 60000, minRate: 30000, maxRate: 150000, enabled: true }
```
30 categories, 300 services in seed. Index `services: { categoryId: 1 }`.

## bookings

```js
{
  _id, code: "BK-2411",                   // unique
  customerId, providerId,                 // providers._id
  serviceId: "ac-service", categoryId, providerServiceId,
  status: "REQUESTED",
  startAt, endAt, hours: 2, actualHours: null,
  pricing: {                              // snapshot, paise
    hourlyRate: 50000, serviceAmount: 100000, convenienceFee: 2900, convenienceGst: 522,
    discount: 0, customerTotal: 103422, commission: 15000, commissionGst: 2700, providerPayout: 82300
  },
  address: { line1, line2, areaId, pincode, location: { type: "Point", coordinates } },   // snapshot
  note: "Two split ACs in the bedrooms",
  expiresAt,
  acceptedAt, startedAt, completedAt, paidAt, reviewedAt, cancelledAt,
  cancelledBy: null, reason: null, cancelFee: 0,
  couponId: null,
  paymentStatus: "NOT_DUE",               // NOT_DUE | DUE | PAID | ON_HOLD | REFUNDED
  timeline: [{ from: null, to: "REQUESTED", actorType: "CUSTOMER", actorId, reason: null, at }],
  adminNotes: [{ adminId, text, at }],
  version: 1                              // optimistic lock
}
```
Indexes: `{ code: 1 }` unique · `{ providerId: 1, startAt: 1 }` · `{ customerId: 1, createdAt: -1 }` · `{ status: 1, expiresAt: 1 }` · `{ status: 1, createdAt: -1 }` (admin lists) · `{ "address.areaId": 1, createdAt: -1 }`.

Status changes use `findOneAndUpdate({ _id, status: <from>, version }, { $set, $inc: { version: 1 }, $push: { timeline } })` inside a transaction.

## slotLocks (double-booking guard)

MongoDB has no range-exclusion constraint, so held hours are materialised one document per provider-hour.

```js
{ _id, providerId, hourStart: ISODate("2026-10-13T05:30:00Z"), bookingId }
```
Index `{ providerId: 1, hourStart: 1 }` **unique**. Accepting a 3-hour booking inserts 3 locks in the accept transaction; a duplicate-key error means the hours are taken (`SLOT_UNAVAILABLE`). Locks are deleted on cancel and when the booking leaves `IN_PROGRESS`.

## messages

```js
{ _id, bookingId, senderId, senderRole: "CUSTOMER", body, attachmentUrl, clientId, readAt, createdAt }
```
Indexes: `{ bookingId: 1, createdAt: 1 }` · `{ bookingId: 1, clientId: 1 }` unique (dedupe retries).

## payments / refunds

```js
// payments
{ _id, bookingId, razorpayOrderId, razorpayPaymentId, amount, method: "UPI",
  status: "CAPTURED", failReason, capturedAt }
// refunds
{ _id, paymentId, bookingId, amount, reason, razorpayRefundId, status, adminId }
```
Indexes: `payments: { razorpayOrderId: 1 } unique, { bookingId: 1 }` · `refunds: { bookingId: 1 }`.

## reviews

```js
{ _id, bookingId, customerId, providerId, rating: 5, text, tags: ["On time"], reply, hidden: false, hiddenReason }
```
Indexes: `{ bookingId: 1 }` unique · `{ providerId: 1, createdAt: -1 }`.

## tickets / ticketMessages

```js
{ _id, code: "TK-9120", kind: "DISPUTE", bookingId, openedBy: { type, id }, subject, description,
  priority: "HIGH", status: "OPEN", assigneeId, resolution: { outcome, amount, reason }, firstReplyAt }
{ _id, ticketId, authorType, authorId, body, attachments: [], internal: false, createdAt }
```

## payouts

```js
{ _id, code: "PO-40211", providerId, batch: "BATCH-W40", periodStart, periodEnd,
  items: [{ bookingId, amount }], adjustments: [{ reason, amount }],
  amount, status: "SCHEDULED", razorpayPayoutId, failReason, paidAt }
```
Indexes: `{ batch: 1, status: 1 }` · `{ providerId: 1, createdAt: -1 }`.

## admins / rolePermissions

```js
{ _id, name, email, passwordHash, totpSecret, role: "OPERATIONS", status: "ACTIVE", lastActiveAt }
{ _id: "OPERATIONS", areas: ["Dashboard", "Live activity", "Bookings", ...] }
```

## auditLogs

```js
{ _id, adminId, adminName, action: "booking.cancel", targetType: "booking", targetId,
  before: {...}, after: {...}, reason: "Customer reported fraud", ip, createdAt }
```
Append-only: the API's Mongo user has `insert` and `find` only on this collection (custom role). Indexes `{ targetType: 1, targetId: 1, createdAt: -1 }`, `{ adminId: 1, createdAt: -1 }`.

## Supporting collections

| Collection | Shape | Notes |
| --- | --- | --- |
| `notifications` | `{ userId, kind, title, body, bookingId, readAt }` | Index `{ userId: 1, createdAt: -1 }` |
| `devices` | `{ userId, expoPushToken, platform, lastSeenAt }` | Unique on token |
| `otpCodes` | `{ phone, codeHash, attempts, expiresAt }` | TTL index on `expiresAt` |
| `refreshTokens` | `{ subjectId, subjectType, tokenHash, deviceId, expiresAt, revokedAt }` | TTL on `expiresAt` |
| `coupons` | `{ code, type, value, maxDiscount, minAmount, categoryId, startsAt, endsAt, usageLimit, perUserLimit, used, active }` | Unique `code` |
| `couponRedemptions` | `{ couponId, userId, bookingId, amount }` | |
| `searchLogs` | `{ userId, query, categoryId, areaId, results, createdAt }` | TTL 180 days; feeds demand-vs-supply |
| `areas` | `{ name, city, centroid: Point, boundary: Polygon?, enabled }` | `2dsphere` on centroid and boundary |
| `settings` | single doc `_id: "platform"` | see below |
| `outbox` | `{ type, payload, rooms, createdAt, sentAt }` | Written in same transaction as the change; relay emits events |
| `webhookEvents` | `{ _id: <razorpay event id>, type, receivedAt }` | Dedupe; TTL 30 days |

### settings (`_id: "platform"`)

```js
{ platformName: "AAWRO", supportEmail: "help@aawro.in", supportPhone: "+91 11 4123 9900", country: "IN",
  commissionPct: 15, gstPct: 18, convenienceFee: 2900,
  requestExpiryH: 6, freeCancelH: 4, cancelFeePct: 20, maxServicesPerCategory: 5, disputeWindowH: 48,
  payoutSchedule: "WEEKLY", payoutMin: 50000, holdDisputes: true,
  methods: { upi: true, card: true, netbanking: true, wallet: false } }
```

## Transactions

Use a session transaction for any write touching more than one document:
- accept booking (booking + slotLocks + auto-decline overlaps + outbox)
- complete / cancel (booking + slotLocks + outbox)
- payment captured (payment + booking + outbox)
- refund (refund + booking + payout adjustment + auditLog + outbox)
- every admin mutation (target + auditLog + outbox)
