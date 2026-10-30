import { formatMoney } from "@/lib/money/index";
import { getAdminStats } from "@/lib/admin/stats";
import { t } from "@/lib/i18n/index";

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-5">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const stats = await getAdminStats();
  const locale = "en" as const;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t(locale, "adminTitle")}</h1>
      <p className="mt-1 text-zinc-600">{t(locale, "adminSubtitle")}</p>
      {stats.mock && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t(locale, "mockNotice")}
        </p>
      )}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          label={t(locale, "statTotalSales")}
          value={formatMoney(stats.totalSalesMinor, stats.currency)}
        />
        <Card
          label={t(locale, "statCommission")}
          value={formatMoney(stats.commissionRevenueMinor, stats.currency)}
        />
        <Card
          label={t(locale, "statProducerOwed")}
          value={formatMoney(stats.producerOwedMinor, stats.currency)}
        />
        <Card
          label={t(locale, "statPendingWithdrawals")}
          value={`${stats.pendingWithdrawalsCount} · ${formatMoney(
            stats.pendingWithdrawalsMinor,
            stats.currency,
          )}`}
        />
        <Card label={t(locale, "statActiveOrders")} value={String(stats.activeOrdersCount)} />
        <Card label={t(locale, "statProducers")} value={String(stats.producersCount)} />
        <Card label={t(locale, "statRefunds")} value={String(stats.refundsCount)} />
      </section>
      <section className="mt-8 rounded-2xl border p-5">
        <h2 className="font-semibold">Coming in later phases</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600">
          <li>Producer approval and suspension, product and storefront review</li>
          <li>Withdrawal approval queue, bank transfer recording and reconciliation</li>
          <li>Shipping partners and order management, complaint review</li>
          <li>Business settings including the commission rate (default 5%)</li>
        </ul>
      </section>
    </main>
  );
}
