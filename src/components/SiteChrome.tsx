import Link from "next/link";
import { t, type Locale } from "@/lib/i18n/index";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TabBar } from "./TabBar";

/** Thin white top bar: logo + language. Navigation lives in the tab bar on phones. */
export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-700 text-sm font-black text-white">
            R
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">{t(locale, "siteName")}</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex">
          <Link href={`/${locale}#ship`} className="rounded-full px-3 py-1.5 hover:bg-slate-100">{t(locale, "navShip")}</Link>
          <Link href={`/${locale}/track`} className="rounded-full px-3 py-1.5 hover:bg-slate-100">{t(locale, "navTrack")}</Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400">
            {t(locale, "navMarketplace")}
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">{t(locale, "soon")}</span>
          </span>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <>
      <footer className="mx-auto max-w-5xl px-4 pb-28 pt-10 text-center text-xs text-slate-400 md:pb-10">
        <p>
          <span className="font-semibold text-slate-500">{t(locale, "siteName")}</span> · {t(locale, "siteTagline")}
        </p>
        <p className="mt-1">{t(locale, "previewNotice")}</p>
      </footer>
      <TabBar locale={locale} />
    </>
  );
}
