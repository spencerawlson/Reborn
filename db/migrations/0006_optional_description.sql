-- ShipItAyiti — migration 0006
-- "What's inside" becomes optional (recommended) on incoming orders.
-- Every package is still inspected at the warehouse.

ALTER TABLE incoming_orders ALTER COLUMN description DROP NOT NULL;
ALTER TABLE incoming_orders DROP CONSTRAINT incoming_orders_description_check;
ALTER TABLE incoming_orders ADD CONSTRAINT incoming_orders_description_check
  CHECK (description IS NULL OR length(description) BETWEEN 1 AND 300);
