/**
 * Incoming online-store orders declared by customers (pre-alerts), with an
 * optional delivery one-time code (OTP). Every customer query is scoped to
 * the customer's own user id; staff views are admin-only (caller checks).
 */
import type { Db } from "../db/index";
import type { DictionaryKey } from "../i18n/index";
import {
  notifyNewOrder,
  sendOrderStatusWhatsApp,
  type OrderAlertDetails,
  type OrderStatusUpdate,
} from "../notify/index";
import { findProhibited } from "../shipping/prohibited";

export type Warehouse = "MIA" | "YUL";

export type OrderStatus = "expected" | "received" | "repackaging" | "shipped" | "delivered" | "cancelled";

/** The only forward step allowed from each active status. */
export const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  expected: "received",
  received: "repackaging",
  repackaging: "shipped",
  shipped: "delivered",
};

export const ORDER_STATUS_WORD: Record<OrderStatus, string> = {
  expected: "Expected",
  received: "Received",
  repackaging: "Repackaging",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface OrderInput {
  warehouse: string;
  store: string;
  orderNumber: string;
  trackingNumber: string;
  description: string;
  value: string; // dollars as typed, e.g. "49.99"
  /** Phone for WhatsApp status updates, per order; blank falls back to the account phone. */
  notifyPhone?: string;
}

export interface IncomingOrder {
  id: string;
  trackingCode: string;
  warehouse: Warehouse;
  store: string;
  orderNumber: string | null;
  trackingNumber: string | null;
  description: string | null;
  declaredValueMinor: bigint | null;
  deliveryOtp: string | null;
  otpUpdatedAt: Date | null;
  status: OrderStatus;
  notifyPhone: string | null;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deliverySignerName: string | null;
  deliverySignatureData: string | null;
  deliverySignedAt: Date | null;
}

export interface ExpectedPackage extends IncomingOrder {
  userId: string;
  suiteCode: string | null;
  customerName: string;
  /** Account phone (fallback when the order has no per-order phone). */
  customerPhone: string | null;
}

export interface OrderStatusHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedAt: Date;
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
  if ((input.notifyPhone ?? "").trim().length > 40) return "errRequired";
  if (parseDollars(input.value) === undefined) return "errValue";
  return null;
}

type Row = {
  id: string;
  tracking_code: string;
  warehouse: Warehouse;
  store: string;
  order_number: string | null;
  tracking_number: string | null;
  description: string | null;
  declared_value_minor: string | number | null;
  delivery_otp: string | null;
  otp_updated_at: Date | null;
  status: IncomingOrder["status"];
  notify_phone: string | null;
  received_at: Date | null;
  created_at: Date;
  updated_at: Date;
  delivery_signer_name: string | null;
  delivery_signature_data: string | null;
  delivery_signed_at: Date | null;
};

const COLUMNS = `o.id, o.tracking_code, o.warehouse, o.store, o.order_number, o.tracking_number, o.description,
  o.declared_value_minor::text AS declared_value_minor, o.delivery_otp, o.otp_updated_at, o.status,
  o.notify_phone, o.received_at, o.created_at, o.updated_at,
  o.delivery_signer_name, o.delivery_signature_data, o.delivery_signed_at`;

function toOrder(r: Row): IncomingOrder {
  return {
    id: r.id,
    trackingCode: r.tracking_code,
    warehouse: r.warehouse,
    store: r.store,
    orderNumber: r.order_number,
    trackingNumber: r.tracking_number,
    description: r.description,
    declaredValueMinor: r.declared_value_minor === null ? null : BigInt(r.declared_value_minor),
    deliveryOtp: r.delivery_otp,
    otpUpdatedAt: r.otp_updated_at ? new Date(r.otp_updated_at) : null,
    status: r.status,
    notifyPhone: r.notify_phone,
    receivedAt: r.received_at ? new Date(r.received_at) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    deliverySignerName: r.delivery_signer_name,
    deliverySignatureData: r.delivery_signature_data,
    deliverySignedAt: r.delivery_signed_at ? new Date(r.delivery_signed_at) : null,
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
    `INSERT INTO incoming_orders (user_id, warehouse, store, order_number, tracking_number, description, declared_value_minor, notify_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      userId,
      input.warehouse,
      input.store.trim(),
      blank(input.orderNumber),
      blank(input.trackingNumber),
      blank(input.description),
      value === null || value === undefined ? null : value.toString(),
      blank(input.notifyPhone ?? ""),
    ],
  );
  // Best-effort admin alert (email + WhatsApp, when configured). A failure
  // here must never fail the order itself — the order already succeeded.
  try {
    const info = await db.query<Row & { display_name: string; suite_code: string | null }>(
      `SELECT ${COLUMNS}, u.display_name, p.suite_code
         FROM incoming_orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN customer_profiles p ON p.user_id = o.user_id
        WHERE o.id = $1`,
      [rows[0].id],
    );
    const r = info[0];
    if (r) {
      const order = toOrder(r);
      const details: OrderAlertDetails = {
        trackingCode: order.trackingCode,
        warehouse: order.warehouse,
        store: order.store,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        description: order.description,
        declaredValueMinor: order.declaredValueMinor,
        customerName: r.display_name,
        suiteCode: r.suite_code,
      };
      await notifyNewOrder(details);
    }
  } catch {
    // Alert only — the order already succeeded.
  }
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
  const rows = await db.query<Row & { user_id: string; suite_code: string | null; display_name: string; phone: string | null }>(
    `SELECT ${COLUMNS}, o.user_id, p.suite_code, u.display_name, u.phone
       FROM incoming_orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN customer_profiles p ON p.user_id = o.user_id
      WHERE o.status = 'expected'
      ORDER BY o.warehouse, o.created_at
      LIMIT 500`,
  );
  return rows.map((r) => ({ ...toOrder(r), userId: r.user_id, suiteCode: r.suite_code, customerName: r.display_name, customerPhone: r.phone }));
}

type StaffRow = Row & { user_id: string; suite_code: string | null; display_name: string; phone: string | null };

function toStaffPackage(r: StaffRow): ExpectedPackage {
  return { ...toOrder(r), userId: r.user_id, suiteCode: r.suite_code, customerName: r.display_name, customerPhone: r.phone };
}

/** Admin view: packages received, being repackaged, or shipped — active work, not Expected and not History. */
export async function listInProgressPackages(db: Db): Promise<ExpectedPackage[]> {
  const rows = await db.query<StaffRow>(
    `SELECT ${COLUMNS}, o.user_id, p.suite_code, u.display_name, u.phone
       FROM incoming_orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN customer_profiles p ON p.user_id = o.user_id
      WHERE o.status IN ('received', 'repackaging', 'shipped')
      ORDER BY o.updated_at DESC
      LIMIT 500`,
  );
  return rows.map(toStaffPackage);
}

/** History view: delivered (and cancelled) packages only. Reports are pulled from here. */
export async function listHistoryPackages(db: Db): Promise<ExpectedPackage[]> {
  const rows = await db.query<StaffRow>(
    `SELECT ${COLUMNS}, o.user_id, p.suite_code, u.display_name, u.phone
       FROM incoming_orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN customer_profiles p ON p.user_id = o.user_id
      WHERE o.status IN ('delivered', 'cancelled')
      ORDER BY o.updated_at DESC
      LIMIT 500`,
  );
  return rows.map(toStaffPackage);
}

/** Status changes for one order, oldest first, for the History report. */
export async function listOrderStatusHistory(db: Db, orderId: string): Promise<OrderStatusHistoryEntry[]> {
  if (!isOrderId(orderId)) return [];
  const rows = await db.query<{ from_status: OrderStatus | null; to_status: OrderStatus; changed_at: Date }>(
    `SELECT from_status, to_status, changed_at FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC`,
    [orderId],
  );
  return rows.map((r) => ({ fromStatus: r.from_status, toStatus: r.to_status, changedAt: new Date(r.changed_at) }));
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number }>;
const defaultFetch: FetchImpl = (url, init) =>
  fetch(url, init).then((r) => ({ ok: r.ok, status: r.status }));

/** Staff view of one package by id, regardless of status. */
export async function getStaffPackage(db: Db, orderId: string): Promise<ExpectedPackage | null> {
  if (!isOrderId(orderId)) return null;
  const rows = await db.query<StaffRow>(
    `SELECT ${COLUMNS}, o.user_id, p.suite_code, u.display_name, u.phone
       FROM incoming_orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN customer_profiles p ON p.user_id = o.user_id
      WHERE o.id = $1`,
    [orderId],
  );
  return rows.length ? toStaffPackage(rows[0]) : null;
}

/** Packages ready to hand over: Shipped only. */
export async function listShippedPackages(db: Db): Promise<ExpectedPackage[]> {
  const rows = await db.query<StaffRow>(
    `SELECT ${COLUMNS}, o.user_id, p.suite_code, u.display_name, u.phone
       FROM incoming_orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN customer_profiles p ON p.user_id = o.user_id
      WHERE o.status = 'shipped'
      ORDER BY o.updated_at DESC
      LIMIT 500`,
  );
  return rows.map(toStaffPackage);
}

export interface DeliverySignature {
  name: string;
  /** PNG data URL from the signature pad. */
  data: string;
}

/**
 * Staff-only status step (caller checks staff). Only the next step in the
 * flow is allowed, so a package cannot skip or go backwards. Delivered is
 * special: it is only reached with a customer signature (name + image);
 * there is no manual delivered button. The change is recorded in
 * order_status_history, the customer sees the new status in their app,
 * and — best-effort, never blocking the change — they get a WhatsApp to
 * the order's phone field, falling back to their account phone.
 */
export async function setOrderStatus(
  db: Db,
  staffUserId: string | null,
  orderId: string,
  toStatus: OrderStatus,
  fetchImpl: FetchImpl = defaultFetch,
  signature?: DeliverySignature,
): Promise<{ ok: true; status: OrderStatus } | { ok: false; error: DictionaryKey }> {
  if (!isOrderId(orderId)) return { ok: false, error: "errRequired" };
  if (toStatus === "delivered" && (!signature?.name.trim() || !signature?.data.trim())) {
    return { ok: false, error: "errRequired" };
  }
  const current = await db.query<{ status: OrderStatus }>(`SELECT status FROM incoming_orders WHERE id = $1`, [orderId]);
  if (current.length === 0) return { ok: false, error: "errRequired" };
  const fromStatus = current[0].status;
  if (NEXT_ORDER_STATUS[fromStatus] !== toStatus) return { ok: false, error: "errRequired" };
  const updated = await db.query<{ id: string }>(
    `WITH updated AS (
       UPDATE incoming_orders
          SET status = $2::varchar,
              received_at = CASE WHEN $2::varchar = 'received' THEN now() ELSE received_at END,
              delivery_signer_name = CASE WHEN $2::varchar = 'delivered' THEN $5::varchar ELSE delivery_signer_name END,
              delivery_signature_data = CASE WHEN $2::varchar = 'delivered' THEN $6::text ELSE delivery_signature_data END,
              delivery_signed_at = CASE WHEN $2::varchar = 'delivered' THEN now() ELSE delivery_signed_at END
        WHERE id = $1::uuid AND status = $3::varchar
        RETURNING id
     )
     INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
     SELECT id, $3::varchar, $2::varchar, $4::uuid FROM updated RETURNING order_id AS id`,
    [orderId, toStatus, fromStatus, staffUserId, signature?.name.trim() ?? null, signature?.data.trim() ?? null],
  );
  if (updated.length === 0) return { ok: false, error: "errRequired" };
  // Customer notification: in-app status is already visible; WhatsApp is best-effort.
  try {
    const info = await db.query<Row & { display_name: string; phone: string | null }>(
      `SELECT ${COLUMNS}, u.display_name, u.phone
         FROM incoming_orders o JOIN users u ON u.id = o.user_id
        WHERE o.id = $1`,
      [orderId],
    );
    const r = info[0];
    if (r) {
      const order = toOrder(r);
      const to = order.notifyPhone?.trim() || r.phone;
      if (to) {
        const update: OrderStatusUpdate = {
          trackingCode: order.trackingCode,
          store: order.store,
          customerName: r.display_name,
          status: ORDER_STATUS_WORD[toStatus],
        };
        await sendOrderStatusWhatsApp(fetchImpl, update, to);
      }
    }
  } catch {
    // Notification only — the status change already succeeded.
  }
  return { ok: true, status: toStatus };
}
