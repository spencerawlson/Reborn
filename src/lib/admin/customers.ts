/**
 * Admin views of customers and package labels. Callers must check the
 * admin role (see requireAdmin in src/lib/auth/admin.ts) — these queries
 * are deliberately not scoped to one customer.
 */
import type { Db } from "../db/index";
import { DEPARTMENTS } from "../shipping/departments";
import type { WarehouseCode } from "../settings/index";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  suiteCode: string | null;
  department: string | null;
  city: string | null;
  neighborhood: string | null;
  directions: string | null;
  haitiPhone: string | null;
  createdAt: Date;
  expectedPackages: number;
}

type Row = {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  suite_code: string | null;
  haiti_department: string | null;
  haiti_city: string | null;
  haiti_neighborhood: string | null;
  haiti_directions: string | null;
  haiti_phone: string | null;
  created_at: Date;
  expected: number | string;
};

const SELECT = `
  SELECT u.id, u.display_name, u.email::text AS email, u.phone, u.created_at,
         p.suite_code, p.haiti_department, p.haiti_city, p.haiti_neighborhood, p.haiti_directions, p.haiti_phone,
         (SELECT count(*) FROM incoming_orders o WHERE o.user_id = u.id AND o.status = 'expected')::int AS expected
    FROM users u
    JOIN roles r ON r.user_id = u.id AND r.role = 'customer'
    LEFT JOIN customer_profiles p ON p.user_id = u.id`;

const toCustomer = (r: Row): CustomerRow => ({
  id: r.id,
  name: r.display_name,
  email: r.email,
  phone: r.phone,
  suiteCode: r.suite_code,
  department: r.haiti_department,
  city: r.haiti_city,
  neighborhood: r.haiti_neighborhood,
  directions: r.haiti_directions,
  haitiPhone: r.haiti_phone,
  createdAt: new Date(r.created_at),
  expectedPackages: Number(r.expected),
});

/** All customers, newest first; optional search on name, email, phone, suite, or city. */
export async function listCustomers(db: Db, q = ""): Promise<CustomerRow[]> {
  const term = q.trim().slice(0, 80);
  if (!term) {
    return (await db.query<Row>(`${SELECT} ORDER BY u.created_at DESC LIMIT 500`)).map(toCustomer);
  }
  const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db.query<Row>(
    `${SELECT}
      WHERE u.display_name ILIKE $1 OR u.email::text ILIKE $1 OR coalesce(u.phone, '') ILIKE $1
         OR coalesce(p.suite_code, '') ILIKE $1 OR coalesce(p.haiti_city, '') ILIKE $1
      ORDER BY u.created_at DESC LIMIT 500`,
    [like],
  );
  return rows.map(toCustomer);
}

export async function getCustomer(db: Db, id: string): Promise<CustomerRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await db.query<Row>(`${SELECT} WHERE u.id = $1`, [id]);
  return rows[0] ? toCustomer(rows[0]) : null;
}

export interface PackageLabel {
  trackingCode: string;
  warehouse: WarehouseCode;
  destinationHub: "PAP" | "CAP" | null;
  store: string;
  orderNumber: string | null;
  inboundTracking: string | null;
  description: string | null;
  declaredValueMinor: bigint | null;
  customer: CustomerRow;
}

/** Everything that goes on a package's shipping label. */
export async function getPackageLabel(db: Db, orderId: string): Promise<PackageLabel | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const rows = await db.query<{
    user_id: string;
    tracking_code: string;
    warehouse: WarehouseCode;
    store: string;
    order_number: string | null;
    tracking_number: string | null;
    description: string | null;
    declared_value_minor: string | null;
  }>(
    `SELECT user_id, tracking_code, warehouse, store, order_number, tracking_number, description,
            declared_value_minor::text AS declared_value_minor
       FROM incoming_orders WHERE id = $1`,
    [orderId],
  );
  const o = rows[0];
  if (!o) return null;
  const customer = await getCustomer(db, o.user_id);
  if (!customer) return null;
  return {
    trackingCode: o.tracking_code,
    warehouse: o.warehouse,
    destinationHub: customer.department ? (DEPARTMENTS[customer.department]?.nearest ?? null) : null,
    store: o.store,
    orderNumber: o.order_number,
    inboundTracking: o.tracking_number,
    description: o.description,
    declaredValueMinor: o.declared_value_minor === null ? null : BigInt(o.declared_value_minor),
    customer,
  };
}
