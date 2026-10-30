import { notFound } from "next/navigation";
import { PriceEstimator } from "@/components/PriceEstimator";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isLocale, t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

// Simple on purpose (Kay Ayiti / Farelune): one headline, three checks,
// one tool, three steps, one teaser. Nothing else.
const CHECKS: DictionaryKey[] = ["heroCheck1", "trust1Title", "heroCheck3"];

const STEPS: { title: DictionaryKey; body: DictionaryKey; icon: string }[] = [
  { title: "step1Title", body: "step1Body", icon: "📦" },
  { title: "step2Title", body: "step2Body", icon: "🚢" },
  { title: "step3Title", body: "step3Body", icon: "🏠" },
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-5xl px-4">
        <section className="grid items-start gap-8 pb-12 pt-8 md:grid-cols-[1fr_1.05fr] md:gap-12 md:pt-16">
          <div className="md:pt-6">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-slate-200">
              Montréal · Miami → {t(locale, "haiti")}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{t(locale, "heroTitle")}</h1>
            <p className="mt-3 text-lg text-slate-600">{t(locale, "heroBody")}</p>
            <ul className="mt-6 grid gap-2.5 text-[15px] text-slate-700">
              {CHECKS.map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-600">✓</span>
                  {t(locale, key)}
                </li>
              ))}
            </ul>
          </div>
          <PriceEstimator locale={locale} />
        </section>

        <section id="how" className="scroll-mt-20 pb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{t(locale, "howTitle")}</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:flex-col md:gap-3 md:p-5">
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">{step.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900">{t(locale, step.title)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{t(locale, step.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="py-6">
          <div className="flex items-center gap-4 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100 md:p-5">
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl">☕</span>
            <div>
              <p className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
                {t(locale, "teaserTitle")}
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{t(locale, "soon")}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">{t(locale, "teaserBody")}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
