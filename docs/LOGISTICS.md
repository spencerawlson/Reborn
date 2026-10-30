# Logistics core — Phase 3 plan (draft)

The company moves the goods. This plan covers the software that runs the
logistics operation and connects it to the sourcing platform. It is a
draft: the operating model below needs the founder's answers before the
schema is fixed.

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
1. **Lanes:** which routes first? (e.g. Port-au-Prince / Cap-Haïtien →
   Miami → Montréal, New York, Paris.) One direction only, or also
   diaspora → Haiti (boxes and barrels, a large existing market)?
2. **Modes:** air, ocean, or both? Consolidated (LCL) or full containers?
3. **Assets vs partners:** do you own or lease trucks, a warehouse in
   Haiti, a receiving point abroad? Which carriers, forwarders, and
   customs brokers do you already work with?
4. **Experience:** have you run freight before — on which lanes, at what
   volume?
5. **Who pays freight:** the buyer (delivered price) by default, or
   negotiable per deal?
6. **Final delivery:** door-to-door, or the buyer collects from a
   warehouse abroad?

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
Phase 2 first (the platform that creates the trade), with shipping data
on listings and shipment requests on deals. Then Phase 3 in this order:
rates + delivered-price quotes → shipments + tracking → warehouse
receiving → consolidations → billing → ops dashboard.
