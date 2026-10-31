import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { requireStaff } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/index";
import { t } from "@/lib/i18n/index";
import { listShippedPackages } from "@/lib/orders/index";

export const dynamic = "force-dynamic";

/** Staff delivery view: Shipped packages only, ready to hand over. */
export default async function AdminDeliveriesPage() {
  const session = await requireStaff("/admin/deliveries");
  const locale = "en" as const;
  const packages = await listShippedPackages(await getDb());
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="deliveries" />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{t(locale, "adminDeliveriesTitle")}</h1>
        <p className="mt-1 text-slate-500">{t(locale, "adminDeliveriesBody")}</p>
        {packages.length === 0 ? (
          <p className="mt-8 text-sm text-slate-400">{t(locale, "adminNoDeliveries")}</p>
        ) : (
          <div className="mt-6 grid gap-3">
            {packages.map((p) => (
              <Link key={p.id} href={`/admin/deliveries/${p.id}`} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 hover:ring-slate-300">
                <p className="font-semibold text-navy-900">{p.customerName} · Suite {p.suiteCode ?? "—"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {p.store}{p.description ? ` · ${p.description}` : ""}
                  {p.trackingNumber ? ` · ${p.trackingNumber}` : ""}
                </p>
                <p className="mt-1 text-sm text-slate-500">{p.notifyPhone ?? p.customerPhone ?? "—"} · {p.warehouse}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
