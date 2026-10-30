# Database Architecture

## Conventions
- PostgreSQL. `TIMESTAMPTZ` everywhere; `created_at`/`updated_at` on every
  table. Soft deletes via `deleted_at` (financial rows are never hard-deleted).
- Money: `BIGINT` minor units + `currency CHAR(3)`. Never `FLOAT`/`DOUBLE`.
- Rates: `NUMERIC(5,4)` (0.0500 = 5%). Commission rates are rows with
  validity windows, so history is preserved.
- IDs: `UUID` primary keys (`gen_random_uuid()`), except short public codes
  where noted. Foreign keys with explicit `ON DELETE` behavior.
- Tenant isolation: every producer-owned row carries `producer_id`. Queries
  for a producer MUST filter by it; admin queries are the only exception.
- Audit: `audit_log` records who did what, to which row, with before/after
  JSON, for every admin financial action and every status change on money.

## Tables (migration 0001)

### Identity + access
- `users` — id, email (unique, citext), password_hash, display_name,
  locale (en/fr/ht), mfa_enabled, mfa_secret_encrypted, status
  (active/suspended), timestamps.
- `roles` — user_id, role (admin/producer/customer), unique(user_id, role).
  One user can hold several roles; the active role is chosen per session.
- `producer_profiles` — user_id (unique), business_name, contact info,
  country (default HT), kyb_status (pending/verified/rejected),
  timestamps. A producer is a user + this row.
- `moncash_accounts` — producer_id, account_number (encrypted at rest in
  production; plaintext only in local dev), account_name, verified_at,
  status (pending/verified/rejected). Payouts require verified status.

### Storefronts + catalog
- `storefronts` — producer_id (unique), slug (unique), name, tagline,
  description, logo_url, banner_url, locale defaults, status
  (draft/active/suspended), timestamps.
- `products` — storefront_id, sku, name, description, price_minor,
  currency, inventory_qty, status (draft/active/archived), timestamps.
- `product_images` — product_id, url, position. (S3-compatible storage;
  URLs only in the DB.)

### Orders + money
- `orders` — customer_id, storefront_id, status
  (pending/paid/fulfilled/refunded/cancelled/chargeback), subtotal_minor,
  shipping_minor, tax_minor, total_minor, currency, commission_rate_bps
  (rate locked at sale time), commission_minor, shipping provider + tracking
  fields, timestamps.
- `order_items` — order_id, product_id, qty, unit_price_minor, currency.
- `commission_settings` — rate_bps, effective_from, effective_to (null =
  current), changed_by_admin_id. Only one row may be current.
- `ledger_entries` — the double-entry ledger. id, entry_group (one UUID per
  business event), account (cash, producer_payable, commission_revenue,
  refunds_payable, shipping_payable, tax_payable), debit_minor,
  credit_minor, currency, order_id (nullable), producer_id (nullable),
  description, timestamps. **Invariant: sum(debits) = sum(credits) per
  entry_group.** The ledger module enforces it before insert.
- `payouts` — producer_id, moncash_account_id, amount_minor, currency,
  status (requested/approved/rejected/processing/completed/failed),
  requested_by, approved_by_admin_id, provider_ref (nullable),
  proof_of_payment_url (nullable), idempotency_key (unique), timestamps.
- `bank_transfers` — direction (CA→HT / HT→CA), amount_minor, currency,
  from_account_label, to_account_label, status
  (recorded/reconciled/failed), executed_at, reconciled_at,
  reconciled_by_admin_id, proof_url, notes.
- `refunds` — order_id, amount_minor, currency, reason, status
  (requested/approved/processed/rejected), chargeback flag, timestamps.
- `idempotency_keys` — key (unique), scope (payment/payout/refund),
  request_hash, response_json, created_at. Replays return the stored
  response.
- `audit_log` — actor_user_id, action, entity_type, entity_id,
  before_json, after_json, ip_address (nullable), created_at.

## Balance derivation (never stored as a single mutable number)
- `pending` = sum of producer_payable credits on orders not yet cleared.
- `available` = cleared producer_payable credits minus approved/completed
  payouts.
- `paid` = sum of completed payouts.
Clearing rule (Phase 4): an order's producer share moves pending→available
when the order is fulfilled and the clearing window passes; the window is
an admin setting, not a guess in code.

## Indexes that matter
- `orders(storefront_id, status)`, `orders(customer_id)`,
  `ledger_entries(entry_group)`, `ledger_entries(producer_id)`,
  `payouts(producer_id, status)`, `products(storefront_id, status)`,
  `audit_log(entity_type, entity_id)`, `idempotency_keys(key)`.
