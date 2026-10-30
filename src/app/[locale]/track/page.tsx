import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { isLocale, t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

// Sample journey for the preview; real tracking reads shipment events (Phase 2d–2f).
const SAMPLE: { status: DictionaryKey; when: string; done: boolean }[] = [
  { status: "trackStatusBooked", when: "Oct 12 · 14:05", done: true },
  { status: "trackStatusReceived", when: "Oct 13 · 09:40", done: true },
  { status: "trackStatusDeparted", when: "Oct 18 · 06:00", done: true },
  { status: "trackStatusArrived", when: "Oct 24 · 11:20", done: true },
  { status: "trackStatusCustoms", when: "Oct 27 · 15:10", done: true },
  { status: "trackStatusOut", when: "Oct 29 · 08:30", done: true },
  { status: "trackStatusDelivered", when: "—", done: false },
];

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const { n } = await searchParams;
  const number = n?.trim().toUpperCase().slice(0, 32);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-black tracking-tight">{t(locale, "trackTitle")}</h1>

        <form className="mt-6 flex gap-2" action={`/${locale}/track`}>
          <label htmlFor="n" className="sr-only">{t(locale, "trackLabel")}</label>
          <input
            id="n"
            name="n"
            defaultValue={number ?? ""}
            placeholder={`${t(locale, "trackLabel")} — SIA-24-000123`}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono uppercase focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
          <button className="rounded-xl bg-blue-700 px-6 font-semibold text-white hover:bg-blue-700">
            {t(locale, "trackButton")}
          </button>
        </form>

        {number && (
          <section className="mt-8 rounded-3xl bg-white p-5 shadow-[0_10px_28px_rgba(17,24,39,0.07)] ring-1 ring-slate-200">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t(locale, "trackSample")}</p>
            <div className="mt-5 flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, "trackLabel")}</p>
                <p className="font-mono text-lg font-bold">{number}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, "trackRoute")}</p>
                <p className="font-semibold">Montréal → Port-au-Prince · {t(locale, "sizeBarrel")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, "trackRecipient")}</p>
                <p className="font-semibold">M. J*** · Delmas</p>
              </div>
            </div>

            <ol className="mt-8">
              {SAMPLE.map((step, i) => {
                const current = step.done && !SAMPLE[i + 1]?.done;
                return (
                  <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < SAMPLE.length - 1 && (
                      <span className={`absolute left-[11px] top-6 h-full w-0.5 ${step.done ? "bg-blue-700" : "bg-slate-200"}`} />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-4 ${
                        current
                          ? "border-red-200 bg-red-600"
                          : step.done
                            ? "border-blue-100 bg-blue-700"
                            : "border-slate-100 bg-slate-300"
                      }`}
                    />
                    <div>
                      <p className={`font-semibold ${step.done ? "" : "text-slate-400"}`}>{t(locale, step.status)}</p>
                      <p className="text-sm text-slate-500">{step.when}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
