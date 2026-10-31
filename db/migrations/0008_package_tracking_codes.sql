-- ShipItAyiti — migration 0008
-- Every incoming package gets a ShipItAyiti tracking code for its label
-- (SIA-T00000001, …). Existing rows receive codes too (volatile default is
-- evaluated per row).
CREATE SEQUENCE package_tracking_seq START 1;
ALTER TABLE incoming_orders
  ADD COLUMN tracking_code TEXT UNIQUE
    DEFAULT ('SIA-T' || lpad(nextval('package_tracking_seq')::text, 8, '0'));
ALTER TABLE incoming_orders ALTER COLUMN tracking_code SET NOT NULL;
