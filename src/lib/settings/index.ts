/**
 * Operational settings changed by admins. Every change is written to the
 * audit log in the same statement.
 */
import type { Db } from "../db/index";

export interface DoorDelivery {
  locked: boolean;
  reason: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

/** Door-to-door delivery in Haiti: when locked, customers can only choose warehouse pickup. */
export async function getDoorDelivery(db: Db): Promise<DoorDelivery> {
  const rows = await db.query<{ value: { locked?: boolean; reason?: string | null }; updated_at: Date; updated_by_name: string | null }>(
    `SELECT s.value, s.updated_at, u.display_name AS updated_by_name
       FROM app_settings s LEFT JOIN users u ON u.id = s.updated_by
      WHERE s.key = 'door_delivery'`,
  );
  const row = rows[0];
  // Drivers differ in how they return jsonb; accept an object or its JSON text.
  const value = typeof row?.value === "string" ? (JSON.parse(row.value) as { locked?: boolean; reason?: string | null }) : row?.value;
  return {
    locked: value?.locked === true,
    reason: value?.reason ?? null,
    updatedAt: row ? new Date(row.updated_at) : null,
    updatedBy: row?.updated_by_name ?? null,
  };
}

export async function setDoorDelivery(db: Db, args: { locked: boolean; reason: string | null; adminId: string }): Promise<void> {
  // Sent as text and cast in SQL (::text::jsonb) so no driver can JSON-encode it twice.
  const value = JSON.stringify({ locked: args.locked, reason: args.reason?.trim().slice(0, 300) || null });
  await db.query(
    `WITH before AS (
       SELECT value FROM app_settings WHERE key = 'door_delivery'
     ), upd AS (
       INSERT INTO app_settings (key, value, updated_by, updated_at)
       VALUES ('door_delivery', $1::text::jsonb, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
       RETURNING value
     )
     INSERT INTO audit_log (actor_user_id, action, entity_type, before_json, after_json)
     SELECT $2, CASE WHEN ($1::text::jsonb ->> 'locked')::boolean THEN 'door_delivery.lock' ELSE 'door_delivery.unlock' END,
            'app_settings', (SELECT value FROM before), (SELECT value FROM upd)`,
    [value, args.adminId],
  );
}

/* Warehouse receiving addresses ------------------------------------------ */

export type WarehouseCode = "MIA" | "YUL";

export interface WarehouseAddress {
  street: string;
  city: string;
  region: string; // state or province, e.g. FL, QC
  postalCode: string;
  country: string;
  phone: string;
}

export type WarehouseAddresses = Partial<Record<WarehouseCode, WarehouseAddress>>;

export const WAREHOUSE_CODES: WarehouseCode[] = ["MIA", "YUL"];
const FIELDS: (keyof WarehouseAddress)[] = ["street", "city", "region", "postalCode", "country", "phone"];

/** Returns the field that is missing or too long, or null when the address is valid (phone optional). */
export function validateWarehouseAddress(a: WarehouseAddress): keyof WarehouseAddress | null {
  for (const f of FIELDS) {
    const v = a[f].trim();
    if (f !== "phone" && !v) return f;
    if (v.length > 120) return f;
  }
  return null;
}

export async function getWarehouseAddresses(db: Db): Promise<WarehouseAddresses> {
  const rows = await db.query<{ value: unknown }>(`SELECT value FROM app_settings WHERE key = 'warehouse_addresses'`);
  const raw = rows[0]?.value;
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  return (value ?? {}) as WarehouseAddresses;
}

/** Admin only (caller checks). Audit-logged in the same statement. */
export async function setWarehouseAddresses(db: Db, addresses: WarehouseAddresses, adminId: string): Promise<void> {
  const clean: WarehouseAddresses = {};
  for (const code of WAREHOUSE_CODES) {
    const a = addresses[code];
    if (a) clean[code] = Object.fromEntries(FIELDS.map((f) => [f, a[f].trim()])) as unknown as WarehouseAddress;
  }
  await db.query(
    `WITH before AS (
       SELECT value FROM app_settings WHERE key = 'warehouse_addresses'
     ), upd AS (
       INSERT INTO app_settings (key, value, updated_by, updated_at)
       VALUES ('warehouse_addresses', $1::text::jsonb, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
       RETURNING value
     )
     INSERT INTO audit_log (actor_user_id, action, entity_type, before_json, after_json)
     SELECT $2, 'warehouse_addresses.update', 'app_settings', (SELECT value FROM before), (SELECT value FROM upd)`,
    [JSON.stringify(clean), adminId],
  );
}
