import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { formatMoney } from "@/lib/money/index";
import { hasRole } from "@/lib/auth/index";
import { signOutAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/admin/stats";
import { getDb } from "@/lib/db/index";
import { t } from "@/lib/i18n/index";
import { getDoorDelivery } from "@/lib/settings/index";
import { listExpectedPackages } from "@/lib/orders/index";
import { setDoorDeliveryAction } from "./actions";

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
  const session = await getSession();
  if (!session) redirect("/en/signin?next=/admin");
  // Signed in but not an admin: answer 404 so the route's existence is not advertised.
  if (!hasRole(session, "admin")) notFound();

  const locale = "en" as const;
  const db = await getDb();
  const [stats, door, expected] = await Promise.all([getAdminStats(), getDoorDelivery(db), listExpectedPackages(db)]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <span className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-semibold text-white">Admin</span>
          </span>
          <form action={signOutAction} className="flex items-center gap-3 text-sm text-slate-500">
            <input type="hidden" name="locale" value={locale} />
            {session.displayName}
            <button className="rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100">
              {t(locale, "signOut")}
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{t(locale, "adminTitle")}</h1>
        <p className="mt-1 text-slate-500">{t(locale, "adminSubtitle")}</p>

        {/* Operations: door-to-door switch */}
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
                    <th className="py-2">{t(locale, "orderOtpTitle")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expected.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 font-mono font-semibold text-navy-900">
                        {p.suiteCode ?? "—"} <span className="font-sans text-xs font-normal text-slate-400">{p.warehouse}</span>
                      </td>
                      <td className="py-3 pr-4">{p.customerName}</td>
                      <td className="py-3 pr-4">
                        {p.store} · {p.description}
                        {p.orderNumber && <span className="block font-mono text-xs text-slate-400">{p.orderNumber}</span>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">{p.trackingNumber ?? "—"}</td>
                      <td className="py-3">
                        {p.deliveryOtp ? (
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-base font-bold tracking-widest text-emerald-800">{p.deliveryOtp}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {stats.mock && (
          <p className="mt-8 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-600">{t(locale, "mockNotice")}</p>
        )}
        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card label={t(locale, "statTotalSales")} value={formatMoney(stats.totalSalesMinor, stats.currency)} />
          <Card label={t(locale, "statCommission")} value={formatMoney(stats.commissionRevenueMinor, stats.currency)} />
          <Card label={t(locale, "statProducerOwed")} value={formatMoney(stats.producerOwedMinor, stats.currency)} />
          <Card
            label={t(locale, "statPendingWithdrawals")}
            value={`${stats.pendingWithdrawalsCount} · ${formatMoney(stats.pendingWithdrawalsMinor, stats.currency)}`}
          />
          <Card label={t(locale, "statActiveOrders")} value={String(stats.activeOrdersCount)} />
          <Card label={t(locale, "statProducers")} value={String(stats.producersCount)} />
        </section>
      </main>
    </div>
  );
}
