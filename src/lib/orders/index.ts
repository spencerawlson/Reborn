/**
 * Incoming online-store orders declared by customers (pre-alerts), with an
 * optional delivery one-time code (OTP). Every customer query is scoped to
 * the customer's own user id; staff views are admin-only (caller checks).
 */
import type { Db } from "../db/index";
import type { DictionaryKey } from "../i18n/index";
import { findProhibited } from "../shipping/prohibited";

export type Warehouse = "MIA" | "YUL";

export interface OrderInput {
  warehouse: string;
  store: string;
  orderNumber: string;
  trackingNumber: string;
  description: string;
  value: string; // dollars as typed, e.g. "49.99"
}

export interface IncomingOrder {
  id: string;
  warehouse: Warehouse;
  store: string;
  orderNumber: string | null;
  trackingNumber: string | null;
  description: string | null;
  declaredValueMinor: bigint | null;
  deliveryOtp: string | null;
  otpUpdatedAt: Date | null;
  status: "expected" | "received" | "cancelled";
  createdAt: Date;
}

export interface ExpectedPackage extends IncomingOrder {
  suiteCode: string | null;
  customerName: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const OTP = /^[A-Za-z0-9]{4,10}$/;

export function isOrderId(value: string): boolean {
  return UUID.test(value);
}

/** "49.99" → 4999n; "" → null; anything else → undefined (invalid). No floats. */
export function parseDollars(value: string): bigint | null | undefined {
  const v = value.trim();
  if (!v) return null;
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(v);
  if (!m) return undefined;
  return BigInt(m[1]) * 100n + BigInt((m[2] ?? "").padEnd(2, "0"));
}

export function validateOrder(input: OrderInput): DictionaryKey | null {
  if (input.warehouse !== "MIA" && input.warehouse !== "YUL") return "errRequired";
  if (!input.store.trim()) return "errRequired";
  if (input.store.length > 80 || input.orderNumber.length > 80 || input.trackingNumber.length > 80) return "errRequired";
  if (input.description.length > 300) return "errRequired";
  if (parseDollars(input.value) === undefined) return "errValue";
  return null;
}

type Row = {
  id: string;
  warehouse: Warehouse;
  store: string;
  order_number: string | null;
  tracking_number: string | null;
  description: string | null;
  declared_value_minor: string | number | null;
  delivery_otp: string | null;
  otp_updated_at: Date | null;
  status: IncomingOrder["status"];
  created_at: Date;
};

const COLUMNS = `o.id, o.warehouse, o.store, o.order_number, o.tracking_number, o.description,
  o.declared_value_minor::text AS declared_value_minor, o.delivery_otp, o.otp_updated_at, o.status, o.created_at`;

function toOrder(r: Row): IncomingOrder {
  return {
    id: r.id,
    warehouse: r.warehouse,
    store: r.store,
    orderNumber: r.order_number,
    trackingNumber: r.tracking_number,
    description: r.description,
    declaredValueMinor: r.declared_value_minor === null ? null : BigInt(r.declared_value_minor),
    deliveryOtp: r.delivery_otp,
    otpUpdatedAt: r.otp_updated_at ? new Date(r.otp_updated_at) : null,
    status: r.status,
    createdAt: new Date(r.created_at),
  };
}

export async function createOrder(
  db: Db,
  userId: string,
  input: OrderInput,
): Promise<{ ok: true; id: string } | { ok: false; error: DictionaryKey; prohibited?: string }> {
  const invalid = validateOrder(input);
  if (invalid) return { ok: false, error: invalid };
  // Block declared prohibited items (store name included, e.g. "Gun shop").
  const banned = findProhibited(`${input.description} ${input.store}`);
  if (banned) return { ok: false, error: "errProhibited", prohibited: banned.id };
  const blank = (s: string) => (s.trim() ? s.trim() : null);
  const value = parseDollars(input.value);
  const rows = await db.query<{ id: string }>(
    `INSERT INTO incoming_orders (user_id, warehouse, store, order_number, tracking_number, description, declared_value_minor)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      userId,
      input.warehouse,
      input.store.trim(),
      blank(input.orderNumber),
      blank(input.trackingNumber),
      blank(input.description),
      value === null || value === undefined ? null : value.toString(),
    ],
  );
  return { ok: true, id: rows[0].id };
}

export async function listOrders(db: Db, userId: string): Promise<IncomingOrder[]> {
  const rows = await db.query<Row>(
    `SELECT ${COLUMNS} FROM incoming_orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC LIMIT 100`,
    [userId],
  );
  return rows.map(toOrder);
}

export async function getOrder(db: Db, userId: string, id: string): Promise<IncomingOrder | null> {
  if (!isOrderId(id)) return null;
  const rows = await db.query<Row>(`SELECT ${COLUMNS} FROM incoming_orders o WHERE o.id = $1 AND o.user_id = $2`, [id, userId]);
  return rows[0] ? toOrder(rows[0]) : null;
}

/** Set or clear the delivery code. Only the owner, only while the package is still expected. */
export async function setOrderOtp(
  db: Db,
  userId: string,
  id: string,
  otp: string,
): Promise<{ ok: true } | { ok: false; error: DictionaryKey }> {
  const code = otp.trim();
  if (code && !OTP.test(code)) return { ok: false, error: "orderOtpInvalid" };
  if (!isOrderId(id)) return { ok: false, error: "errRequired" };
  const rows = await db.query<{ id: string }>(
    `UPDATE incoming_orders SET delivery_otp = $3, otp_updated_at = now()
      WHERE id = $1 AND user_id = $2 AND status = 'expected' RETURNING id`,
    [id, userId, code || null],
  );
  return rows.length ? { ok: true } : { ok: false, error: "errRequired" };
}

/** Admin / warehouse view: everything still expected, with suite and delivery code. */
export async function listExpectedPackages(db: Db): Promise<ExpectedPackage[]> {
  const rows = await db.query<Row & { suite_code: string | null; display_name: string }>(
    `SELECT ${COLUMNS}, p.suite_code, u.display_name
       FROM incoming_orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN customer_profiles p ON p.user_id = o.user_id
      WHERE o.status = 'expected'
      ORDER BY o.warehouse, o.created_at
      LIMIT 500`,
  );
  return rows.map((r) => ({ ...toOrder(r), suiteCode: r.suite_code, customerName: r.display_name }));
}
