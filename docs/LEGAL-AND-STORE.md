# AAWRO — Legal Documents and Store Submission

Everything needed before the customer and provider apps go live on the Google Play Store and the Apple App Store. Legal text must be reviewed by a lawyer before publishing; this doc lists what is required and what each document must cover.

## 1. Legal documents

All documents are hosted as public web pages on `aawro.in` (served by the Next.js app under `/legal/*`), linked from both apps, both store listings and the admin console footer.

| Document | URL | Shown in app |
| --- | --- | --- |
| Privacy Policy | `aawro.in/legal/privacy` | Sign-up screen, Profile → Legal, store listings |
| Terms of Service (customers) | `aawro.in/legal/terms` | Sign-up screen ("By continuing you agree…"), Profile → Legal |
| Provider Terms / Partner Agreement | `aawro.in/legal/provider-terms` | Provider onboarding step 7 (must tick to publish), Profile → Legal |
| Cancellation and Refund Policy | `aawro.in/legal/refunds` | Booking summary, cancel dialog, payment screen |
| Payments and Payout Terms | `aawro.in/legal/payouts` | Provider bank account screen |
| Community Guidelines | `aawro.in/legal/guidelines` | Review screen, chat, provider onboarding |
| Cookie Policy | `aawro.in/legal/cookies` | Website and admin only |
| Grievance Redressal | `aawro.in/legal/grievance` | Profile → Help, footer |
| Account Deletion | `aawro.in/legal/delete-account` | Profile → Delete account; Play Console data-deletion URL |

Each page shows a version number and "Last updated" date. Every acceptance is stored (see §5).

### 1.1 Privacy Policy — must cover
- Who we are: legal entity name, registered address, contact email
- Data collected, by user type:
  - Customers: phone, name, email (optional), addresses, location (with permission), booking history, chat messages, reviews, payment status (card / UPI details stay with Razorpay)
  - Providers: all of the above plus photo, ID documents (Aadhaar / PAN), address proof, bank / UPI details, portfolio images, availability, earnings
  - Device: push token, device model, OS, app version, crash logs, IP address
- Why each is collected (purpose) and the legal basis (consent under the DPDP Act 2023)
- Who it is shared with: the other party on a booking (limited fields, masked phone), Razorpay (payments, payouts), MSG91 (OTP SMS), Expo / Google / Apple (push), Google Maps (geocoding), AWS (hosting and storage), Sentry (crash reports), MongoDB Atlas (database)
- Data is never sold
- Retention: account data until deletion; bookings, invoices and payments 8 years (tax law); chat 1 year after the booking; ID documents until 90 days after the provider leaves; OTP and logs short-term
- User rights: access, correction, deletion, withdraw consent, nominate a person, grievance — and how to use them (in-app and email)
- Children: service not for users under 18
- Security measures (encryption in transit and at rest, access control, audit logs)
- Storage location (India region) and any cross-border transfer
- Grievance Officer / Data Protection contact: name, email, address, response time
- How changes are notified

### 1.2 Terms of Service (customers) — must cover
- AAWRO is a marketplace; the service contract is between customer and provider
- Eligibility (18+, valid Indian phone number)
- Account rules, one account per phone
- Booking is a request; the provider may accept or decline; requests expire
- Pricing: hourly rate × hours, convenience fee, GST; extra hours need customer approval
- Payment after service; consequences of non-payment (account hold)
- Cancellation fees (free until 4 h before start, 20% after)
- Disputes: raise within 48 h; AAWRO's decision process
- Reviews: honest, no abuse; AAWRO may hide reviews that break guidelines
- No off-platform payments for jobs found on AAWRO
- Prohibited use, suspension and termination
- Limitation of liability, indemnity
- Governing law (India) and jurisdiction
- Contact and grievance officer

### 1.3 Provider Terms — must cover
- Independent contractor, not an employee
- Verification and documents; consequences of false documents
- Service quality, safety, punctuality, conduct in customer homes
- Rates within admin min / max; max 5 services per category
- Responding to requests; acceptance rate and strikes
- Commission (15%) and GST on commission; TDS under section 194-O where applicable
- Payout schedule (weekly, minimum ₹500), holds for disputes, negative balances after refunds
- Cancellations by the provider and penalties
- Provider's own tax registration responsibility (GST where turnover requires it)
- Suspension, termination, data after leaving

### 1.4 Cancellation and Refund Policy — must cover
- Customer cancellation windows and fee
- Provider cancellation and no-show handling
- Expired and declined requests (no charge)
- Disputes: outcomes (no refund / partial / full), refund timelines (5–7 working days to source)
- Who to contact

### 1.5 Grievance Redressal
Required by the Consumer Protection (E-Commerce) Rules, 2020 and the IT (Intermediary Guidelines) Rules, 2021:
- Grievance Officer name, designation, email, phone, address
- Acknowledge complaints within 48 hours; resolve within one month
- Complaint can be raised in-app (Help → Raise a complaint) and by email

## 2. Indian compliance checklist

| Requirement | What we do |
| --- | --- |
| DPDP Act 2023 and Rules | Clear notice before collecting data; separate consent for location and marketing; in-app data access, correction and deletion; consent records; breach notification process |
| Consumer Protection (E-Commerce) Rules 2020 | Show provider name, area and verification status; show full price breakdown before request; publish refund and cancellation policy; grievance officer |
| IT Rules 2021 | Grievance officer; remove unlawful content (reviews, chat, portfolio) when notified |
| GST | GSTIN on invoices; GST on convenience fee and commission |
| Income tax (194-O) | TDS on provider gross where applicable; shown on statements |
| RBI / payments | All payments through Razorpay (licensed payment aggregator); no card data stored by AAWRO |
| Aadhaar | Store only masked Aadhaar number; never store full Aadhaar in plain text |

## 3. Google Play Store

| Item | Detail |
| --- | --- |
| Developer account | Organisation account with D-U-N-S number; verified contact details |
| Apps | Two listings: "AAWRO" (customer) and "AAWRO Partner" (provider) |
| Build | Android App Bundle (`.aab`) from EAS Build (Expo Go is only for development); current target API level required by Play |
| Privacy Policy URL | Required in Play Console and inside the app |
| Data safety form | Declare every data type in §1.1, whether shared, whether encrypted in transit, and that users can request deletion |
| Account deletion | In-app deletion **and** a web URL (`/legal/delete-account`) entered in Play Console |
| Permissions | Location (while in use), camera and photos (profile, portfolio, documents, chat images), notifications. No background location. Each has an in-app explanation before the system prompt |
| Content rating | IARC questionnaire |
| Target audience | 18+ |
| Ads declaration | No ads |
| Payments | Physical services paid via Razorpay — allowed outside Google Play Billing |
| App access for review | Test phone number and fixed OTP that work only for the reviewer account; written steps |
| Store listing | App name, short description (80 chars), full description, icon 512×512, feature graphic 1024×500, at least 2 phone screenshots per app, category: Lifestyle (customer) / Business (provider) |
| Testing track | Closed testing before production (personal accounts need 12+ testers for 14 days; organisation accounts are exempt) |

## 4. Apple App Store

| Item | Detail |
| --- | --- |
| Developer account | Apple Developer Program as an organisation (D-U-N-S) |
| Build | `.ipa` from EAS Build, submitted with EAS Submit; TestFlight for beta |
| Privacy Policy URL | Required in App Store Connect and inside the app |
| App Privacy ("nutrition label") | Declare data types linked to the user, used for tracking (none), and purposes |
| App Tracking Transparency | Not needed if no cross-app tracking; do not include tracking SDKs |
| Account deletion | Must be possible inside the app (Profile → Delete account) |
| Sign in with Apple | Not required — we use phone OTP only, no third-party social login |
| Permission strings (`Info.plist`) | `NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` — plain-language reasons, set in `app.json` |
| Payments | Services used outside the app, paid via Razorpay — In-App Purchase not required |
| User-generated content | Chat, reviews and portfolios need: report button, block user, content filtering, published contact — all supported via Support and admin moderation |
| Review notes | Demo account (test phone + fixed OTP), steps to create and accept a booking with both apps |
| Store listing | Name, subtitle (30 chars), description, keywords, support URL, marketing URL, screenshots for 6.7" and 6.5" iPhones, age rating 17+ or 12+ per questionnaire, category: Lifestyle / Business |
| Export compliance | Uses standard HTTPS encryption only (`ITSAppUsesNonExemptEncryption: false`) |

## 5. In-app requirements (both apps)

| Screen | Requirement |
| --- | --- |
| Sign-up | "By continuing you agree to the Terms of Service and Privacy Policy" with tappable links; acceptance saved |
| Location permission | Explainer screen before the system prompt; app still works with manual area selection if denied |
| Notifications | Ask after the first booking, not at launch |
| Provider onboarding step 7 | Checkbox: "I agree to the Provider Terms and Payout Terms" (required to publish) |
| Booking summary | Link to Cancellation and Refund Policy |
| Profile → Legal | Links to every document in §1 |
| Profile → Delete account | Explains what is deleted and what is kept for tax law; OTP confirmation; 30-day grace period, then anonymise |
| Profile → My data | Request a copy of my data (emailed within 30 days) |
| Chat and reviews | Report and block options |
| Help | Grievance officer contact, raise a complaint |

### Consent records

New collection `consents`:
```js
{ _id, userId, document: "privacy" | "terms" | "provider-terms" | "payouts" | "marketing" | "location",
  version: "2026-10-01", accepted: true, at, ip, appVersion, platform }
```
When a document's version changes, users see a "We've updated our terms" sheet on next launch and must accept to continue (for material changes).

## 6. Before submission checklist

- [ ] Company registered; GSTIN; bank account for settlements
- [ ] Lawyer-reviewed Privacy Policy, Terms, Provider Terms, Refund Policy published on `aawro.in`
- [ ] Grievance Officer appointed and listed
- [ ] Support email and phone active
- [ ] Data safety form (Play) and App Privacy (Apple) filled from §1.1
- [ ] In-app account deletion and web deletion page live
- [ ] Permission explainers and `Info.plist` strings set
- [ ] Reviewer demo accounts for both apps
- [ ] Store assets: icons, screenshots, feature graphic, descriptions for both apps
- [ ] Production builds via EAS (not Expo Go); crash-free on test devices
- [ ] Razorpay live mode KYC complete
