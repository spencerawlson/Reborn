# ShipItAyiti

B2B sourcing platform (Alibaba-style) connecting verified Haitian suppliers
with business buyers worldwide, with retail as a second channel. The company runs
the transportation: the platform creates the trade, the logistics business
moves the goods. Commission 10% by default (configurable,
historical rates preserved). English, French, and Haitian Creole.

## Status: Phase 1 foundation
- Next.js + TypeScript + Tailwind scaffold, EN/FR/HT dictionaries
- PostgreSQL schema (`db/migrations/0001_init.sql`): users, roles,
  producers, storefronts, products, orders, double-entry ledger, payouts,
  bank transfers, refunds, idempotency keys, audit log
- Migration 0002: append-only ledger, balance + currency checks at commit,
  producer pending/available accounts, processor fees, FX on payouts
- Migration 0003: producer ledger lines must name their producer
- CI (GitHub Actions): tests, typecheck, and build on every push and PR
- Commission engine + double-entry ledger (`src/lib/ledger`) with tests
- Mock payment, MonCash payout, and shipping providers
- Admin dashboard shell (`/admin`) with clearly-labeled demo figures

## Hard guard: mock money only
Do NOT activate live payment collection or payouts until banking partners,
payment providers, and qualified legal advisers confirm the proposed
marketplace settlement and cross-border payout structure is permitted under
applicable Canadian and Haitian regulations. `LIVE_PAYMENTS_ENABLED` must
stay `false` until then.

## Run it (local)
```bash
npm install
cp .env.example .env.local   # then put your email in ADMIN_EMAILS
npm run dev        # http://localhost:3000 — starts an embedded Postgres too
npm test           # vitest: ledger, guards, and migrations (in-process Postgres)
npm run typecheck  # tsc --noEmit
```

Apply migrations to the database in `DATABASE_URL` (Node 24+):
```bash
npm run db:migrate   # applies pending db/migrations/*.sql in order, once each
```
Applied migrations are recorded in `schema_migrations` with a checksum.
Never edit an applied migration; add a new numbered file instead.

The admin dashboard has no login yet. To view it locally, set
`ADMIN_DEV_PREVIEW=true` in `.env.local` (ignored in production);
otherwise `/admin` returns 404.

## Docs
- `docs/PLAN.md` — phases, business rules, module map
- `docs/ARCHITECTURE.md` — database architecture and balance derivation
- `docs/VISION.md` — product vision: diaspora buyers, producer-led storefronts
- `docs/PHASE2.md` — Phase 2 plan: diaspora shipping (abroad → Haiti), the logistics engine
- `docs/MARKETPLACE.md` — Phase 3 plan: the sourcing marketplace + trade freight
- `docs/LOGISTICS.md` — logistics operating model and engine design
- `docs/DECISIONS.md` — decision log (who decided what, and why)

## Next: Phase 2
Diaspora box-and-barrel shipping to Haiti on the company's own logistics
engine — see `docs/PHASE2.md`. The sourcing marketplace follows in Phase 3
on the same engine.
