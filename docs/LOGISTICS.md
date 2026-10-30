# Logistics — operating model and engine design

The company moves the goods. This plan covers the software that runs the
logistics operation and connects it to the sourcing platform. Operating
model confirmed by the founder on October 30, 2026 (below).

## Operating model (founder, October 30, 2026)
- **Modes:** air and ocean.
- **Fleet:** company-owned trucks plus independent contractor drivers.
- **Warehouses:** Haiti, Montréal, and Miami.
- **Experience:** the founder has run freight from China to Montréal.
- **Who pays freight:** negotiated between buyer and supplier on each
  deal.
- **Both directions:** Haiti → abroad carries Haitian goods; abroad →
  Haiti carries diaspora boxes and barrels, so loads are full both ways.
- **Final mile:** door-to-door delivery and warehouse pickup, at both
  ends. Door delivery covers **all of Haiti**.
- **Ocean loads:** shared containers (LCL) and full containers (FCL).
- **Contractors:** paid per route, by bank transfer, cash, or MonCash.
- **Diaspora shipping prices:** by item size and route.

## Network (founder, October 30, 2026)
- **Origins:** Port-au-Prince and Cap-Haïtien.
- **First destinations:** Montréal and Miami.
- **Next:** Paris, then anywhere in the world.

Design consequences (lead):
- **Lanes are data, not code.** A lane is origin location → destination
  location + mode, with its own rates. Adding Paris or Dakar is a new row
  and a rate card, never a code change.
- **Locations carry their codes:** city, country, airport (IATA: PAP,
  CAP, YUL, MIA, CDG) and seaport (UN/LOCODE: HTPAP, HTCAP, CAMTR, USMIA,
  FRLEH for Le Havre). Paris is served by CDG for air and Le Havre for
  ocean.
- **Shipments have legs.** Miami is both a destination and a natural hub:
  Cap-Haïtien → Miami → Paris is two legs, possibly two modes and two
  carriers. Tracking, costs, and documents attach per leg. "Anywhere in
  the world" means onward legs from a hub through partners.
- **Each destination country is its own rulebook.** Montréal = Canada
  (CBSA, CFIA), Miami = United States (CBP, FDA), Paris = EU (French
  customs, EU food and plant rules). Document checklists, duty estimates,
  and product restrictions are stored per destination country. Duty
  estimates must account for trade preferences Haiti may qualify for in
  each market — rates to be confirmed with customs brokers, not guessed
  in code.
- **Currencies:** freight priced in USD; buyers in Montréal see CA$ and in
  Paris € as estimates from `fx_rates`; invoices state one currency.

## Design consequences of the operating model (lead)
- **Freight payer is a field on every quote and deal:** buyer, supplier,
  or split, recorded with the Incoterm that expresses it (EXW/FCA: buyer
  pays the main freight; CPT/CIP/DAP/DDP: supplier pays). Freight invoices
  go to whoever the deal names.
- **Three warehouses, one system:** every piece is scanned in and out at
  Haiti, Montréal, and Miami; stock and location per site; cross-dock
  without storage when a load is waiting.
- **Fleet and dispatch:** vehicles, drivers (employees and contractors),
  routes for pickups and deliveries, and a phone-friendly driver view for
  proof of pickup and delivery (photo, signature, GPS time-stamp).
- **Contractor settlement:** the unit of pay is a **route** (one run of
  pickups/deliveries). Its price is fixed when the route is assigned;
  completing it accrues the amount to a `contractor_payable` ledger
  account. Payouts go in batches by the contractor's chosen method —
  bank transfer, MonCash (same mock-first provider as supplier payouts),
  or cash (recorded with who paid, when, and a signed receipt photo; cash
  on hand is its own ledger account so it reconciles). Contractors see
  only their own routes.
- **Final mile, both ends:** each shipment end is `door` or
  `warehouse_pickup`. Door delivery in Haiti cannot rely on street
  addresses: store phone, city, neighbourhood, landmark directions, and a
  map pin. Warehouse pickup releases only against a one-time code sent to
  the recipient's phone plus ID check, logged.
- **Nationwide delivery zones in Haiti:** every commune maps to a delivery
  zone (by department and distance from the Port-au-Prince or Cap-Haïtien
  warehouse). Each zone has a door-delivery charge, a delivery-time
  estimate, and a service status — `open`, `delayed`, or `paused` — so
  operations can pause a zone at once when road access changes, and
  bookings to it switch to warehouse pickup or wait. Contractors are
  assigned by zone.
- **Ocean LCL and FCL:** a consolidation is either a shared load (many
  shipments, charged per cubic metre / chargeable weight) or a full
  container (one customer, charged per container); both carry container
  and seal numbers.
- **Two products on one engine:**
  1. *Trade freight* (Haiti → abroad): commercial goods from deals,
     palletised or cartoned, with export documents.
  2. *Diaspora shipping* (abroad → Haiti): boxes and barrels from
     individuals, flat prices by size, simpler customs (personal
     shipments).
  Both use the same locations, warehouses, legs, consolidations,
  tracking, and billing.

## Diaspora shipping (abroad → Haiti)
- **Price table: size × route.** Each size (barrel and box sizes,
  over-size items) has a flat price per route (e.g. Montréal → Port-au-
  Prince, Miami → Cap-Haïtien), plus door-delivery and extra-weight
  charges where they apply. Prices are rows, editable by admins and
  versioned so past bookings keep their price.
- **Booking:** drop off at the Montréal or Miami warehouse, or book a
  pickup by truck. Sender pays at booking.
- **Contents declaration:** list of items and declared value (required
  for Haitian customs), prohibited and restricted items enforced at
  booking, optional insurance.
- **Recipient in Haiti:** name, phone, city; notified by WhatsApp/SMS at
  each step, in Creole by default.
- **Consolidation:** barrels and boxes loaded into containers (ocean) or
  air loads by cut-off date; manifest per load.
- **Arrival:** customs release in Haiti, then home delivery or pickup at
  the Haiti warehouse, with proof of delivery.
- **Money:** the company charging senders for its own shipping service
  — the simplest payment case, and the first candidate for live payments
  once counsel confirms.

## The flow the software must run
1. **Quote** — a buyer sees a delivered price: supplier price (at the
   company's Haiti warehouse) + freight for the lane and mode + handling +
   estimated duties and taxes + final delivery.
2. **Book** — an accepted deal (or a direct shipping request) becomes a
   shipment: what, how much, from which supplier, to which address.
3. **Pick up** — schedule collection from the supplier, or the supplier
   drops off at the warehouse.
4. **Receive** — at the Haiti warehouse: weigh, measure, photograph,
   check against the order, note damage. Real weights replace estimates.
5. **Document** — commercial invoice, packing list, certificate of origin,
   phytosanitary certificate (food), export declaration, air waybill or
   bill of lading. Checklist per product category and destination.
6. **Consolidate** — group shipments into an air load or ocean container
   (LCL/FCL) by destination and cut-off date.
7. **Move** — departure, transit hub (e.g. Miami), arrival; milestones
   recorded.
8. **Clear and deliver** — import clearance, duties paid, final delivery,
   proof of delivery (photo, signature).
9. **Bill** — freight invoice to the buyer (or supplier, by Incoterm);
   carrier and partner costs recorded against the shipment, so each load
   shows its margin.

## Software modules
- **Rates:** lanes (origin → destination city/country), modes (air,
  ocean LCL, ocean FCL, courier), price per chargeable kg (greater of
  actual and volumetric weight) or per cubic metre, minimums, surcharges
  (fuel, hazardous, oversize), validity dates. Integers only.
- **Shipments:** booking, status timeline, pieces with weights and
  dimensions, photos, documents, exceptions (damage, delay, hold).
- **Warehouse:** receiving, storage location, labels/barcodes, release
  into a consolidation.
- **Consolidations:** load planning by weight/volume, cut-off dates,
  manifests, master air waybill / bill of lading numbers.
- **Tracking:** a public tracking page per shipment (EN/FR/HT), and
  WhatsApp/email notifications on each milestone.
- **Billing:** freight invoices on the existing ledger — new accounts
  `freight_revenue`, `carrier_costs`, `duties_payable` (duties collected
  and paid on the buyer's behalf are pass-through, not revenue). Mock
  payments until the payment path is cleared; the company charging for
  its own service is the simpler case.
- **Ops dashboard:** shipments by stage, loads closing this week, margin
  per load, exceptions needing action.

## Questions for the founder (these shape the schema)
All operating-model questions answered October 30 (see above). Details
still needed when we build:
1. **Partners:** which ocean and air carriers, and which customs brokers
   in Canada, the US, and Haiti?
2. **The price list:** actual sizes and prices per route, to seed the
   diaspora shipping catalogue.

## Licences and compliance to confirm (counsel / brokers)
Each depends on the operating model; listed so none is missed.
- **Customs brokerage:** clearing goods for others usually needs a
  licensed customs broker (Canada: CBSA licence; US: CBP licence) — or a
  partner broker.
- **Ocean consolidation into the US:** issuing your own house bills of
  lading typically requires an FMC licence (NVOCC/OTI).
- **Air cargo:** booking through an IATA agent or consolidator, plus
  known-shipper security screening rules.
- **Food imports:** US FDA facility registration and Prior Notice;
  Canada CFIA (Safe Food for Canadians licence for importers); EU border
  checks. Suppliers' products may need these before the first shipment.
- **Dangerous goods:** spirits and essential oils are flammable; air
  shipments need DG-trained staff and declarations.
- **Haiti export:** customs (AGD) declarations and a licensed customs
  agent; export licences per product where required.
- **Insurance:** cargo insurance and freight-forwarder liability cover.
- **Money:** invoicing freight is your own service; collecting duties on
  a buyer's behalf, and anything touching the goods money, still goes
  through the legal review.

## Order of build
Phase 2 builds the engine as the diaspora shipping service (abroad →
Haiti): `docs/PHASE2.md`. Phase 3 adds trade freight (Haiti → abroad) on
the same engine — export documents, delivered-price quotes, shipments
from marketplace deals: `docs/MARKETPLACE.md`.
