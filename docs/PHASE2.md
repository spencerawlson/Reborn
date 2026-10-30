# Phase 2 plan — verified suppliers, wholesale listings, inquiries + RFQ

Replanned October 30, 2026 for the B2B sourcing direction in
`docs/VISION.md`. Phase 2 delivers a working sourcing platform **without
moving money**: buyers find verified suppliers, ask, request quotes, and
agree deals that settle off-platform. Payments come later (Phase 3+),
behind legal clearance.

## Done when
1. A Haitian supplier can register, get verified, and publish a profile
   and wholesale catalogue with a shareable link.
2. A business buyer abroad can find suppliers and products (EN/FR/HT),
   send an inquiry, post an RFQ, receive quotes, and accept one.
3. Every accepted quote is recorded as a deal (product, quantity, price,
   terms) — the data the later protected-payment service builds on.
4. Admins run supplier verification and see the funnel: inquiries, RFQs,
   quotes, deals — by category, supplier, and buyer country.
5. Tests prove tenant isolation: a supplier never sees another supplier's
   inquiries, quotes, or buyers' messages to others.

## Decisions (October 30, 2026)
Founder: B2B sourcing first, retail second. Lead (Claude), within that:
- **Launch categories:** coffee, cacao, spices, essential oils, processed
  foods, rum/spirits, handicrafts, art. Fresh produce listed but
  export-gated.
- **Supplier verification levels:** `identity` (registration documents
  checked) → `site_visited` (in person or trusted partner, with date and
  photos) → `export_ready` (export licence and certificates checked).
  Unverified suppliers stay private.
- **Buyer verification:** light — business name, country, type, website.
  Unverified buyers can browse and send a limited number of inquiries per
  day (anti-spam); verified buyers are unlimited.
- **Links:** `/{locale}/s/{supplier-slug}` and `/{locale}/p/{product-id}`;
  `/s/{slug}` redirects by the visitor's language.
- **Messages are stored on the platform** (not only WhatsApp), so deals
  have a record. Email and a WhatsApp link notify about new messages.

## Milestones (in order; each ends with tests passing)

### 2a — Database, accounts, languages
- ✅ Postgres client (`src/lib/db`) and migration runner (`npm run db:migrate`).
- Sign-in: email + password (argon2id), database sessions in an HTTP-only
  cookie, password reset by email. Maintained library (evaluate Better
  Auth). Replaces `ADMIN_DEV_PREVIEW`.
- Account types: `supplier`, `buyer`, `admin` (roles table).
- Locale routing `/{locale}/...`; all page text in the dictionaries.
- **Done when:** register, sign in, sign out, reset password; roles work.

### 2b — Suppliers and verification
Schema: `producer_profiles` becomes the supplier company: legal name,
trade name, registration number (Haiti patente/NIF), founded year,
employees, region (department), story, contact, export licence status,
monthly capacity summary, `verification_level` + dates, certifications
(organic, fair trade, …) with document uploads, site photos.
- Supplier onboarding wizard, built for phones and slow connections.
- Admin verification queue: approve each level with evidence; every
  action audit-logged; suspend.
- **Done when:** a verified supplier's profile is public at its link;
  badges show level and date.

### 2c — Wholesale listings
Migration 0004:
- `categories` (fixed tree, seeded) with `requires_import_clearance`.
- `products`: category, `sell_unit` (kg, g, L, ml, piece, carton, …) with
  integer quantities, `moq` (minimum order quantity), `monthly_capacity`,
  `lead_time_days`, `incoterms` offered, `hs_code`, packaging options,
  samples (available, price, lead time), certifications, origin
  department, `attributes JSONB` per category (art: artist, medium,
  dimensions, edition; coffee: variety, altitude, process, grade; …).
- `product_price_tiers`: quantity from → unit price (integer minor units);
  or `price_on_request`.
- `product_translations` (en/fr/ht) with fallback to the original.
- Images: S3-compatible storage, resized, EXIF location removed.
- **Done when:** a supplier can list, edit, and archive products with
  tiers, MOQ, and images; every rule has a test.

### 2d — Buyers find suppliers
- Buyer business accounts: company, country, buyer type (importer,
  distributor, grocer, restaurant, roaster, gallery, retailer, individual),
  website; light verification.
- Search and browse: by category, certification, verification level,
  MOQ, region. Postgres full-text search first.
- Supplier page and product page: badges, capacity, MOQ, price tiers in
  USD with an "approximately CA$ / €" estimate, terms, samples, share
  buttons (copy, WhatsApp, QR), link previews (Open Graph).
- **Done when:** a buyer abroad on a phone can find a product by search
  and see everything needed to decide whether to inquire.

### 2e — Inquiries, RFQs, quotes, deals (the core flow)
Migration 0005:
- `conversations` + `messages` — buyer ↔ supplier, optionally tied to a
  product; attachments; read state. Email (and WhatsApp link)
  notifications on new messages.
- `rfqs` — buyer, product description, category, quantity + unit,
  destination country, target price (optional), deadline, status
  (open/closed/awarded). Visible to suppliers in matching categories.
- `quotes` — supplier → RFQ or conversation: unit price, quantity,
  currency, incoterm, lead time, valid until, notes; status (sent,
  accepted, declined, expired). Immutable once sent; a revision is a new
  quote.
- `deals` — created when a buyer accepts a quote: snapshot of the quote,
  buyer, supplier, `settlement = 'off_platform'`. No ledger entries (no
  money through the platform); Phase 3's protected payment adds
  `settlement = 'platform'` and posts to the ledger.
- Admin funnel view; spam and abuse reporting on messages.
- **Done when:** inquiry → RFQ → quote → accepted deal works end to end,
  with notifications, and the admin funnel counts it.

## Rules carried forward
- Tenant isolation on every supplier-owned query, with tests that try
  to cross it.
- Audit log on every verification decision and suspension.
- No money moves in Phase 2. `LIVE_PAYMENTS_ENABLED` stays false.
- Quantities and prices are integers; never floats.
- Native review of French and Creole before launch.

## Not in Phase 2
Protected payments / escrow and retail checkout (Phase 3+, legal first);
supplier memberships and paid placement (revenue mix is a founder
decision); logistics and export services (Phase 5); reviews and ratings
(need completed deals); machine translation of messages; MFA (Phase 7).

## Risks to watch
- **Supply depth:** Haiti's export volumes are small. Honest capacity
  numbers matter more than catalogue size; overselling ruins trust.
- **Verification cost:** site visits need people in Haiti. Partner with
  cooperatives, chambers of commerce, or field agents.
- **Spam and fraud** in messages and RFQs — rate limits, buyer
  verification, reporting from day one.
- **Connectivity:** suppliers upload on slow mobile data; uploads must be
  retryable and pages light.
- **Off-platform leakage:** once buyer and supplier meet, they may deal
  directly. Protected payments and export services are what keep them
  on the platform later.
