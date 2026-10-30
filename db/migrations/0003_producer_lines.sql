-- Global Haitian Producer Marketplace — migration 0003
-- Producer ledger lines must say whose money they are. A balanced group
-- with an unattributed producer line would vanish from every balance.

ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_producer_line_check
  CHECK (account NOT IN ('producer_pending', 'producer_available') OR producer_id IS NOT NULL);
