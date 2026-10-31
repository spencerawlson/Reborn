import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { requireStaff } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/index";
import { t } from "@/lib/i18n/index";
import { listHistoryPackages, type OrderStatus } from "@/lib/orders/index";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  expected: "orderStatusExpected",
  received: "orderStatusReceived",
  repackaging: "orderStatusRepackaging",
  shipped: "orderStatusShipped",
  delivered: "orderStatusDelivered",
  cancelled: "orderStatusCancelled",
};

/**
 * History: delivered and cancelled packages only. Active packages live on
 * the Dashboard (Expected / In progress); this page is where reports are
 * pulled from, including the CSV download.
 */
export default async function AdminHistoryPage() {
  const session = await requireStaff("/admin/history");
  const locale = "en" as const;
  const history = await listHistoryPackages(await getDb());
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="history" />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{t(locale, "adminHistoryTitle")}</h1>
        <p className="mt-1 text-slate-500">{t(locale, "adminHistoryBody")}</p>
        <p className="mt-4">
          <Link href="/admin/history-csv" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
            {t(locale, "adminHistoryCsv")}
          </Link>
        </p>
        {history.length === 0 ? (
          <p className="mt-8 text-sm text-slate-400">{t(locale, "adminNoHistory")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Suite</th>
                  <th className="py-2 pr-4">{t(locale, "adminColCustomer")}</th>
                  <th className="py-2 pr-4">{t(locale, "adminColOrder")}</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-mono font-semibold text-navy-900">
                      {p.suiteCode ?? "—"} <span className="font-sans text-xs font-normal text-slate-400">{p.warehouse}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/customers/${p.userId}`} className="hover:underline">{p.customerName}</Link>
                    </td>
                    <td className="py-3 pr-4">
                      {p.store}{p.description ? ` · ${p.description}` : ""}
                      <span className="block font-mono text-xs text-slate-400">{p.trackingCode}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{t(locale, STATUS_LABEL[p.status] as never)}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {p.updatedAt.toLocaleDateString("en-CA")}
                      {p.deliverySignerName && <span className="block text-xs">{t(locale, "adminSignedBy")}: {p.deliverySignerName}</span>}
                      {p.deliverySignatureData && (
                        // Signature proof: data URL stored at delivery, rendered small.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.deliverySignatureData} alt="" className="mt-1 h-8 w-24 border border-slate-200 bg-white object-contain" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
