-- ShipItAyiti — migration 0007
-- Receiving addresses of the Miami and Montréal warehouses, set by admins
-- and shown to customers (with their suite) for Amazon and other stores.
INSERT INTO app_settings (key, value) VALUES ('warehouse_addresses', '{}')
ON CONFLICT (key) DO NOTHING;
