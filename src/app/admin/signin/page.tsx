import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffAuthShell } from "@/components/StaffAuthShell";
import { StaffSignInForm } from "@/components/StaffForms";
import { hasRole } from "@/lib/auth/index";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Staff sign-in (admin area). */
export default async function StaffSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  const session = await getSession();
  if (session && (hasRole(session, "admin") || hasRole(session, "staff"))) redirect(target);
  return (
    <StaffAuthShell
      title="Staff sign-in"
      subtitle="For the ShipItAyiti team. Customers sign in on the main site."
      footer={<>Invited? Open the link you received, or <Link href="/admin/signup" className="font-semibold text-blue-700">create the first admin</Link>.</>}
    >
      <StaffSignInForm next={target} />
    </StaffAuthShell>
  );
}
