-- ShipItAyiti — migration 0009
-- Staff accounts (separate from customers): a "staff" role, and single-use
-- invitations an admin sends to team members. Only a SHA-256 of each
-- invitation token is stored.

ALTER TABLE roles DROP CONSTRAINT roles_role_check;
ALTER TABLE roles ADD CONSTRAINT roles_role_check
  CHECK (role IN ('admin', 'staff', 'producer', 'customer'));

CREATE TABLE staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_staff_invitations_email ON staff_invitations (email);
