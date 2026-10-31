import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddOrderForm } from "@/components/OrderForms";
import { OrderProgress } from "@/components/OrderProgress";
import { Icon } from "@/components/Icon";
import { HAITI_MAP } from "@/components/map-data";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { signOutAction } from "@/lib/auth/actions";
import { getAccount } from "@/lib/auth/accounts";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/index";
import { isLocale, montreal, t, warehouseCity } from "@/lib/i18n/index";
import { listOrders } from "@/lib/orders/index";
import { getWarehouseAddresses } from "@/lib/settings/index";

// Personal receiving addresses (online-store forwarding): the warehouse
// address set by an admin + the customer's suite. Customers can't edit them.
const WAREHOUSES = [
  { code: "MIA", label: "Miami, FL" },
  { code: "YUL", label: "Montreal, QC" },
] as const;

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account`);
  const db = await getDb();
  const [account, orders, addresses] = await Promise.all([
    getAccount(db, session),
    listOrders(db, session.userId),
    getWarehouseAddresses(db),
  ]);
  const department = HAITI_MAP.departments.find((d) => d.iso === account.haiti?.department)?.name;

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{t(locale, "accountWelcome")}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{account.displayName}</h1>
              <p className="mt-1 text-sm text-slate-500">{account.email}{account.phone ? ` · ${account.phone}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/account/edit`}
                className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
              >
                {t(locale, "accountEdit")}
              </Link>
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  {t(locale, "signOut")}
                </button>
              </form>
            </div>
          </div>

          {account.suiteCode && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-navy-900">{t(locale, "accountAddressesTitle")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t(locale, "accountAddressesBody")}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {WAREHOUSES.map((w) => {
                  const a = addresses[w.code];
                  return (
                    <div key={w.code} className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                      <p className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <Icon name="pin" size={18} /> {w.label.replace("Montreal", montreal(locale))}
                      </p>
                      <div className="mt-3 select-all rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 font-mono text-sm leading-relaxed text-slate-700">
                        {account.displayName}
                        <br />
                        {a ? (
                          <>
                            {a.street}
                            <br />
                            <span className="text-base font-bold text-navy-900">Suite {account.suiteCode}</span>
                            <br />
                            {a.city}, {a.region} {a.postalCode}
                            <br />
                            {a.country}
                            {a.phone && (
                              <>
                                <br />
                                {a.phone}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-base font-bold text-navy-900">Suite {account.suiteCode}</span>
                            <br />
                            {w.label.replace("Montreal", montreal(locale))}
                          </>
                        )}
                      </div>
                      {!a && <p className="mt-3 text-xs text-slate-400">{t(locale, "accountStreetSoon")}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-navy-900">{t(locale, "ordersTitle")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t(locale, "ordersBody")}</p>
            <div className="mt-5 grid gap-3">
              {orders.length === 0 && <p className="text-sm text-slate-400">{t(locale, "ordersEmpty")}</p>}
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/${locale}/account/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-slate-300"
                >
                  <div>
                    <p className="font-semibold text-navy-900">{order.store}{order.description ? ` · ${order.description}` : ""}</p>
                    <p className="text-sm text-slate-500">
                      {warehouseCity(locale, order.warehouse === "MIA" ? "MIA" : "YUL")}
                      {order.trackingNumber ? ` · ${order.trackingNumber}` : ""}
                      {` · ${t(locale, ({ expected: "orderStatusExpected", received: "orderStatusReceived", repackaging: "orderStatusRepackaging", shipped: "orderStatusShipped", delivered: "orderStatusDelivered", cancelled: "orderStatusCancelled" } as const)[order.status])}`}
                    </p>
                    <OrderProgress
                      status={order.status}
                      labels={{
                        expected: t(locale, "orderStatusExpected"),
                        received: t(locale, "orderStatusReceived"),
                        repackaging: t(locale, "orderStatusRepackaging"),
                        shipped: t(locale, "orderStatusShipped"),
                        delivered: t(locale, "orderStatusDelivered"),
                        cancelled: t(locale, "orderStatusCancelled"),
                      }}
                    />
                  </div>
                  <span className="flex items-center gap-2 text-sm">
                    <span className={`rounded-full px-2.5 py-0.5 font-mono font-semibold ${order.deliveryOtp ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                      {order.deliveryOtp ? `OTP ${order.deliveryOtp}` : t(locale, "orderNoOtp")}
                    </span>
                    <Icon name="arrowRight" size={16} className="text-slate-400" />
                  </span>
                </Link>
              ))}
            </div>
            <details className="mt-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200" open={orders.length === 0}>
              <summary className="cursor-pointer font-semibold text-blue-700">{t(locale, "orderAdd")}</summary>
              <div className="mt-5">
                <AddOrderForm locale={locale} defaultPhone={account.phone} />
              </div>
            </details>
          </section>

          {account.haiti && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-navy-900">{t(locale, "haitiAddressTitle")}</h2>
              <div className="mt-5 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <p className="font-semibold text-navy-900">
                  {account.haiti.city}
                  {department ? `, ${department}` : ""}
                </p>
                {account.haiti.neighborhood && <p className="text-slate-600">{account.haiti.neighborhood}</p>}
                {account.haiti.directions && <p className="mt-2 text-sm text-slate-500">{account.haiti.directions}</p>}
                {account.haiti.phone && <p className="mt-2 text-sm text-slate-500">{account.haiti.phone}</p>}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
