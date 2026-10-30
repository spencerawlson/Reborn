import Link from "next/link";
import { LOCALES, t, type Locale } from "@/lib/i18n/index";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { TabBar } from "./TabBar";

/** White top bar: logo, a few links, language, and the one primary action. */
export function SiteHeader({ locale }: { locale: Locale }) {
  const base = `/${locale}`;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href={base} aria-label={t(locale, "siteName")}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 lg:flex">
          <Link href={`${base}#services`} className="rounded-lg px-3 py-2 hover:text-slate-900">{t(locale, "navServices")}</Link>
          <Link href={`${base}/track`} className="rounded-lg px-3 py-2 hover:text-slate-900">{t(locale, "navTrack")}</Link>
          <span className="flex items-center gap-2 px-3 py-2 text-slate-400">
            {t(locale, "navMarketplace")}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t(locale, "soon")}</span>
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <Link
            href={`${base}#ship`}
            className="hidden rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 sm:inline-flex"
          >
            {t(locale, "navQuote")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const base = `/${locale}`;
  const year = 2026;
  return (
    <>
      <footer className="bg-navy-950 text-slate-400">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-white">
              ShipIt<span className="text-red-500">Ayiti</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">{t(locale, "siteTagline")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t(locale, "footerServices")}</p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li><Link href={`${base}?tab=ship#ship`} className="hover:text-white">{t(locale, "svc1Title")}</Link></li>
              <li><Link href={`${base}?tab=shop#ship`} className="hover:text-white">{t(locale, "svc2Title")}</Link></li>
              <li className="text-slate-500">{t(locale, "svc3Title")} · {t(locale, "soon")}</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t(locale, "footerHelp")}</p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li><Link href={`${base}/track`} className="hover:text-white">{t(locale, "trackTitle")}</Link></li>
              <li><Link href={`${base}#how`} className="hover:text-white">{t(locale, "howTitle")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t(locale, "footerLanguage")}</p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {LOCALES.map((l) => (
                <li key={l.code}>
                  <Link href={`/${l.code}`} hrefLang={l.code} className={l.code === locale ? "text-white" : "hover:text-white"}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-5 py-6 pb-28 text-xs text-slate-500 lg:pb-6">
            <p>© {year} ShipItAyiti</p>
            <p>{t(locale, "previewNotice")}</p>
          </div>
        </div>
      </footer>
      <TabBar locale={locale} />
    </>
  );
}
