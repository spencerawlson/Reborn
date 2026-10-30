"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/index";

/** Swaps the locale segment of the current path, keeping the page. */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");
  return (
    <nav aria-label="Language" className="flex gap-1 text-sm">
      {LOCALES.map((l) => (
        <Link
          key={l.code}
          href={`/${l.code}${rest ? `/${rest}` : ""}`}
          hrefLang={l.code}
          aria-current={l.code === locale ? "true" : undefined}
          className={`rounded-full px-3 py-1 transition ${
            l.code === locale
              ? "bg-white/15 font-semibold text-white"
              : "text-blue-100 hover:bg-white/10 hover:text-white"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
