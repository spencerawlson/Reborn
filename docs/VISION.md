# Product vision — diaspora buyers, producer storefronts, bulk and retail

This document records the founder's product direction (October 30, 2026).
Approved and merged to main on October 30, 2026. Phase 2 is planned
around it in `docs/PHASE2.md`.

## Who buys
Haitians living abroad — Canada, France, the United States, and worldwide
in general. The platform must speak to them first: EN/FR/HT, prices and
shipping that make sense from abroad, and storefronts they can trust
without being there in person.

## What they buy
From a producer's own storefront, a buyer can order:
- Fresh agricultural products — vegetables and other farm produce from
  Haitian producers.
- Haitian-made art — paintings and other Haitian-made goods.
- More producer categories to follow; food and art are the starting wedge.

## How they buy
- Regular retail orders (single buyers).
- **Bulk orders** — larger quantities in one order.
- **Retailer accounts** — buyers who resell (shops, grocers, distributors
  abroad) ordering as retailers, not just as consumers. Retailer pricing,
  minimum quantities, and terms are a later phase, but the data model must
  not assume every buyer is a single consumer.

## Storefronts are real stores, promoted by their owners
- Every producer gets their own storefront, created on the platform,
  with its own public link.
- The producer promotes that link themselves — to their own customers,
  contacts, and diaspora networks. Distribution is producer-led: the
  platform gives every producer a real store plus a link; the producers
  bring their buyers.
- A storefront holds everything that producer makes: the full catalogue,
  not a single listing. It should feel like a real store, not a classified
  ad.

## What this changes in the build
- Product model: perishable/fresh products need harvest/availability
  windows, weight-based quantities, and cold-chain/shipping notes —
  not just a static SKU price.
- Storefronts: a storefront is the producer's shop window to the
  diaspora; trust signals (verified producer, reviews, origin) matter
  more than catalogue size. Every storefront has a clean, shareable
  public URL.
- Orders: bulk quantities and retailer orders ride the same order +
  commission + ledger pipeline as retail orders. No separate money path.
- Categories: agriculture/fresh and art are first-class categories,
  not a generic list.

## Still to decide
- Which promotion tools the platform hands producers (share buttons,
  WhatsApp share, link tracking) — the producer-led model itself is
  decided; the tooling is not.
