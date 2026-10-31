import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroPlane } from "@/components/art/HeroPlane";
import { HeroScene } from "@/components/art/HeroScene";
import { SkyBackground } from "@/components/art/SkyBackground";
import { HeroScroll } from "@/components/art/HeroScroll";
import { BoxesArt, FreightArt, ShopArt, Truck } from "@/components/art/ServiceArt";
import { HowItWorks } from "@/components/HowItWorks";
import { Icon, type IconName } from "@/components/Icon";
import { PriceEstimator } from "@/components/PriceEstimator";
import { RouteMap } from "@/components/RouteMap";
import { isDepartmentCode } from "@/lib/shipping/departments";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isLocale, montreal, t, type DictionaryKey, type Locale } from "@/lib/i18n/index";
import { isEstimatorTab } from "@/lib/shipping/tabs";
import { getDb } from "@/lib/db/index";
import { getDoorDelivery } from "@/lib/settings/index";

// Premium but simple: scroll-driven hero, quote, facts, services, how it works,
// network, closing call to action. Every claim here is true of the
// founder's operation today; nothing invented (no fake numbers or logos).
const KPIS: [DictionaryKey, DictionaryKey][] = [
  ["kpi1Value", "kpi1Label"],
  ["kpi2Value", "kpi2Label"],
  ["kpi3Value", "kpi3Label"],
];

const SERVICES: { Art: () => React.JSX.Element; title: DictionaryKey; body: DictionaryKey; tab?: "ship" | "shop" }[] = [
  { Art: BoxesArt, title: "svc1Title", body: "svc1Body", tab: "ship" },
  { Art: ShopArt, title: "svc2Title", body: "svc2Body", tab: "shop" },
  { Art: FreightArt, title: "svc3Title", body: "svc3Body" },
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
  searchParams: Promise<{ tab?: string; to?: string; dept?: string }>;
}) {
  const { locale: raw } = await params;
  const { tab, to, dept } = await searchParams;
  const destination = to === "CAP" ? "CAP" : "PAP";
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const base = `/${locale}`;
  // Door-to-door switch (admin). If the database is unreachable, keep the page up and show it open.
  const doorLocked = await getDb()
    .then(getDoorDelivery)
    .then((d) => d.locked)
    .catch((error) => {
      console.error("door delivery setting unavailable", error);
      return false;
    });

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        {doorLocked && (
          <div role="status" className="border-b border-amber-200 bg-amber-50">
            <p className="mx-auto flex max-w-6xl items-start gap-2 px-5 py-3 text-sm font-medium text-amber-900">
              <Icon name="truck" size={18} className="mt-0.5 shrink-0" /> {t(locale, "doorLockedBanner")}
            </p>
          </div>
        )}

        {/* Hero: scrolls with the page — plane flies off and ship sails into port as you scroll down, in reverse as you scroll back up. */}
        <HeroScroll>
          <SkyBackground />
          <HeroScene />
          <div className="relative mx-auto max-w-6xl px-5 pb-[300px] pt-12 sm:pb-[360px] sm:pt-20 md:pb-[300px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {montreal(locale)} · Miami → {t(locale, "haiti")}
            </p>
            <h1 className="mt-6 max-w-3xl text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
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
            <HeroPlane />
          </div>
        </HeroScroll>

        {/* Quote: the booking card, underneath the hero. */}
        <section id="ship" className="scroll-mt-16 bg-slate-50">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
            <div className="lg:pt-4">
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "quoteTitle")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">{t(locale, "quoteBody")}</p>
            </div>
            <PriceEstimator
              key={`${tab ?? "ship"}-${destination}-${doorLocked}`}
              locale={locale}
              initialTab={isEstimatorTab(tab) ? tab : "ship"}
              initialDestination={destination}
              doorLocked={doorLocked}
            />
          </div>
        </section>

        {/* Facts — only true, verifiable numbers. */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
            {KPIS.map(([value, label]) => (
              <div key={value}>
                <p className="text-3xl font-semibold tracking-tight text-navy-900">{t(locale, value)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {t(locale, doorLocked && label === "kpi2Label" ? "kpi2LabelLocked" : label)}
                </p>
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
                <article key={svc.title} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-20px_rgba(11,27,63,0.25)]">
                  <div className="aspect-[32/17] overflow-hidden border-b border-slate-100 transition duration-500 group-hover:scale-[1.02]">
                    <svc.Art />
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
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
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works: the truck drives step to step — last stop blurs, the arrival comes into focus. */}
        <section id="how" className="scroll-mt-20 bg-slate-50">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "howTitle")}</h2>
            <HowItWorks
              steps={STEPS.map((step) => ({
                icon: step.icon,
                title: t(locale, step.title),
                body: t(locale, doorLocked && step.body === "how4Body" ? "how4BodyLocked" : step.body),
              }))}
            />
          </div>
        </section>

        {/* Network */}
        <section id="network" className="scroll-mt-20 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:py-28">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "networkTitle")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">{t(locale, "networkBody")}</p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                <Icon name="pin" size={18} /> {t(locale, "networkNext")}
              </p>
            </div>
            <RouteMap locale={locale} department={isDepartmentCode(dept) ? dept : null} doorLocked={doorLocked} />
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
              <div className="flex items-center gap-8">
                <Truck label className="hidden h-auto w-48 drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] md:block" />
                <a href="#ship" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 transition hover:bg-blue-50">
                  {t(locale, "navQuote")} <Icon name="arrowRight" size={16} strokeWidth={2.2} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
