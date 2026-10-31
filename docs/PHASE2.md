# Phase 2 plan — diaspora shipping (abroad → Haiti)

Decided October 30, 2026 (founder): build the diaspora box-and-barrel
shipping service first. It earns with assets the company already runs —
trucks, contractors, and warehouses in Montréal, Miami, and Haiti — and it
builds the logistics engine the sourcing marketplace (Phase 3,
`docs/MARKETPLACE.md`) will ship through. Operating model and design
rules: `docs/LOGISTICS.md`.

## Done when
One barrel and one box can go all the way, in the software, exactly as
they will in real life:
1. A sender in Montréal books a barrel online (and a walk-in sender books
   a box at the Miami counter), sees the price, declares contents, and
   names a recipient in Haiti.
2. The warehouse scans both in, weighs and photographs them, loads them
   into a consolidation (container or air load), and closes it with a
   manifest.
3. The load departs, arrives, clears customs, and is scanned into the
   Haiti warehouse.
4. One goes door-to-door to a delivery zone on a contractor's route, with
   proof of delivery; the other is collected at the warehouse with a
   one-time code and ID.
5. Sender and recipient are notified at each step, in their language,
   and can follow a public tracking page.
6. The booking invoice and the contractor's route pay are on the ledger,
   balanced; payments are recorded but mock until cleared.

## Milestones (in order; each ends tested, merged, pushed)

### 2a — Accounts, sign-in, languages
- ✅ Postgres client (`src/lib/db`) and migration runner (`npm run db:migrate`).
- ✅ Sign-up / sign-in / sign-out: email + password (scrypt), database
  sessions in an HTTP-only cookie, Haiti address on file, personal suite.
  ⏳ Password reset (needs an email provider).
- ✅ Admin role via `ADMIN_EMAILS`; `/admin` requires it.
- ✅ Door-to-door switch (admin, audit-logged) — ahead of 2b zones.
- ✅ Incoming orders + delivery OTP (start of 2g).
- Roles: `customer` (sender), `staff` (counter and warehouse, per
  warehouse), `driver` (employee or contractor), `admin`. Staff and
  drivers see only their site's or their own work.
- ✅ Locale routing `/{locale}/...`; all page text in the dictionaries;
  Creole default for Haiti-side screens and recipient messages.
- **Done when:** each role can sign in and sees only what it should.

### 2b — Network and prices
- `locations`: the four warehouses (Montréal, Miami, Port-au-Prince,
  Cap-Haïtien) with airport and seaport codes.
- `lanes`: origin warehouse → destination warehouse + mode (air, ocean).
- `delivery_zones`: every Haitian commune mapped to a zone, with a
  door-delivery charge, time estimate, and status (open / delayed /
  paused). Same for door pickup zones around Montréal and Miami.
- `item_sizes`: barrel and box sizes and over-size items (dimensions,
  max weight).
- `prices`: size × lane → price, plus extra-weight charges; versioned,
  so past bookings keep their price.
- A tested pricing function: (size, lane, pickup zone?, delivery zone?,
  weight) → itemised price in integer cents.
- Admin screens to edit all of the above; every change audit-logged.
- **Done when:** an admin can load the real price list and the pricing
  function reproduces it exactly.

### 2c — Booking and the counter
- Online booking for senders: items by size, contents and declared value
  (required by Haitian customs), prohibited items enforced, optional
  insurance, recipient (phone, city, neighbourhood, landmarks, map pin),
  drop-off or truck pickup, door delivery or warehouse pickup in Haiti.
- Counter mode for staff: the same booking in a few taps for walk-ins.
- Price snapshot on the booking; invoice issued; payment recorded —
  online (mock until cleared) or at the counter (cash or card terminal,
  recorded by staff).
- Each piece gets a tracking number and a printable barcode label.
- **Done when:** both booking paths produce a priced, invoiced, labelled
  booking, and the invoice posts a balanced ledger entry.

### 2d — Warehouses and loads
- Scan in at Montréal/Miami: actual weight, photos, condition; weight
  over the booked size triggers an extra-charge invoice.
- Consolidations: shared container (LCL), full container (FCL), or air
  load; cut-off date; container and seal numbers; manifest export for
  the carrier and Haitian customs.
- Milestones per load: closed, departed, arrived, customs released.
- Scan in at Port-au-Prince / Cap-Haïtien; mismatches flagged.
- **Done when:** a load's manifest matches every scanned piece, and every
  piece's location is known at all times.

### 2e — Final mile and drivers
- Routes: delivery stops grouped by zone, assigned to an employee driver
  or a contractor at a fixed route price; paused zones are excluded.
- Driver phone view: stop list with directions and landmarks; proof of
  delivery (photo, signature or recipient code, time and GPS).
- Warehouse pickup: release against a one-time code sent to the recipient
  plus ID check, logged.
- Truck pickups abroad use the same routes and driver view.
- Contractor pay: completed routes accrue to `contractor_payable`;
  batch payouts by bank transfer, MonCash (mock), or cash with a signed
  receipt photo.
- **Done when:** a contractor can run a route on a phone and see what
  they are owed, and a payout batch balances on the ledger.

### 2f — Tracking and notifications
- Public tracking page per tracking number (EN/FR/HT), no login.
- Notifications to sender and recipient at booking, departure, arrival,
  out for delivery, delivered: SMS and WhatsApp, Creole by default for
  recipients in Haiti.
- **Done when:** a shipment's full journey sends the right messages to
  the right people in the right language.

### 2g — Online-store forwarding (Amazon → Haiti)
Same engine as 2b–2f, for customers in Haiti (see `docs/LOGISTICS.md`):
sign-up with the customer's Haiti address registered on file, then a
personal suite address (customers buy themselves; the company never buys
for them), pre-alerts, receiving by carrier
tracking number with an unidentified-packages queue, weight-based
pricing, consolidation per customer, payment in Haiti before release.
Decided: customers buy, Miami + Montréal receive, priced per pound, paid
in Haiti by MonCash or cash. Waiting on: the rate per pound.
- **Done when:** a customer in Haiti gets their address, a package
  arrives at the warehouse and is matched to them, they are notified,
  and it reaches them in Haiti with payment recorded.

## Ledger additions (new migration)
Accounts: `shipping_revenue`, `accounts_receivable` (invoiced, unpaid),
`cash_on_hand` (counter and driver cash), `customer_deposits` (paid
before delivery, if counsel prefers revenue on delivery),
`contractor_payable`, `carrier_costs`. Postings for: booking invoice,
payment received (online / counter / cash), extra-weight charge, refund,
route completed, contractor payout, carrier bill. Same rules as today:
balanced groups, append-only, integers.

## Needed from the founder
- **The price list:** sizes and prices per route (2b can't finish
  without it).
- **Prohibited and restricted items** you already enforce.
- **Messaging account** for SMS/WhatsApp (e.g. Twilio or the WhatsApp
  Business platform) — an account and a cost, needed for 2f.
- **Counsel:** the company charging for its own shipping service is the
  first candidate for live payments.

## Not in Phase 2
The sourcing marketplace and trade freight Haiti → abroad (Phase 3);
payments for goods (Phase 4); supplier payouts (Phase 5); customer
mobile apps (the web works on phones); route optimisation (zones and
manual grouping first).
