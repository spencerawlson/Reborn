import Link from "next/link";
import { Logo } from "./Logo";

/** Simple frame for the staff sign-in / sign-up pages (separate from the customer site). */
export function StaffAuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
          <Link href="/en" aria-label="ShipItAyiti"><Logo /></Link>
          <span className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-semibold text-white">Staff</span>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_10px_28px_rgba(17,24,39,0.07)] ring-1 ring-slate-200 sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
      </main>
    </div>
  );
}
