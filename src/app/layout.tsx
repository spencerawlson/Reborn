import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haitian Producer Marketplace",
  description: "Haitian products for the world — marketplace and free producer storefronts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
