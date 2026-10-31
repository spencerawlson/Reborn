import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { OtpForm } from "@/components/OrderForms";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/index";
import { isLocale, t, warehouseCity, type DictionaryKey } from "@/lib/i18n/index";
import { formatMoney } from "@/lib/money/index";
import { getOrder } from "@/lib/orders/index";

const STATUS: Record<string, DictionaryKey> = {
  expected: "orderStatusExpected",
  received: "orderStatusReceived",
  repackaging: "orderStatusRepackaging",
  shipped: "orderStatusShipped",
  delivered: "orderStatusDelivered",
  cancelled: "orderStatusCancelled",
};

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account/orders/${id}`);
  // Scoped to the signed-in customer: someone else's order is simply "not found".
  const order = await getOrder(await getDb(), session.userId, id);
  if (!order) notFound();

  const rows: [DictionaryKey, string | null][] = [
    ["fieldWarehouse", warehouseCity(locale, order.warehouse === "MIA" ? "MIA" : "YUL")],
    ["fieldStore", order.store],
    ["fieldOrderNumber", order.orderNumber],
    ["fieldTracking", order.trackingNumber],
    ["fieldDescription", order.description],
    ["fieldValue", order.declaredValueMinor === null ? null : formatMoney(order.declaredValueMinor, "USD")],
  ];

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          <Link href={`/${locale}/account`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
            <Icon name="arrowRight" size={16} className="rotate-180" /> {t(locale, "orderBack")}
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900">{t(locale, "orderDetails")}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${order.status === "expected" ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-800"}`}>
              {t(locale, STATUS[order.status])}
            </span>
          </div>

          <dl className="mt-6 grid gap-x-6 gap-y-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, label)}</dt>
                <dd className="mt-1 break-words font-medium text-slate-900">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-navy-900">{t(locale, "orderOtpTitle")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t(locale, "orderOtpBody")}</p>
            <div className="mt-4">
              {order.status === "expected" ? (
                <OtpForm locale={locale} orderId={order.id} current={order.deliveryOtp} />
              ) : (
                <p className="text-sm text-slate-500">{t(locale, "orderOtpLocked")}</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
