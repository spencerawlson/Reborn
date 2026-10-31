-- ShipItAyiti — migration 0005
-- Incoming online-store orders ("pre-alerts") declared by customers, so
-- the Miami / Montréal warehouse can match packages to suites — with an
-- optional delivery one-time code (OTP) that some stores (e.g. Amazon)
-- require from the recipient; staff give it to the driver.

CREATE TABLE incoming_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  warehouse CHAR(3) NOT NULL CHECK (warehouse IN ('MIA', 'YUL')),
  store TEXT NOT NULL CHECK (length(store) BETWEEN 1 AND 80),
  order_number TEXT CHECK (length(order_number) <= 80),
  tracking_number TEXT CHECK (length(tracking_number) <= 80),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 300),
  declared_value_minor BIGINT CHECK (declared_value_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  delivery_otp TEXT CHECK (delivery_otp ~ '^[A-Za-z0-9]{4,10}$'),
  otp_updated_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'expected'
    CHECK (status IN ('expected', 'received', 'cancelled')),
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incoming_orders_user ON incoming_orders (user_id, created_at DESC);
CREATE INDEX idx_incoming_orders_status ON incoming_orders (status, warehouse);
CREATE TRIGGER trg_incoming_orders_updated_at
  BEFORE UPDATE ON incoming_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
