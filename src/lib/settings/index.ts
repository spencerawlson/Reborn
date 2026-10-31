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
