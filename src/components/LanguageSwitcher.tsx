"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/index";

/** Swaps the locale segment of the current path, keeping the page. */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");
  return (
    <nav aria-label="Language" className="flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
      {LOCALES.map((l) => (
        <Link
          key={l.code}
          href={`/${l.code}${rest ? `/${rest}` : ""}`}
          hrefLang={l.code}
          title={l.label}
          aria-current={l.code === locale ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            l.code === locale ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {l.code === "ht" ? "KR" : l.code}
        </Link>
      ))}
    </nav>
  );
}
