import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isLocale, t } from "@/lib/i18n/index";
import { LIST_REVIEWED, PROHIBITED } from "@/lib/shipping/prohibited";

/** Public list of prohibited items, with the reason and references for each category. */
export default async function ProhibitedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const reviewed = new Date(`${LIST_REVIEWED}T12:00:00Z`).toLocaleDateString(
    locale === "en" ? "en-CA" : "fr-CA",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "prohibitedTitle")}</h1>
          <p className="mt-3 text-lg text-slate-600">{t(locale, "prohibitedBody")}</p>

          <div className="mt-10 grid gap-4">
            {PROHIBITED.map((c) => (
              <section key={c.id} id={c.id} className="scroll-mt-24 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold text-navy-900">{c.title[locale]}</h2>
                <p className="mt-2 text-slate-700">{c.reason[locale]}</p>
                <p className="mt-3 text-sm text-slate-500">
                  <span className="font-semibold text-slate-600">{t(locale, "prohibitedExamples")}:</span> {c.examples[locale]}
                </p>
                <ul className="mt-4 grid gap-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {c.references.map((r) => (
                    <li key={r.url}>
                      {t(locale, "prohibitedReference")}:{" "}
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-8 text-sm text-slate-500">{t(locale, "prohibitedDisclaimer")}</p>
          <p className="mt-1 text-xs text-slate-400">
            {t(locale, "prohibitedReviewed")}: {reviewed}
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
