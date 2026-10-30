import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveLocale } from "@/lib/i18n/index";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipItAyiti — Ship to Haiti, door to door",
  description:
    "Boxes and barrels from Montréal and Miami to every town in Haiti, delivered to the door or ready for warehouse pickup.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Set by src/middleware.ts for localized routes; admin falls back to English.
  const lang = resolveLocale((await headers()).get("x-locale"));
  return (
    <html lang={lang}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
