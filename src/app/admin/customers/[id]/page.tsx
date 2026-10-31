import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { HAITI_MAP } from "@/components/map-data";
import { getCustomer } from "@/lib/admin/customers";
import { requireStaff } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/index";
import { formatMoney } from "@/lib/money/index";
import { listOrders } from "@/lib/orders/index";
import { DEPARTMENTS, WAREHOUSE_NAME } from "@/lib/shipping/departments";

export const dynamic = "force-dynamic";

/** Admin: one customer — full Haiti address, contacts, and packages with label links. */
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireStaff(`/admin/customers/${id}`);
  const db = await getDb();
  const customer = await getCustomer(db, id);
  if (!customer) notFound();
  const orders = await listOrders(db, customer.id);
  const dept = HAITI_MAP.departments.find((d) => d.iso === customer.department)?.name;
  const hub = customer.department ? DEPARTMENTS[customer.department]?.nearest : undefined;

  const field = (label: string, value: string | null | undefined) => (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="customers" />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/admin/customers" className="text-sm font-semibold text-blue-700">← All customers</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{customer.name}</h1>
          <span className="rounded-full bg-navy-900 px-3 py-1 font-mono text-sm font-semibold text-white">{customer.suiteCode}</span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="font-semibold text-navy-900">Delivery address in Haiti</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {field("Department", dept)}
              {field("City / commune", customer.city)}
              {field("Neighbourhood", customer.neighborhood)}
              {field("Phone in Haiti", customer.haitiPhone)}
              <div className="sm:col-span-2">{field("Directions and landmarks", customer.directions)}</div>
              {field("Destination hub", hub ? `${WAREHOUSE_NAME[hub]} (${hub})` : null)}
            </dl>
          </section>
          <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="font-semibold text-navy-900">Contact</h2>
            <dl className="mt-4 grid gap-4">
              {field("Email", customer.email)}
              {field("Phone (WhatsApp)", customer.phone)}
              {field("Customer since", customer.createdAt.toLocaleDateString("en-CA", { dateStyle: "medium" }))}
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="font-semibold text-navy-900">Packages · {orders.length}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Tracking</th>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">No packages yet.</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 pr-4 font-mono font-semibold text-navy-900">{o.trackingCode}<span className="ml-2 font-sans text-xs font-normal text-slate-400">{o.warehouse}</span></td>
                    <td className="py-3 pr-4">
                      {o.store}{o.description ? ` · ${o.description}` : ""}
                      {o.trackingNumber && <span className="block font-mono text-xs text-slate-400">{o.trackingNumber}</span>}
                    </td>
                    <td className="py-3 pr-4 capitalize">{o.status}</td>
                    <td className="py-3 pr-4">{o.declaredValueMinor === null ? "—" : formatMoney(o.declaredValueMinor, "USD")}</td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/labels/${o.id}`} className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                        Label
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
