import { AdminHeader } from "@/components/AdminHeader";
import Link from "next/link";
import { formatMoney } from "@/lib/money/index";
import { isAdmin, requireStaff } from "@/lib/auth/admin";
import { getAdminStats } from "@/lib/admin/stats";
import { getDb } from "@/lib/db/index";
import { t } from "@/lib/i18n/index";
import { getDoorDelivery, getWarehouseAddresses } from "@/lib/settings/index";
import { WarehouseForm } from "@/components/WarehouseForm";
import { listExpectedPackages, listInProgressPackages, NEXT_ORDER_STATUS, type OrderStatus } from "@/lib/orders/index";
import { OrderProgress } from "@/components/OrderProgress";
import { setDoorDeliveryAction, setOrderStatusAction } from "./actions";

// Auth and figures must be evaluated per request, never frozen at build time.
export const dynamic = "force-dynamic";

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-navy-900">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  // Staff see operations (expected packages, labels); admins also see business settings and figures.
  const session = await requireStaff("/admin");
  const admin = isAdmin(session);

  const locale = "en" as const;
  const db = await getDb();
  const [stats, door, expected, inProgress, addresses] = await Promise.all([
    getAdminStats(),
    getDoorDelivery(db),
    listExpectedPackages(db),
    listInProgressPackages(db),
    getWarehouseAddresses(db),
  ]);
  const NEXT_LABEL: Record<string, string> = {
    received: "adminMarkRepackaging",
    repackaging: "adminMarkShipped",
    shipped: "adminMarkDelivered",
  };
  const STATUS_LABEL: Record<OrderStatus, string> = {
    expected: "orderStatusExpected",
    received: "orderStatusReceived",
    repackaging: "orderStatusRepackaging",
    shipped: "orderStatusShipped",
    delivered: "orderStatusDelivered",
    cancelled: "orderStatusCancelled",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="dashboard" />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{t(locale, "adminTitle")}</h1>
        <p className="mt-1 text-slate-500">{t(locale, "adminSubtitle")}</p>

        {/* Operations: door-to-door switch (admin) */}
        {admin && (<>
        <section
          className={`mt-8 rounded-3xl p-6 ring-1 ${door.locked ? "bg-amber-50 ring-amber-200" : "bg-white ring-slate-200"}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold text-navy-900">{t(locale, "adminDoorTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t(locale, "adminDoorHelp")}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                door.locked ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {door.locked ? t(locale, "adminDoorLocked") : t(locale, "adminDoorOpen")}
            </span>
          </div>

          <form action={setDoorDeliveryAction} className="mt-5 flex flex-wrap items-end gap-3">
            <input type="hidden" name="locked" value={door.locked ? "false" : "true"} />
            <div className="min-w-64 flex-1">
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-slate-700">
                {t(locale, "adminDoorReason")}
              </label>
              <input
                id="reason"
                name="reason"
                maxLength={300}
                defaultValue={door.locked ? (door.reason ?? "") : ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <button
              className={`min-h-11 rounded-full px-5 font-semibold text-white ${
                door.locked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {door.locked ? t(locale, "adminDoorUnlock") : t(locale, "adminDoorLock")}
            </button>
          </form>
          {door.updatedBy && door.updatedAt && (
            <p className="mt-3 text-xs text-slate-500">
              {t(locale, "adminLastChange")}: {door.updatedBy} ·{" "}
              {door.updatedAt.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
              {door.reason ? ` · “${door.reason}”` : ""}
            </p>
          )}
        </section>

        {/* Warehouse receiving addresses customers put on their Amazon orders */}
        <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-navy-900">{t(locale, "adminWarehouseTitle")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{t(locale, "adminWarehouseBody")}</p>
          <WarehouseForm locale={locale} current={addresses} />
        </section>
        </>)}

        {/* Warehouses: packages customers have declared, with delivery codes */}
        <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-navy-900">
            {t(locale, "adminExpectedTitle")} <span className="text-slate-400">· {expected.length}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t(locale, "adminExpectedBody")}</p>
          {expected.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">{t(locale, "adminNoExpected")}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Suite</th>
                    <th className="py-2 pr-4">{t(locale, "adminColCustomer")}</th>
                    <th className="py-2 pr-4">{t(locale, "adminColOrder")}</th>
                    <th className="py-2 pr-4">{t(locale, "fieldTracking")}</th>
                    <th className="py-2 pr-4">{t(locale, "orderOtpTitle")}</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expected.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 font-mono font-semibold text-navy-900">
                        {p.suiteCode ?? "—"} <span className="font-sans text-xs font-normal text-slate-400">{p.warehouse}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/admin/customers/${p.userId}`} className="hover:underline">{p.customerName}</Link>
                      </td>
                      <td className="py-3 pr-4">
                        {p.store}{p.description ? ` · ${p.description}` : ""}
                        {p.orderNumber && <span className="block font-mono text-xs text-slate-400">{p.orderNumber}</span>}
                        <OrderProgress status={p.status} labels={{ expected: "Expected", received: "Received", repackaging: "Repackaging", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" }} />
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">{p.trackingNumber ?? "—"}</td>
                      <td className="py-3">
                        {p.deliveryOtp ? (
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-base font-bold tracking-widest text-emerald-800">{p.deliveryOtp}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex flex-wrap justify-end gap-2">
                          <form action={setOrderStatusAction} className="inline">
                            <input type="hidden" name="orderId" value={p.id} />
                            <input type="hidden" name="toStatus" value="received" />
                            <button className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                              {t(locale, "adminMarkReceived")}
                            </button>
                          </form>
                          <Link href={`/admin/labels/${p.id}`} className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                            Label
                          </Link>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* In progress: received, repackaging, or shipped — still active, not History. */}
        <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-navy-900">
            {t(locale, "adminInProgressTitle")} <span className="text-slate-400">· {inProgress.length}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t(locale, "adminInProgressBody")}</p>
          {inProgress.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">{t(locale, "adminNoInProgress")}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Suite</th>
                    <th className="py-2 pr-4">{t(locale, "adminColCustomer")}</th>
                    <th className="py-2 pr-4">{t(locale, "adminColOrder")}</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inProgress.map((p) => {
                    const next = NEXT_ORDER_STATUS[p.status];
                    return (
                      <tr key={p.id}>
                        <td className="py-3 pr-4 font-mono font-semibold text-navy-900">
                          {p.suiteCode ?? "—"} <span className="font-sans text-xs font-normal text-slate-400">{p.warehouse}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Link href={`/admin/customers/${p.userId}`} className="hover:underline">{p.customerName}</Link>
                          <span className="block text-xs text-slate-400">{p.notifyPhone ?? p.customerPhone ?? "—"}</span>
                        </td>
                        <td className="py-3 pr-4">
                          {p.store}{p.description ? ` · ${p.description}` : ""}
                          {p.trackingNumber && <span className="block font-mono text-xs text-slate-400">{p.trackingNumber}</span>}
                          <OrderProgress status={p.status} labels={{ expected: "Expected", received: "Received", repackaging: "Repackaging", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" }} />
                        </td>
                        <td className="py-3 pr-4 font-semibold">{t(locale, STATUS_LABEL[p.status] as never)}</td>
                        <td className="py-3 text-right">
                          <span className="inline-flex flex-wrap justify-end gap-2">
                            {next && p.status !== "shipped" && (
                              <form action={setOrderStatusAction} className="inline">
                                <input type="hidden" name="orderId" value={p.id} />
                                <input type="hidden" name="toStatus" value={next} />
                                <button className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                  {t(locale, NEXT_LABEL[p.status] as never)}
                                </button>
                              </form>
                            )}
                            {p.status === "shipped" && (
                              <Link href={`/admin/deliveries/${p.id}`} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                {t(locale, "adminDeliverSign")}
                              </Link>
                            )}
                            <Link href={`/admin/labels/${p.id}`} className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                              Label
                            </Link>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-sm">
            <Link href="/admin/history" className="font-semibold text-blue-700 hover:underline">{t(locale, "adminHistoryTitle")} →</Link>
          </p>
        </section>

        {admin && stats.mock && (
          <p className="mt-8 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-600">{t(locale, "mockNotice")}</p>
        )}
        {admin && <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card label={t(locale, "statTotalSales")} value={formatMoney(stats.totalSalesMinor, stats.currency)} />
          <Card label={t(locale, "statCommission")} value={formatMoney(stats.commissionRevenueMinor, stats.currency)} />
          <Card label={t(locale, "statProducerOwed")} value={formatMoney(stats.producerOwedMinor, stats.currency)} />
          <Card
            label={t(locale, "statPendingWithdrawals")}
            value={`${stats.pendingWithdrawalsCount} · ${formatMoney(stats.pendingWithdrawalsMinor, stats.currency)}`}
          />
          <Card label={t(locale, "statActiveOrders")} value={String(stats.activeOrdersCount)} />
          <Card label={t(locale, "statProducers")} value={String(stats.producersCount)} />
        </section>}
      </main>
    </div>
  );
}
