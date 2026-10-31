-- ShipItAyiti — migration 0004
-- Customer accounts (Haiti address on file + personal suite number),
-- login sessions, and operational settings (door-to-door switch).

ALTER TABLE users ADD COLUMN phone TEXT;

-- Personal suite numbers for online-store forwarding: SIA-10001, SIA-10002, …
CREATE SEQUENCE suite_number_seq START 10001;

CREATE TABLE customer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  suite_code TEXT NOT NULL UNIQUE DEFAULT ('SIA-' || nextval('suite_number_seq')),
  haiti_department CHAR(5) NOT NULL CHECK (haiti_department IN
    ('HT-NO', 'HT-ND', 'HT-NE', 'HT-AR', 'HT-CE', 'HT-OU', 'HT-GA', 'HT-NI', 'HT-SD', 'HT-SE')),
  haiti_city TEXT NOT NULL CHECK (length(haiti_city) BETWEEN 1 AND 120),
  haiti_neighborhood TEXT CHECK (length(haiti_neighborhood) <= 120),
  haiti_directions TEXT CHECK (length(haiti_directions) <= 500),
  haiti_phone TEXT CHECK (length(haiti_phone) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sessions store only a SHA-256 of the cookie token, never the token.
CREATE TABLE sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- Operational switches set by admins; every change is audit-logged.
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO app_settings (key, value) VALUES ('door_delivery', '{"locked": false, "reason": null}');
