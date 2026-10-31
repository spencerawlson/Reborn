-- ShipItAyiti — migration 0011
-- Admin status flow for incoming orders (pre-alerts): a package moves
-- Expected -> Received -> Repackaging -> Shipped -> Delivered. Only
-- Delivered (and Cancelled) leave the active admin lists; they live in
-- History, from which reports are pulled. Each change is recorded in
-- order_status_history so the full journey is reportable.
-- Customers also give a phone number per order ("Phone field") for
-- WhatsApp status updates; blank falls back to the account phone.

ALTER TABLE incoming_orders DROP CONSTRAINT IF EXISTS incoming_orders_status_check;
ALTER TABLE incoming_orders ADD CONSTRAINT incoming_orders_status_check
  CHECK (status IN ('expected', 'received', 'repackaging', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE incoming_orders ADD COLUMN notify_phone TEXT CHECK (notify_phone IS NULL OR length(notify_phone) <= 40);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES incoming_orders(id) ON DELETE RESTRICT,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL
    CHECK (to_status IN ('expected', 'received', 'repackaging', 'shipped', 'delivered', 'cancelled')),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_status_history_order ON order_status_history (order_id, changed_at);
