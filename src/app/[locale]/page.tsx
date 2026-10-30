import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceEstimator } from "@/components/PriceEstimator";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isLocale, t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

const STEPS: [DictionaryKey, DictionaryKey, string][] = [
  ["step1Title", "step1Body", "1"],
  ["step2Title", "step2Body", "2"],
  ["step3Title", "step3Body", "3"],
];

const TRUST: [DictionaryKey, DictionaryKey][] = [
  ["trust1Title", "trust1Body"],
  ["trust2Title", "trust2Body"],
  ["trust3Title", "trust3Body"],
];

const ROUTES = [
  { from: "Montréal", to: ["Port-au-Prince", "Cap-Haïtien"] },
  { from: "Miami", to: ["Port-au-Prince", "Cap-Haïtien"] },
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        {/* Hero + estimator */}
        <section className="bg-blue-900 text-white">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
            <div className="lg:pt-8">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {t(locale, "heroTitle")}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-blue-100">{t(locale, "heroBody")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#estimate" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-950/30 hover:bg-red-500">
                  {t(locale, "ctaShip")}
                </a>
                <Link href={`/${locale}/track`} className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">
                  {t(locale, "ctaTrack")}
                </Link>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-200">
                <li>Montréal → {t(locale, "haiti")}</li>
                <li>Miami → {t(locale, "haiti")}</li>
                <li>🚚 {t(locale, "estimateDoor")}</li>
              </ul>
            </div>
            <PriceEstimator locale={locale} />
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">{t(locale, "howTitle")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, body, n]) => (
              <li key={n} className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 font-bold text-white">{n}</span>
                <h3 className="mt-4 font-semibold">{t(locale, title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{t(locale, body)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Routes */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t(locale, "routesTitle")}</h2>
              <p className="mt-3 text-stone-600">{t(locale, "routesBody")}</p>
              <p className="mt-3 text-sm font-medium text-red-700">{t(locale, "routesMore")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROUTES.map((r) => (
                <div key={r.from} className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
                  <p className="text-sm text-stone-500">{t(locale, "estimateFrom")}</p>
                  <p className="text-xl font-bold">{r.from}</p>
                  <div className="my-3 h-px bg-gradient-to-r from-blue-800 to-red-600" />
                  <p className="text-sm text-stone-500">{t(locale, "estimateTo")}</p>
                  {r.to.map((d) => <p key={d} className="font-semibold">{d}</p>)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">{t(locale, "trustTitle")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TRUST.map(([title, body]) => (
              <div key={title} className="border-l-4 border-red-600 pl-4">
                <h3 className="font-semibold">{t(locale, title)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{t(locale, body)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Marketplace teaser */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-3xl bg-gradient-to-br from-red-700 to-red-900 p-8 text-white sm:p-10">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              {t(locale, "soon")}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">{t(locale, "teaserTitle")}</h2>
            <p className="mt-3 max-w-2xl text-red-50">{t(locale, "teaserBody")}</p>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
