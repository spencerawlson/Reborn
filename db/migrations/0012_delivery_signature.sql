-- ShipItAyiti — migration 0012
-- Delivery is confirmed by the customer's signature, not by a manual
-- button: when a Shipped package is handed over, staff record who signed
-- and the signature image, and the package becomes Delivered at that
-- moment. The signature is proof for the History report.

ALTER TABLE incoming_orders ADD COLUMN delivery_signer_name TEXT CHECK (delivery_signer_name IS NULL OR length(delivery_signer_name) <= 120);
ALTER TABLE incoming_orders ADD COLUMN delivery_signature_data TEXT;
ALTER TABLE incoming_orders ADD COLUMN delivery_signed_at TIMESTAMPTZ;
