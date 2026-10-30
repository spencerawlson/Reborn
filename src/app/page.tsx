import Link from "next/link";
import { LOCALES, resolveLocale, t } from "@/lib/i18n/index";

// Phase 1 home shell. Locale comes from ?lang= for now; full locale
// routing (EN/FR/HT) lands with Phase 2 storefronts.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(locale, "siteName")}</h1>
          <p className="mt-1 text-zinc-600">{t(locale, "siteTagline")}</p>
        </div>
        <nav className="flex gap-2 text-sm">
          {LOCALES.map((l) => (
            <Link
              key={l.code}
              href={`/?lang=${l.code}`}
              className={`rounded-full border px-3 py-1 ${
                l.code === locale ? "border-zinc-900 font-semibold" : "border-zinc-300"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/admin" className="rounded-2xl border p-5 hover:bg-zinc-50">
          <h2 className="font-semibold">{t(locale, "navAdmin")}</h2>
          <p className="mt-1 text-sm text-zinc-600">{t(locale, "adminSubtitle")}</p>
        </Link>
        <div className="rounded-2xl border p-5">
          <h2 className="font-semibold">{t(locale, "navProducer")}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Free storefronts, products, orders, and MonCash withdrawals — coming in Phase 2.
          </p>
        </div>
      </section>

      <p className="mt-10 text-xs text-zinc-500">
        Foundation build (Phase 1). Payments, bank transfers, and MonCash payouts are mock
        only until banking partners and legal advisers confirm the structure is permitted.
      </p>
    </main>
  );
}
