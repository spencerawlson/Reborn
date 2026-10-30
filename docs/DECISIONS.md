# Decision log

Who decided, what, and why. Newest first. Claude is project lead (since
October 30, 2026) for technical and product calls inside `docs/VISION.md`;
legal, live money, spending, public launch, business terms, and changes to
the vision stay with the founder.

## 2026-10-30 — Brand name: ShipItAyiti (founder)
- **Founder:** the company and website are named **ShipItAyiti**
  (replacing the working name "Reborn").
- **Lead:** wordmark "ShipIt" + "Ayiti" in the accent colour, vector mark
  (no bitmaps); tracking numbers and personal suites use the `SIA-`
  prefix. Applied migrations keep their old header comments — editing an
  applied migration would change its checksum.

## 2026-10-30 — Online-store forwarding: Amazon → Haiti (founder)
- **Founder:** people in Haiti order on Amazon and have orders delivered
  to the company's warehouse; the company brings them to Haiti.
- **Lead:** a third service on the same engine (abroad → Haiti), added to
  Phase 2 as milestone 2g: personal suite addresses, pre-alerts,
  receiving and matching, weight pricing, consolidation, payment in
  Haiti.
- **Founder (answers):** both warehouses receive (Miami and Montréal);
  priced per pound; paid in Haiti by MonCash or cash at the warehouse.
- **Open (founder):** customers buy themselves (A), the company buys for
  them (B, counsel first), or both; the rate per pound.

## 2026-10-30 — Diaspora shipping first (founder, on lead's recommendation)
- **Founder:** build the diaspora box-and-barrel service (abroad → Haiti)
  before the marketplace.
- **Why:** it earns with trucks, contractors, and warehouses the company
  already runs; it is the simplest payment case (the company charging for
  its own service); it builds the logistics engine the marketplace needs;
  its customers are the marketplace's future buyers.
- **Plan:** Phase 2 = diaspora shipping (`docs/PHASE2.md`, milestones
  2a–2f); Phase 3 = sourcing marketplace + trade freight
  (`docs/MARKETPLACE.md`, formerly the Phase 2 plan); Phase 4 = payments
  for goods; Phase 5 = supplier payouts.

## 2026-10-30 — Door delivery everywhere in Haiti (founder) + zones (lead)
- **Founder:** door delivery covers all of Haiti.
- **Lead:** communes map to delivery zones with their own charge, time
  estimate, and service status (open / delayed / paused) so a zone can be
  paused immediately when road access changes; contractors assigned by
  zone.

## 2026-10-30 — Final mile, containers, contractor pay, pricing (founder) + design (lead)
- **Founder:** door-to-door and warehouse pickup; LCL and FCL; contractors
  paid per route by bank transfer, cash, or MonCash; diaspora shipping
  priced by size and route.
- **Lead:** delivery method per shipment end; Haiti addresses as phone +
  neighbourhood + landmarks + map pin; pickup released by one-time code
  and ID; route as the unit of contractor pay with three payout methods
  and a cash ledger account; versioned size × route price table.

## 2026-10-30 — Operating model (founder) + design (lead)
- **Founder:** air and ocean; owned trucks plus independent contractors;
  warehouses in Haiti, Montréal, and Miami; prior freight experience China
  → Montréal; freight payer negotiated between buyer and supplier per
  deal; carry diaspora boxes and barrels back to Haiti.
- **Lead:** freight payer + Incoterm on every quote and deal;
  multi-warehouse scanning; fleet, dispatch, and driver proof of delivery;
  contractor settlement on the ledger (`contractor_payable`); one engine
  for two products — trade freight (Haiti → abroad) and diaspora shipping
  (abroad → Haiti).

## 2026-10-30 — Network: PAP + Cap-Haïtien → Montréal + Miami, then Paris and worldwide (founder)
- **Founder:** origins Port-au-Prince and Cap-Haïtien; first destinations
  Montréal and Miami; then Paris and anywhere in the world.
- **Lead:** lanes and locations are data (IATA/UN-LOCODE codes), shipments
  have legs (Miami as hub for onward routing), compliance rules and
  document checklists are stored per destination country (Canada, US, EU
  first), freight priced in USD with local-currency estimates.

## 2026-10-30 — The company runs the logistics (founder) + replan (lead)
- **Founder:** the real business is logistics. The company handles the
  transportation; the sourcing platform feeds it. Freight and logistics
  are the core revenue.
- **Lead:** Phase 3 becomes the logistics core (rates, delivered-price
  quotes, bookings, pickup, warehouse receiving, consolidation,
  documents, tracking, freight invoicing); protected payments for goods
  move to Phase 4. Listings must carry shipping data to publish. Supplier
  quotes are delivered to the company's Haiti warehouse; buyers see a
  freight estimate to their city. Accepted deals open a shipment request.
- **Open (founder):** routes, modes, partners, licences (see
  `docs/LOGISTICS.md`); whether the marketplace charges anything on top
  of freight.

## 2026-10-30 — B2B sourcing platform (founder) + Phase 2 replan (lead)
- **Founder:** the platform is Alibaba-style B2B sourcing — businesses
  abroad source Haitian goods in volume from verified suppliers; retail to
  individuals is a second channel. `docs/VISION.md` rewritten.
- **Lead:** Phase 2 becomes sourcing without money — supplier
  verification (identity → site visited → export ready), wholesale
  listings (MOQ, price tiers, capacity, Incoterms), buyer business
  accounts, inquiries, RFQs, quotes, and deals recorded with off-platform
  settlement. Phase 3 becomes protected payments (held until delivery),
  legal clearance first. Launch categories widened to coffee, cacao,
  spices, essential oils, processed foods, rum, handicrafts, art.
- **Superseded** below: the art + pantry-only launch, retailer-only
  modelling, and WhatsApp request-to-order (replaced by on-platform
  inquiries with WhatsApp/email notifications).
- **Open (founder):** revenue mix — deal commission, supplier
  memberships, paid placement, export service fees.

## 2026-10-30 — Phase 2 scope (lead, superseded above)
- **Launch categories:** art and shelf-stable food (`pantry`) sell to
  buyers abroad first. Fresh produce is in the catalogue but blocked from
  export until import rules are cleared per destination country.
  *Why:* phytosanitary permits and cold chain make fresh food the hardest
  thing to ship across borders, and spoilage becomes refunds.
- **Retailers:** modeled now (account type + manual verification); same
  prices as everyone in Phase 2; tiers, invoices, terms later.
- **Producer verification:** an admin approves each producer before their
  storefront is public. *Why:* "verified producer" is the main trust signal
  for buyers who can't visit.
- **Public links:** `/{locale}/s/{slug}`, plus `/s/{slug}` redirecting by
  the buyer's language.
- **Request to order:** WhatsApp order requests, saved as `order_requests`,
  with no money through the platform. *Why:* measures real demand before
  checkout is legally cleared; stays inside the mock-money hard guard.

## 2026-10-30 — Default commission 10% (founder)
Raised from 5%. 5% did not cover card processing fees. The 5% row is kept
as history (migration 0002).

## 2026-10-30 — Product vision approved (founder)
`docs/VISION.md` merged: diaspora buyers, producer-led storefronts, bulk
and retailer orders, food and art first.
