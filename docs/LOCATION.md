# AAWRO — Location Matching

Status: **planned** (not in the prototype). MongoDB geospatial queries on `2dsphere` indexes.

## Data

| Collection | Field |
| --- | --- |
| `areas` | `centroid` (GeoJSON Point), optional `boundary` (Polygon), `enabled` |
| `users.addresses[]` | `location` Point from geocoding or device GPS |
| `providers` | `baseLocation` Point, `radiusKm` (default 8, range 2–25) |
| `bookings` | `address.location` snapshot |

GeoJSON coordinates are `[longitude, latitude]`.

Areas are grouped by city across India (for example Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad and more). Each area belongs to a `city`. Admins add cities and areas and enable or disable them in Settings.

## Matching rule

A provider is shown to a customer for a service when:
1. Provider `status` is ACTIVE and the service is in `services[]` with `published: true`, and
2. Distance from `baseLocation` to the customer's point ≤ the provider's `radiusKm`, and
3. The customer's area is enabled.

Because each provider has their own radius, the query uses `$geoNear` with a max distance of 25 km (the largest allowed radius), then filters on each provider's radius:

```js
db.providers.aggregate([
  { $geoNear: {
      near: { type: "Point", coordinates: [lng, lat] },
      distanceField: "distanceM", maxDistance: 25000, spherical: true,
      query: { status: "ACTIVE", services: { $elemMatch: { serviceId, published: true } } }
  } },
  { $match: { $expr: { $lte: ["$distanceM", { $multiply: ["$radiusKm", 1000] }] } } },
  { $addFields: { score: <ranking expression> } },
  { $sort: { score: -1 } },
  { $skip: offset }, { $limit: 20 },
  { $project: { displayName: 1, photoUrl: 1, verification: 1, stats: 1, distanceM: 1,
               service: { $first: { $filter: { input: "$services", cond: { $eq: ["$$this.serviceId", serviceId] } } } } } }
])
```
Index: `{ baseLocation: "2dsphere" }` (required by `$geoNear`, which must be the first stage).

Area lookup from a point: `areas.findOne({ boundary: { $geoIntersects: { $geometry: point } } })`, falling back to nearest `centroid`.

## Ranking (default "Recommended")

```
score = 0.35·(ratingAvg / 5) + 0.20·acceptanceRate + 0.15·(1 − distanceM / (radiusKm·1000))
      + 0.10·(verified ? 1 : 0) + 0.10·(1 − cancelRate) + 0.10·hasOpenHoursInNext3Days
```
Featured providers get +0.1. Other sorts: rating, distance, price low → high.

## Where location is used

| Place | Use |
| --- | --- |
| Customer onboarding | Pick area or use GPS (`expo-location`, works in Expo Go) → address with point |
| Home / Explore | Pro counts and "from ₹X" per category for the customer's point (cached 10 min per area) |
| Provider list | Filter + distance shown ("3.2 km") |
| Booking request | Rejected with `OUTSIDE_SERVICE_AREA` if the address is outside the radius |
| Provider request card | Area and distance |
| Admin reports | By-area bookings, GMV, search gaps |

## Geocoding

Google Places Autocomplete + Geocoding API, called from the API (key never shipped in the app). Results cached by place id. Pincode → area mapping as fallback.

## Privacy

- Customers see distance and area, never the provider's exact base location.
- Providers see the customer's area and distance on requests; the full address only after accepting.
