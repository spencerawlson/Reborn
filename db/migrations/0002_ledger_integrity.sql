-- Global Haitian Producer Marketplace — migration 0002
-- Ledger integrity, producer pending/available accounts, processor fees,
-- default commission 10%, FX on payouts, integrity checks, FK indexes.

-- Ledger accounts ---------------------------------------------------------
-- producer_payable splits into producer_pending + producer_available so
-- producer balances are pure ledger sums. Rows from before this migration
-- were all pre-clearing, so they become producer_pending.
ALTER TABLE ledger_entries DROP CONSTRAINT ledger_entries_account_check;
UPDATE ledger_entries SET account = 'producer_pending' WHERE account = 'producer_payable';
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_account_check CHECK (account IN
  ('cash', 'producer_pending', 'producer_available', 'commission_revenue',
   'processor_fees', 'shipping_payable', 'tax_payable'));
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_nonzero_check
  CHECK (debit_minor > 0 OR credit_minor > 0);

-- Financial history must never lose its links: refuse deletes instead.
ALTER TABLE ledger_entries
  DROP CONSTRAINT ledger_entries_order_id_fkey,
  ADD CONSTRAINT ledger_entries_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  DROP CONSTRAINT ledger_entries_producer_id_fkey,
  ADD CONSTRAINT ledger_entries_producer_id_fkey
    FOREIGN KEY (producer_id) REFERENCES producer_profiles(id) ON DELETE RESTRICT;
ALTER TABLE producer_profiles
  DROP CONSTRAINT producer_profiles_user_id_fkey,
  ADD CONSTRAINT producer_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE moncash_accounts
  DROP CONSTRAINT moncash_accounts_producer_id_fkey,
  ADD CONSTRAINT moncash_accounts_producer_id_fkey
    FOREIGN KEY (producer_id) REFERENCES producer_profiles(id) ON DELETE RESTRICT;
ALTER TABLE storefronts
  DROP CONSTRAINT storefronts_producer_id_fkey,
  ADD CONSTRAINT storefronts_producer_id_fkey
    FOREIGN KEY (producer_id) REFERENCES producer_profiles(id) ON DELETE RESTRICT;

-- The ledger is append-only. Corrections are reversing entries.
CREATE FUNCTION ledger_entries_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only; post a reversing entry instead';
END;
$$;
CREATE TRIGGER trg_ledger_append_only
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_entries_append_only();
CREATE TRIGGER trg_ledger_no_truncate
  BEFORE TRUNCATE ON ledger_entries
  FOR EACH STATEMENT EXECUTE FUNCTION ledger_entries_append_only();

-- Every entry group balances and uses one currency, checked at commit so
-- a group's lines can be inserted one at a time inside a transaction.
CREATE FUNCTION ledger_group_balanced() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  debits BIGINT;
  credits BIGINT;
  currencies INTEGER;
BEGIN
  SELECT COALESCE(SUM(debit_minor), 0), COALESCE(SUM(credit_minor), 0),
         COUNT(DISTINCT currency)
    INTO debits, credits, currencies
    FROM ledger_entries
   WHERE entry_group = NEW.entry_group;
  IF debits <> credits OR debits = 0 THEN
    RAISE EXCEPTION 'unbalanced ledger group %: debits % <> credits %',
      NEW.entry_group, debits, credits;
  END IF;
  IF currencies <> 1 THEN
    RAISE EXCEPTION 'ledger group % mixes currencies', NEW.entry_group;
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER trg_ledger_balanced
  AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_group_balanced();

-- Commission --------------------------------------------------------------
-- Only one current rate, and validity windows run forward.
ALTER TABLE commission_settings ADD CONSTRAINT commission_settings_window_check
  CHECK (effective_to IS NULL OR effective_to >= effective_from);
-- Default moves from 5% to 10%. The 5% row is closed, not rewritten.
UPDATE commission_settings SET effective_to = now() WHERE effective_to IS NULL;
INSERT INTO commission_settings (rate_bps) VALUES (1000);
CREATE UNIQUE INDEX uniq_commission_settings_current
  ON commission_settings ((TRUE)) WHERE effective_to IS NULL;

-- Orders ------------------------------------------------------------------
ALTER TABLE orders
  ADD CONSTRAINT orders_total_check
    CHECK (total_minor = subtotal_minor + shipping_minor + tax_minor),
  ADD CONSTRAINT orders_commission_rate_check
    CHECK (commission_rate_bps BETWEEN 0 AND 10000),
  ADD CONSTRAINT orders_commission_le_subtotal_check
    CHECK (commission_minor <= subtotal_minor);

-- Order items must be in the order's currency.
CREATE FUNCTION order_items_currency_matches() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.currency <> (SELECT currency FROM orders WHERE id = NEW.order_id) THEN
    RAISE EXCEPTION 'order item currency % does not match its order', NEW.currency;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_order_items_currency
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION order_items_currency_matches();

-- Refunds store the commission they reversed (see postRefund).
ALTER TABLE refunds
  ADD COLUMN product_minor BIGINT NOT NULL DEFAULT 0 CHECK (product_minor >= 0),
  ADD COLUMN shipping_minor BIGINT NOT NULL DEFAULT 0 CHECK (shipping_minor >= 0),
  ADD COLUMN tax_minor BIGINT NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  ADD COLUMN commission_refund_minor BIGINT NOT NULL DEFAULT 0
    CHECK (commission_refund_minor >= 0);

-- FX for payouts ----------------------------------------------------------
-- Ledger amounts stay in the order currency (e.g. USD). A payout to
-- MonCash records the HTG amount and the exact rate used.
CREATE TABLE fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency CHAR(3) NOT NULL,
  quote_currency CHAR(3) NOT NULL,
  -- Units of quote per one unit of base, e.g. USD->HTG 131.2500000000.
  rate NUMERIC(20, 10) NOT NULL CHECK (rate > 0),
  source TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (base_currency <> quote_currency)
);
CREATE INDEX idx_fx_rates_pair_time
  ON fx_rates (base_currency, quote_currency, effective_at DESC);

ALTER TABLE payouts
  ADD COLUMN payout_currency CHAR(3),
  ADD COLUMN payout_amount_minor BIGINT CHECK (payout_amount_minor > 0),
  ADD COLUMN fx_rate_id UUID REFERENCES fx_rates(id) ON DELETE RESTRICT,
  ADD COLUMN fx_rate NUMERIC(20, 10) CHECK (fx_rate > 0),
  ADD CONSTRAINT payouts_fx_check CHECK (
    payout_currency IS NULL
    OR (payout_currency = currency AND fx_rate IS NULL
        AND payout_amount_minor = amount_minor)
    OR (payout_currency <> currency AND fx_rate IS NOT NULL
        AND payout_amount_minor IS NOT NULL)
  ),
  ADD CONSTRAINT payouts_completed_has_currency_check
    CHECK (status <> 'completed' OR payout_currency IS NOT NULL);

-- updated_at --------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'producer_profiles', 'moncash_accounts',
    'storefronts', 'products', 'orders', 'payouts', 'bank_transfers', 'refunds']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- Foreign-key indexes -----------------------------------------------------
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);
CREATE INDEX idx_ledger_order ON ledger_entries (order_id);
CREATE INDEX idx_refunds_order ON refunds (order_id);
CREATE INDEX idx_product_images_product ON product_images (product_id);
CREATE INDEX idx_moncash_accounts_producer ON moncash_accounts (producer_id);
CREATE INDEX idx_payouts_moncash_account ON payouts (moncash_account_id);
