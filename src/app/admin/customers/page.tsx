import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { HAITI_MAP } from "@/components/map-data";
import { listCustomers } from "@/lib/admin/customers";
import { requireStaff } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/index";

export const dynamic = "force-dynamic";

const deptName = (iso: string | null) => HAITI_MAP.departments.find((d) => d.iso === iso)?.name ?? "—";

/** Admin: every customer with their Haiti address (for packaging and delivery). */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireStaff("/admin/customers");
  const { q = "" } = await searchParams;
  const customers = await listCustomers(await getDb(), q);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="customers" />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Customers</h1>
            <p className="mt-1 text-slate-500">Haiti delivery addresses, suites, and contacts. {customers.length} shown.</p>
          </div>
          <form className="flex w-full gap-2 sm:w-auto" action="/admin/customers">
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, email, phone, suite, city…"
              className="min-w-0 flex-1 rounded-xl sm:w-72 sm:flex-none border border-slate-200 bg-white px-3.5 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <button className="rounded-xl bg-navy-900 px-4 font-semibold text-white hover:bg-navy-800">Search</button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Suite</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Address in Haiti</th>
                <th className="px-5 py-3">Phones</th>
                <th className="px-5 py-3 text-right">Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">No customers found.</td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-semibold text-navy-900">
                    <Link href={`/admin/customers/${c.id}`} className="hover:underline">{c.suiteCode ?? "—"}</Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/customers/${c.id}`} className="font-semibold text-navy-900 hover:underline">{c.name}</Link>
                    <span className="block text-xs text-slate-500">{c.email}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium">{c.city ?? "—"}, {deptName(c.department)}</span>
                    {c.neighborhood && <span className="block text-slate-600">{c.neighborhood}</span>}
                    {c.directions && <span className="block text-xs text-slate-500">{c.directions}</span>}
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {c.phone && <span className="block">{c.phone}</span>}
                    {c.haitiPhone && <span className="block text-slate-500">Haiti: {c.haitiPhone}</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">{c.expectedPackages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
