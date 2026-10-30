# Phase 2 plan — producer storefronts + catalog, built for diaspora buyers

Planned October 30, 2026, around `docs/VISION.md`. Phase 2 ends before any
money moves: no cart, no checkout. It builds everything a buyer needs to
*find and trust* a producer, and everything a producer needs to *open a
real store and share its link*.

## Done when
1. A producer can register, sign in, create a storefront with a clean
   public link, and publish a full catalogue with images.
2. A buyer abroad can open that link (EN/FR/HT) and browse the store, with
   products in the right units, clear availability, and visible trust
   signals.
3. A producer can share their link in one tap (copy, WhatsApp).
4. The data model already records consumer vs retailer buyers and
   bulk minimums, so Phase 3 checkout needs no schema rework.
5. Tests prove tenant isolation: a producer can never read or write
   another producer's rows.

## Decisions (taken October 30, 2026)
These change the schema, so they came first. The founder appointed Claude
as project lead; the recommended option was adopted in each case. Any of
them can be overruled — record the change in `docs/DECISIONS.md`.

1. **Launch categories.** *Recommended:* launch selling **art** and
   **shelf-stable foods** (coffee, cacao, spices, dried goods) to buyers
   abroad, with **fresh produce** in the catalogue but blocked from export
   checkout until import rules are cleared per destination. Fresh
   vegetables into Canada/France/the US need phytosanitary certificates,
   import permits, and cold chain; a spoiled box is a refund. Art and
   shelf-stable goods ship today. *Alternative:* fresh produce from day one,
   limited to buyers inside Haiti.
2. **Retailer accounts in Phase 2.** *Recommended:* model them now
   (account type + verification status), approve them by hand, no special
   pricing yet. Retailer pricing tiers, invoices, and terms are Phase 3+.
3. **Producer verification.** *Recommended:* admin approves each producer
   (KYB) before their storefront goes public. Draft storefronts are
   private. "Verified producer" is then a real trust signal.
4. **Public link shape.** *Recommended:* `/{locale}/s/{slug}` (e.g.
   `/ht/s/kafe-lakay`), plus a short `/s/{slug}` that redirects by the
   buyer's language. Slugs are lowercase, unique, and checked against a
   reserved list (`admin`, `api`, `login`, …).

## Milestones (in order; each ends with tests passing)

### 2a — Plumbing the database and accounts
Phase 1 has no app code talking to Postgres. Phase 2 needs it first.
- ✅ Postgres client (`postgres` npm package) behind one `db` module;
  every producer query goes through a helper that requires
  `producerScope(session)`.
- ✅ Migration runner (`npm run db:migrate`, `src/lib/db/migrate.ts`): a small script that applies `db/migrations/*.sql` in
  order inside a transaction and records them in a `schema_migrations`
  table. Replaces the psql loop in the README.
- Real sign-in: email + password (argon2id hashes), database-backed
  sessions in an HTTP-only cookie, sign-out, password reset by email.
  Use a maintained auth library rather than hand-rolled crypto; evaluate
  Better Auth (Postgres adapter, TOTP plugin for Phase 7 MFA). Replaces
  the `ADMIN_DEV_PREVIEW` stand-in in `src/lib/auth/session.ts`.
- Roles from the `roles` table; `/admin` uses the real session.
- Locale routing: `/{locale}/...` for all public pages; the buyer's
  choice is remembered in a cookie.
- **Done when:** a user can register, sign in, and sign out; migrations
  run with one command; CI runs the runner against PGlite.

### 2b — Producer onboarding + storefront
- Producer registration: business name, contact phone (WhatsApp), region
  of Haiti (department), short story. Creates `producer_profiles` with
  `kyb_status = pending`.
- Storefront editor: name, slug, tagline, story, logo, banner, contact
  preference. Status `draft` until the producer publishes **and** an admin
  has verified them.
- Admin queue: approve or reject producers (audit-logged); suspend a
  storefront.
- **Done when:** an approved producer's storefront is live at its public
  link; an unapproved one is a 404 to the public.

### 2c — Catalogue built for food and art
Schema (migration 0004):
- `categories` — fixed rows, not free text: `art`, `pantry` (shelf-stable
  food), `fresh_produce`, with `requires_import_clearance` (true for
  fresh produce). New categories are added by migration.
- `products` gains:
  - `category_id`;
  - `sell_unit` — `each`, `g`, or `ml` — and `unit_size` (integer, e.g.
    500 for a 500 g bag), so weights stay integers like money;
  - `min_order_qty` (default 1) and `bulk_min_qty` (nullable: the
    quantity at which an order counts as bulk);
  - `origin_department`, `shipping_notes`, `is_perishable`;
  - `attributes JSONB` for category-specific details, validated in code
    per category (art: artist, medium, dimensions, year, one-of-a-kind;
    pantry: net weight, best-before window; fresh: storage and
    temperature notes).
- `product_availability` — for fresh produce: harvest/available-from,
  available-until, and quantity per window. A fresh product outside every
  window shows as "next harvest: …", not "in stock".
- `product_translations` — name and description per locale (en/fr/ht),
  falling back to the producer's original language. Producers write in
  the language they know; translation is not required to publish.
- Images: upload to S3-compatible storage (MinIO locally), resized
  server-side, max size and type enforced, EXIF location data removed.
  Art needs several large images per piece.
- One-of-a-kind art: inventory 1, marked sold rather than "out of stock".
- **Done when:** a producer can create, edit, archive, and reorder
  products of each category with images, and every rule above has a test.

### 2d — The public store buyers abroad see
- Storefront page: banner, story, region of origin, member since,
  verified badge, full catalogue grouped by category, search inside the
  store.
- Product page: images, price in the store currency with "approximately
  CA$ / €" shown as an estimate (from `fx_rates`; labelled as an
  estimate, never charged), unit and minimum quantity, availability
  window, shipping notes. Fresh produce shows "not yet available for
  shipping to your country" when import is not cleared.
- Share: copy link, WhatsApp share (`wa.me` with a prefilled message in
  the producer's language), QR code for printing. Link tracking (`?ref=`)
  waits until the promotion tools are decided.
- **Request to order (no payment):** until checkout is legally cleared,
  a buyer can send an order request — items, quantities, their country —
  that opens WhatsApp to the producer with the request prefilled, and is
  also saved as an `order_requests` row (no amounts charged, no money
  through the platform). The producer and buyer settle directly. This
  validates real demand per producer and product before Phase 3, and the
  admin dashboard counts requests by producer, category, and country.
- SEO and link previews: page titles, descriptions, Open Graph images so a
  shared link shows the product photo in WhatsApp/Facebook.
- Mobile first: most buyers and producers will open these on phones.
- **Done when:** a store link opened on a phone in any of the three
  languages shows the full store, and a shared link renders a preview.

### 2e — Buyers: consumers and retailers
Schema (migration 0005):
- `buyer_profiles` — user_id, `account_type` (`consumer` or `retailer`),
  country, and for retailers: business name, business number, verification
  status (pending/verified/rejected), approved_by_admin_id.
- `orders` gains `buyer_account_type` (copied at order time, like the
  commission rate) so history keeps whether it was a retail or retailer
  sale.
- Retailer sign-up form and an admin approval queue. Verified retailers
  see a "retailer" badge and bulk minimums; prices are the same as
  everyone's in Phase 2.
- **Done when:** a retailer can apply and be approved, and the order
  schema records buyer type for Phase 3.

## Rules carried forward
- Tenant isolation: every producer-owned query is scoped by
  `producer_id`, with tests that try to cross it.
- Every admin approval, rejection, and suspension writes `audit_log`.
- No money moves in Phase 2. `LIVE_PAYMENTS_ENABLED` stays false.
- Quantities are integers (grams, millilitres, units), never floats.
- Creole and French copy gets native review before launch.

## Not in Phase 2
Cart, checkout, and payment (Phase 3); retailer price tiers, invoices,
and payment terms (Phase 3+); reviews (they need real orders); shipping
quotes and cold-chain logistics (Phase 5); referral/link tracking (after
the promotion tools are decided); MFA (Phase 7).

## Risks to watch
- **Fresh produce import rules** may limit fresh food to buyers inside
  Haiti for a long time. The catalogue supports it; checkout must respect
  it.
- **Trust from abroad** depends on producer verification being real.
  A fast but careless approval queue undoes the main trust signal.
- **Connectivity in Haiti:** producers may upload on slow mobile data.
  Image uploads need resumable or retryable handling and small previews.
- **Translation quality:** machine-translated Creole damages trust with
  exactly the buyers the platform targets.
