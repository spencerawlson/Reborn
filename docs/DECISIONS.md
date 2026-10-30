# Decision log

Who decided, what, and why. Newest first. Claude is project lead (since
October 30, 2026) for technical and product calls inside `docs/VISION.md`;
legal, live money, spending, public launch, business terms, and changes to
the vision stay with the founder.

## 2026-10-30 — Phase 2 scope (lead)
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
