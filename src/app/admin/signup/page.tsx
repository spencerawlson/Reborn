import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffAuthShell } from "@/components/StaffAuthShell";
import { StaffSignUpForm } from "@/components/StaffForms";
import { hasRole } from "@/lib/auth/index";
import { getSession } from "@/lib/auth/session";
import { getInvitation } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/index";

export const dynamic = "force-dynamic";

/** Staff sign-up: with an invitation link, or (first admin) an email listed in ADMIN_EMAILS. */
export default async function StaffSignUpPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const session = await getSession();
  if (session && (hasRole(session, "admin") || hasRole(session, "staff"))) redirect("/admin");
  const { invite = "" } = await searchParams;
  const invitation = invite ? await getInvitation(await getDb(), invite) : null;

  if (invite && !invitation) {
    return (
      <StaffAuthShell title="Invitation not valid" subtitle="This link is invalid, has expired, or was already used. Ask an admin for a new invitation.">
        <Link href="/admin/signin" className="font-semibold text-blue-700">Go to staff sign-in</Link>
      </StaffAuthShell>
    );
  }
  return (
    <StaffAuthShell
      title="Create your staff account"
      subtitle={
        invitation
          ? `You are invited with ${invitation.role === "admin" ? "Admin" : "Staff"} access. This account is for the ShipItAyiti team, not for customers.`
          : "Staff accounts are by invitation. The first admin can sign up with an approved email."
      }
      footer={<>Already on the team? <Link href="/admin/signin" className="font-semibold text-blue-700">Sign in</Link></>}
    >
      <StaffSignUpForm invite={invite} inviteEmail={invitation?.email ?? null} />
    </StaffAuthShell>
  );
}
