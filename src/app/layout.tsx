import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { resolveLocale } from "@/lib/i18n/index";
import "./globals.css";

// Self-hosted at build time by next/font (no request to Google from visitors).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "ShipItAyiti — The reliable way to ship to Haiti",
  description:
    "Boxes, barrels, Amazon orders and freight from Montréal and Miami to every town in Haiti — our own trucks and warehouses, tracked at every step.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Set by src/middleware.ts for localized routes; admin falls back to English.
  const lang = resolveLocale((await headers()).get("x-locale"));
  return (
    <html lang={lang} className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
