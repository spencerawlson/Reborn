# Global Haitian Producer Marketplace

Marketplace connecting Haitian producers with customers worldwide, plus free
independent producer storefronts. Commission 5% by default (configurable,
historical rates preserved). English, French, and Haitian Creole.

## Status: Phase 1 foundation
- Next.js + TypeScript + Tailwind scaffold, EN/FR/HT dictionaries
- PostgreSQL schema (`db/migrations/0001_init.sql`): users, roles,
  producers, storefronts, products, orders, double-entry ledger, payouts,
  bank transfers, refunds, idempotency keys, audit log
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
npm test           # vitest: commission + ledger tests
npm run typecheck  # tsc --noEmit
```

Apply the schema to a local Postgres database with:
```bash
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
```

## Docs
- `docs/PLAN.md` — phases, business rules, module map
- `docs/ARCHITECTURE.md` — database architecture and balance derivation

## Next: Phase 2
Producer registration, free storefronts, products, images, inventory —
then cart + sandbox checkout in Phase 3.
