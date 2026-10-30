import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { PriceEstimator } from "@/components/PriceEstimator";
import { RouteMap } from "@/components/RouteMap";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isLocale, t, type DictionaryKey, type Locale } from "@/lib/i18n/index";
import { isEstimatorTab } from "@/lib/shipping/tabs";

// Premium but simple: hero + quote, facts, services, how it works,
// network, closing call to action. Every claim here is true of the
// founder's operation today; nothing invented (no fake numbers or logos).
const KPIS: [DictionaryKey, DictionaryKey][] = [
  ["kpi1Value", "kpi1Label"],
  ["kpi2Value", "kpi2Label"],
  ["kpi3Value", "kpi3Label"],
];

const SERVICES: { icon: IconName; title: DictionaryKey; body: DictionaryKey; tab?: "ship" | "shop" }[] = [
  { icon: "box", title: "svc1Title", body: "svc1Body", tab: "ship" },
  { icon: "cart", title: "svc2Title", body: "svc2Body", tab: "shop" },
  { icon: "globe", title: "svc3Title", body: "svc3Body" },
];

const STEPS: { icon: IconName; title: DictionaryKey; body: DictionaryKey }[] = [
  { icon: "laptop", title: "how1Title", body: "how1Body" },
  { icon: "truck", title: "how2Title", body: "how2Body" },
  { icon: "scan", title: "how3Title", body: "how3Body" },
  { icon: "home", title: "how4Title", body: "how4Body" },
];

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale: raw } = await params;
  const { tab } = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const base = `/${locale}`;

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        {/* Hero: navy, headline left, quote card right (overlaps the next section on desktop). */}
        <section className="relative z-10 bg-navy-900 text-white">
          {/* Decorations are clipped here, not on the section, so the quote card can overlap the next section. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(220,38,38,0.18),transparent_40%)]" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-24">
            <div className="lg:pt-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Montréal · Miami → {t(locale, "haiti")}
              </p>
              <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
                {t(locale, "heroTitle")}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">{t(locale, "heroBody")}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#ship" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 transition hover:bg-blue-50">
                  {t(locale, "navQuote")} <Icon name="arrowRight" size={16} strokeWidth={2.2} />
                </a>
                <Link href={`${base}/track`} className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  {t(locale, "trackTitle")}
                </Link>
              </div>
            </div>
            <div className="relative lg:-mb-48">
              <PriceEstimator locale={locale} initialTab={isEstimatorTab(tab) ? tab : "ship"} />
            </div>
          </div>
        </section>

        {/* Facts — only true, verifiable numbers. */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3 lg:pr-[48%]">
            {KPIS.map(([value, label]) => (
              <div key={value}>
                <p className="text-3xl font-semibold tracking-tight text-navy-900">{t(locale, value)}</p>
                <p className="mt-1 text-sm text-slate-500">{t(locale, label)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">{t(locale, "navServices")}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">
              {t(locale, "servicesTitle")}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {SERVICES.map((svc) => (
                <article key={svc.title} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-20px_rgba(11,27,63,0.25)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
                    <Icon name={svc.icon} />
                  </span>
                  <h3 className="mt-6 flex items-center gap-2 text-lg font-semibold text-navy-900">
                    {t(locale, svc.title)}
                    {!svc.tab && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {t(locale, "soon")}
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{t(locale, svc.body)}</p>
                  {svc.tab && (
                    <Link href={`${base}?tab=${svc.tab}#ship`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                      {t(locale, "svcCta")} <Icon name="arrowRight" size={16} strokeWidth={2.2} className="transition group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works: four steps on a dashed line. */}
        <section id="how" className="scroll-mt-20 bg-slate-50">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "howTitle")}</h2>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden className="absolute left-6 right-6 top-6 hidden h-px bg-[repeating-linear-gradient(90deg,#94a3b8_0_6px,transparent_6px_12px)] md:block" />
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-sm">
                    <Icon name={step.icon} size={22} />
                  </span>
                  <p className="mt-5 text-xs font-semibold text-slate-400">0{i + 1}</p>
                  <h3 className="mt-1 font-semibold text-navy-900">{t(locale, step.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(locale, step.body)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Network */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "networkTitle")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">{t(locale, "networkBody")}</p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                <Icon name="pin" size={18} /> {t(locale, "networkNext")}
              </p>
            </div>
            <RouteMap locale={locale} />
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-5 pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-navy-900 px-8 py-14 text-white sm:px-14">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t(locale, "ctaTitle")}</h2>
                <p className="mt-3 text-slate-300">{t(locale, "ctaBody")}</p>
              </div>
              <a href="#ship" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 transition hover:bg-blue-50">
                {t(locale, "navQuote")} <Icon name="arrowRight" size={16} strokeWidth={2.2} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
