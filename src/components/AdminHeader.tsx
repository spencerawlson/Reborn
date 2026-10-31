import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/accounts";
import { Logo } from "./Logo";

/** Header for admin pages: logo, admin navigation, signed-in admin, sign out. */
export function AdminHeader({ session, current }: { session: SessionUser; current: "dashboard" | "customers" }) {
  const link = (href: string, label: string, key: typeof current) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${current === key ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-4">
          <Logo />
          <nav className="flex items-center gap-1">
            {link("/admin", "Dashboard", "dashboard")}
            {link("/admin/customers", "Customers", "customers")}
          </nav>
        </div>
        <form action={signOutAction} className="flex items-center gap-3 text-sm text-slate-500">
          <input type="hidden" name="locale" value="en" />
          <span className="hidden sm:inline">{session.displayName}</span>
          <button className="rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100">Sign out</button>
        </form>
      </div>
    </header>
  );
}
