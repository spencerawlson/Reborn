import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { OrderProgress } from "@/components/OrderProgress";
import { SignaturePad } from "@/components/SignaturePad";
import { requireStaff } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/index";
import { t } from "@/lib/i18n/index";
import { getStaffPackage } from "@/lib/orders/index";
import { getPackageLabel } from "@/lib/admin/customers";

export const dynamic = "force-dynamic";

/**
 * Delivery handover: staff open a Shipped package, hand the phone to the
 * customer, the customer signs and gives their name, Done marks it
 * Delivered. Packages not yet Shipped cannot be delivered from here.
 */
export default async function AdminDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireStaff(`/admin/deliveries/${id}`);
  const locale = "en" as const;
  const db = await getDb();
  const pkg = await getStaffPackage(db, id);
  if (!pkg) notFound();
  const label = await getPackageLabel(db, id);
  if (pkg.status !== "shipped") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminHeader session={session} current="deliveries" />
        <main className="mx-auto max-w-3xl px-5 py-10">
          <p className="text-sm text-slate-500">This package is not ready for delivery (status: {pkg.status}).</p>
          <p className="mt-4"><Link href="/admin/deliveries" className="font-semibold text-blue-700 hover:underline">← {t(locale, "adminDeliveriesTitle")}</Link></p>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="deliveries" />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin/deliveries" className="text-sm font-semibold text-blue-700 hover:underline">← {t(locale, "adminDeliveriesTitle")}</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy-900">{pkg.customerName}</h1>
        <p className="mt-1 text-slate-500">
          Suite {pkg.suiteCode ?? "—"} · {pkg.store}{pkg.description ? ` · ${pkg.description}` : ""}
        </p>
        {label && (
          <p className="mt-1 text-sm text-slate-500">
            {[label.customer.neighborhood, label.customer.city].filter(Boolean).join(", ")}
            {label.customer.department ? ` — ${label.customer.department}` : ""}, Haïti
            <span className="block">{label.customer.haitiPhone || label.customer.phone}</span>
          </p>
        )}
        <OrderProgress status={pkg.status} labels={{ expected: "Expected", received: "Received", repackaging: "Repackaging", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" }} />
        <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-navy-900">{t(locale, "adminSignatureTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t(locale, "adminSignatureBody")}</p>
          <div className="mt-5">
            <SignaturePad
              orderId={pkg.id}
              signerLabel={t(locale, "adminSignerName")}
              clearLabel={t(locale, "adminSignatureClear")}
              doneLabel={t(locale, "adminSignatureDone")}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
