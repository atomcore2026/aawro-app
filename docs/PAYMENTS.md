# AAWRO — Payments, Refunds, Payouts

Provider: **Razorpay**. Provider settlement via **RazorpayX Payouts** to bank account or UPI.

## Checkout in Expo Go

Expo Go cannot load `react-native-razorpay` (custom native code). v1 uses Razorpay's **hosted checkout**:

1. API creates the Razorpay Order and returns `checkoutUrl` → a page on `pay.aawro.in/:orderId` (served by the API or the Next.js app) that runs Razorpay Standard Checkout JS.
2. App opens it with `expo-web-browser` (`openAuthSessionAsync`) and a return URL `aawro://pay/return?bookingId=…`.
3. On return, the app calls `GET /bookings/:id` (and listens for `payment.updated`); the webhook is the source of truth.

When the team moves to an EAS development build, swap step 1–2 for `react-native-razorpay` with the same order id; nothing else changes.

## Principle

The customer pays **after** the provider marks the job complete. No card is saved or pre-authorised at request time.

## Price breakdown (defaults)

| Line | Formula | Example (₹500/hr × 2 h) |
| --- | --- | --- |
| Service amount | rate × hours | ₹1,000.00 |
| Convenience fee | flat | ₹29.00 |
| GST on convenience fee | 18% | ₹5.22 |
| Coupon discount | per coupon (on service amount) | — |
| **Customer pays** | | **₹1,034.22** |
| Commission | 15% of service amount | ₹150.00 |
| GST on commission | 18% | ₹27.00 |
| **Provider receives** | service − commission − GST | **₹823.00** |

All values in paise; rounding half-up at each line. Coupon cost is borne by AAWRO (provider payout unaffected).

## Collection flow

```
Provider: complete ─▶ API: COMPLETED, amount final
Customer: Pay now ─▶ POST /bookings/:id/pay ─▶ API creates Razorpay Order (receipt = booking code, notes.bookingId)
App opens hosted checkout ─▶ handler posts to POST /payments/verify (signature check) ─▶ redirect to aawro://pay/return ─▶ UI shows Paid
Razorpay ─▶ POST /webhooks/razorpay payment.captured ─▶ API: payment CAPTURED, booking PAID (idempotent)
```

- Orders use `payment_capture: 1` (auto-capture).
- One active order per booking; a new `/pay` call reuses it if unpaid and < 15 min old.
- Webhook signature: HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET`; events deduplicated by `event.id`.
- Failed payments keep the booking COMPLETED; reminders at +2 h, +24 h, +72 h; after 72 h the customer account gets `payment_hold` (cannot create new requests) and Support is alerted.

## Cancellation fees

- Customer cancels < 4 h before start: 20% of service amount.
- Because nothing is collected upfront, the fee is added as a **due** on the customer's account and collected at their next payment (or via a pay link sent by SMS).
- 80% of a collected fee goes to the provider as compensation, 20% to AAWRO.

## Refunds

| Case | Who | Amount |
| --- | --- | --- |
| Dispute resolved — full | Admin (Support / Finance) | Customer total |
| Dispute resolved — partial | Admin | Entered amount ≤ customer total |
| Duplicate payment | Finance | Duplicate amount |
| Admin cancel after payment | Admin | Customer total |

- `POST /admin/bookings/:id/refund` → Razorpay Refund API (`speed: normal`), `refunds` document, `auditLogs` entry.
- Provider payout is reduced by the refunded service share; if already paid out, the amount is deducted from the next payout (negative balance carried forward).
- Refunds > ₹5,000 need Finance or Super Admin.

## Payouts

| Setting | Default |
| --- | --- |
| Schedule | Weekly, Monday 10:00 IST, covers Mon–Sun of the previous week |
| Eligible bookings | PAID / REVIEWED and dispute window (48 h) closed and not DISPUTED |
| Minimum | ₹500 (smaller balances roll over) |
| Method | IMPS to bank, or UPI |

Flow:
1. BullMQ cron creates batch `BATCH-W{week}` with one `payouts` document per provider with `items[]` per booking.
2. Finance reviews and clicks **Run batch** (reason; second approval above ₹5 lakh).
3. API calls RazorpayX `POST /payouts` per provider with `reference_id = payout.code`, idempotency key = payout id.
4. Webhooks `payout.processed` / `payout.failed` / `payout.reversed` update status; provider gets push.
5. Failed payouts can be retried after the provider fixes bank details.

Bank account: added in onboarding; verified by a ₹1 penny-drop via RazorpayX Fund Account Validation; name must match profile.

## Invoices and tax

- Customer receives a GST invoice for the convenience fee and a receipt for the service on behalf of the provider.
- Provider monthly statement: bookings, commission, GST on commission, payouts.
- TDS under section 194-O (1%) on provider gross, where applicable; shown on statements.
- Records kept 8 years.

## Reconciliation

Daily job compares the Razorpay settlements report with the `payments`, `refunds` and `payouts` collections; mismatches appear in Admin → Payments → Exceptions.
