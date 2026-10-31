-- ShipItAyiti — migration 0010
-- The Haiti delivery address on a customer profile is optional: customers
-- live all over the world (diaspora), not only in Haiti. An account can be
-- created without one and add it later from the account page. The CHECKs
-- already pass on NULL, so only the NOT NULL constraints go.

ALTER TABLE customer_profiles ALTER COLUMN haiti_department DROP NOT NULL;
ALTER TABLE customer_profiles ALTER COLUMN haiti_city DROP NOT NULL;
