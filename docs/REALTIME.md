# AAWRO — Realtime

NestJS WebSocket gateway using Socket.IO, namespace `/rt`, with `@socket.io/redis-adapter` so events fan out across API instances.

## Connection

```ts
io(`${WS_URL}/rt`, { auth: { token: accessToken }, transports: ['websocket'] })
```
- Gateway verifies the JWT on `handshake`; invalid → disconnect with `UNAUTHENTICATED`.
- On token refresh the client reconnects with the new token.
- Server auto-joins rooms on connect.

## Rooms

| Room | Joined by | Purpose |
| --- | --- | --- |
| `user:{userId}` | Every customer / provider on connect | Personal events, notifications |
| `booking:{bookingId}` | Client emits `booking.join`; server checks the user is a party | Chat, typing, status for an open booking screen |
| `provider:{providerId}:public` | Customers viewing a profile (`provider.watch`) | Rate and open-hours changes |
| `admin` | All admins on connect | Live activity |
| `admin:booking:{id}` | Admin viewing a booking | Detail updates |

## Server → client events

| Event | Room(s) | Payload |
| --- | --- | --- |
| `booking.updated` | `user:{customer}`, `user:{provider}`, `booking:{id}`, `admin:booking:{id}` | `{ id, status, version, actions, changedBy, reason? }` |
| `booking.requested` | `user:{provider}` | booking summary + `expiresAt` |
| `message.new` | `booking:{id}`, `user:{other party}` | `{ id, bookingId, senderRole, body, attachmentUrl, createdAt, clientId }` |
| `message.read` | `booking:{id}` | `{ bookingId, upToId, by }` |
| `typing` | `booking:{id}` | `{ bookingId, by }` |
| `notification.new` | `user:{id}` | notification document |
| `provider.rates` | `provider:{id}:public` | `{ providerServiceId, hourlyRate, published }` |
| `provider.hours` | `provider:{id}:public` | `{ date, hours[] }` for changed dates |
| `payment.updated` | `user:{customer}`, `user:{provider}` | `{ bookingId, status }` |
| `payout.updated` | `user:{provider}` | `{ payoutId, status }` |
| `activity` | `admin` | `{ id, type, actor, actorType, bookingId?, text, at }` |
| `kpi.tick` | `admin` | dashboard counters every 15 s |

Activity `type` values: `booking.requested`, `booking.accepted`, `booking.declined`, `booking.cancelled`, `booking.started`, `booking.completed`, `payment.captured`, `payment.failed`, `review.posted`, `chat.message`, `slot.opened`, `slot.closed`, `rate.changed`, `service.published`, `category.added`, `search.no_results`, `customer.signup`, `provider.signup`, `docs.uploaded`, `request.expired`.

## Client → server events

| Event | Payload | Ack |
| --- | --- | --- |
| `booking.join` / `booking.leave` | `{ bookingId }` | `{ ok }` or `FORBIDDEN` |
| `provider.watch` / `provider.unwatch` | `{ providerId }` | `{ ok }` |
| `typing` | `{ bookingId }` | — (throttled 1 / 3 s) |
| `admin.booking.watch` | `{ bookingId }` | `{ ok }` |

Messages are **sent over REST** (`POST /bookings/:id/messages`) for durability; the socket only delivers. The client shows the message immediately with its `clientId` and replaces it on `message.new`.

## How events are produced

1. Service layer commits the DB transaction (e.g. accept booking).
2. It appends to `booking.timeline` and inserts an `outbox` document in the same MongoDB transaction.
3. An outbox relay (BullMQ worker) publishes to the gateway and to Expo Push.
4. Push goes only to users with no active socket in `booking:{id}` (avoid double alerts).

The relay polls `outbox` where `sentAt: null` (or tails a change stream on `outbox`), emits, then sets `sentAt`. This guarantees no event is emitted for a rolled-back change and no committed change is missed.

## Reconnect and consistency

- On reconnect, the client refetches open screens via TanStack Query (`invalidateQueries`) — the socket is a hint, REST is the truth.
- Each `booking.updated` carries `version`; clients ignore events older than what they hold.
- Chat refetch uses `?after=<lastMessageId>`.

Admin (Next.js) uses the same socket client inside a client component (`'use client'`) mounted in the dashboard layout.

## Client handling (React Native)

```ts
socket.on('booking.updated', (e) => {
  queryClient.setQueryData(['booking', e.id], (b) => b && b.version < e.version ? { ...b, ...e } : b);
  queryClient.invalidateQueries({ queryKey: ['bookings'] });
});
```
