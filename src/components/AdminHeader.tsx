import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/accounts";
import { hasRole } from "@/lib/auth/index";
import { Logo } from "./Logo";

/** Header for staff pages: logo, navigation (Team for admins only), signed-in member, access level, sign out. */
export function AdminHeader({ session, current }: { session: SessionUser; current: "dashboard" | "customers" | "team" }) {
  const admin = hasRole(session, "admin");
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:h-16 sm:flex-nowrap sm:py-0">
        <div className="contents sm:flex sm:items-center sm:gap-4">
          <Logo />
          <nav className="order-last flex w-full items-center gap-1 sm:order-none sm:w-auto">
            {link("/admin", "Dashboard", "dashboard")}
            {link("/admin/customers", "Customers", "customers")}
            {admin && link("/admin/team", "Team", "team")}
          </nav>
        </div>
        <form action={signOutAction} className="flex items-center gap-3 text-sm text-slate-500">
          <input type="hidden" name="locale" value="en" />
          <span className="hidden sm:inline">
            {session.displayName} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{admin ? "Admin" : "Staff"}</span>
          </span>
          <button className="whitespace-nowrap rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100">Sign out</button>
        </form>
      </div>
    </header>
  );
}
