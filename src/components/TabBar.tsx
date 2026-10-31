"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

// Bottom tab bar on phones, in the style of Kay Ayiti: four tabs, icon + label.
const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  ship: <><path d="M3 7h13v10H3z" /><path d="M16 10h3l2 3v4h-5" /><circle cx="7" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /></>,
  track: <><circle cx="12" cy="10" r="3" /><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /></>,
  account: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
};

export function TabBar({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "";
  const base = `/${locale}`;
  const tabs: { key: keyof typeof ICONS; label: DictionaryKey; href: string; active: boolean }[] = [
    { key: "home", label: "tabHome", href: base, active: pathname === base },
    { key: "ship", label: "navShip", href: `${base}#ship`, active: false },
    { key: "track", label: "navTrack", href: `${base}/track`, active: pathname.startsWith(`${base}/track`) },
    { key: "account", label: "navAccount", href: `${base}/account`, active: /\/(account|signin|signup)/.test(pathname) },
  ];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white px-1 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_18px_rgba(15,23,42,0.05)] md:hidden"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${
            tab.active ? "text-blue-700" : "text-slate-500"
          }`}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {ICONS[tab.key]}
          </svg>
          {t(locale, tab.label)}
        </Link>
      ))}
    </nav>
  );
}
