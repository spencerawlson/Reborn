# Global Haitian Producer Marketplace

Marketplace connecting Haitian producers with customers worldwide, plus free
independent producer storefronts. Commission 10% by default (configurable,
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
npm run dev        # http://localhost:3000
npm test           # vitest: ledger, guards, and migrations (in-process Postgres)
npm run typecheck  # tsc --noEmit
```

Apply the schema to a local Postgres database with:
```bash
for f in db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$f"; done
```

The admin dashboard has no login yet. To view it locally, set
`ADMIN_DEV_PREVIEW=true` in `.env.local` (ignored in production);
otherwise `/admin` returns 404.

## Docs
- `docs/PLAN.md` — phases, business rules, module map
- `docs/ARCHITECTURE.md` — database architecture and balance derivation

## Next: Phase 2
Producer registration, free storefronts, products, images, inventory —
then cart + sandbox checkout in Phase 3.
