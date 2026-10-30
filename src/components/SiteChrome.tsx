import Link from "next/link";
import { t, type Locale } from "@/lib/i18n/index";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="bg-blue-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 font-black">
            R
          </span>
          <span className="text-lg font-bold tracking-tight">{t(locale, "siteName")}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href={`/${locale}#estimate`} className="rounded-full px-3 py-1 hover:bg-white/10">
            {t(locale, "navShip")}
          </Link>
          <Link href={`/${locale}/track`} className="rounded-full px-3 py-1 hover:bg-white/10">
            {t(locale, "navTrack")}
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1 text-blue-200">
            {t(locale, "navMarketplace")}
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              {t(locale, "soon")}
            </span>
          </span>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-stone-500">
        <p>
          <span className="font-semibold text-stone-700">{t(locale, "siteName")}</span> ·{" "}
          {t(locale, "siteTagline")}
        </p>
        <p>{t(locale, "previewNotice")}</p>
      </div>
    </footer>
  );
}
