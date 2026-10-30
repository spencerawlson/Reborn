# ShipItAyiti — Implementation Plan

## What this is
A B2B sourcing platform (Alibaba-style) connecting verified Haitian
suppliers with business buyers worldwide, with retail as a second channel;
see `docs/VISION.md`. Modular monolith: one Next.js + TypeScript
app, PostgreSQL, Tailwind. No microservices until scale demands them.

## Hard guards (non-negotiable)
- **MOCK ONLY for money movement.** Payment collection, bank transfers, and
  MonCash payouts run through mock providers until banking partners, payment
  providers, and qualified legal advisers confirm the Canada↔Haiti settlement
  and payout structure is permitted. `LIVE_PAYMENTS_ENABLED` defaults to
  `false`. `getPaymentProvider`/`getPayoutProvider` return mocks unless it
  is exactly `"true"`, and refuse even then until a live provider is added.
- **Corporate accounts only.** Company bank accounts in Canada and Haiti.
  Never personal accounts. No live credential ever goes in chat, code, or
  screenshots.
- **Decimal-safe money.** All money is integer minor units (cents) plus a
  currency code. Rates are `NUMERIC`. No floats anywhere near money.
- **History is immutable.** Orders store the commission rate that applied at
  purchase time. Changing the admin rate never rewrites past transactions.
- **Sensitive financial actions need explicit approval + authentication.**
  Payout approval, bank-transfer reconciliation, and rate changes are
  admin-only, MFA-gated, and audit-logged.

## Phases (build in order, test each phase)
- **Phase 0 — Plan + architecture.** This document + `docs/ARCHITECTURE.md`.
  Done when the schema and module map below are written.
- **Phase 1 — Foundation (this build).** App scaffold, auth + RBAC model,
  migration 0001, commission engine + double-entry ledger (tested), mock
  providers, admin dashboard shell. Done when tests + typecheck pass.
- **Phase 2 — Diaspora shipping (abroad → Haiti).** The logistics
  engine, launched as the box-and-barrel service: accounts, network and
  prices, booking (online and counter), warehouse scanning,
  consolidations, final mile with drivers and contractors, tracking and
  notifications, invoicing on the ledger. Plan: `docs/PHASE2.md`;
  operating model: `docs/LOGISTICS.md`.
- **Phase 3 — The sourcing marketplace + trade freight (Haiti →
  abroad).** Verified suppliers, wholesale listings, buyer accounts,
  search, inquiries, RFQs, quotes, deals — shipped on the Phase 2 engine
  with export documents and delivered-price quotes. Plan:
  `docs/MARKETPLACE.md`.
- **Phase 4 — Protected payments for goods (sandbox).** The buyer pays for
  the goods through the platform, held until delivery, then released to
  the supplier; retail checkout on the same path. Legal and banking
  clearance before live.
- **Phase 5 — Supplier payouts (manual).** MonCash/bank payout of goods
  proceeds, verification, approval queue, reconciliation.
- **Phase 6 — Admin dashboard (full).** Every widget in the brief wired to
  real queries, reports, dispute/complaint review, settings.
- **Phase 7 — Hardening.** Full i18n (EN/FR/HT) across all routes, MFA,
  backups, monitoring, CI (GitHub Actions), load + security review.

## Business rules baked into the code
- Commission: configurable by admin, default **10%** of product subtotal,
  excluding shipping and taxes. Stored per order at sale time. Payment
  processor fees are borne by the platform out of the commission.
- Producer balances have three states, always distinct: **pending**
  (sale made, not yet available), **available** (cleared for withdrawal),
  **paid** (withdrawn).
- Payouts go only to **verified** MonCash accounts, only after admin
  approval, and only from the **available** balance.
- Ledger amounts stay in the order currency. A MonCash payout records the
  HTG amount sent and the exact FX rate used.
- Every money movement is a balanced double-entry posting. An unbalanced
  posting is a bug, and the ledger module refuses it.
- Every payment/payout request carries an **idempotency key**. Replaying a
  request with the same key returns the original result, never a duplicate.
- Refunds and chargebacks reverse the original postings (including the
  commission) and are tracked per order, not netted silently.

## Module map (src/lib)
- `money/` — minor-unit math, rounding, currency formatting.
- `ledger/` — double-entry postings, balance queries, commission engine.
- `auth/` — users, roles (admin, producer, customer), MFA hooks, tenant
  isolation (a producer sees only their own rows; enforced in queries).
- `i18n/` — EN/FR/HT dictionaries, locale resolution.
- `providers/` — payment, MonCash payout, shipping. Mock implementations
  only in Phase 1; real providers plug into the same interfaces later.

## What is deliberately NOT in Phase 1
Live payment providers, live MonCash API, live carrier APIs, automated
banking, subscriptions, listing fees, warehouses/vehicles, and the
company-owned logistics operation. Those come in later phases (see above),
behind the same interfaces.
