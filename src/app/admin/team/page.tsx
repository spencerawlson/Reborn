import { AdminHeader } from "@/components/AdminHeader";
import { InviteForm } from "@/components/StaffForms";
import { requireAdmin } from "@/lib/auth/admin";
import { revokeInvitationAction, setAccessLevelAction } from "@/lib/auth/staff-actions";
import { listPendingInvitations, listTeam } from "@/lib/auth/staff";
import { getDb } from "@/lib/db/index";

export const dynamic = "force-dynamic";

const LEVELS = [
  { level: "admin", label: "Admin", help: "Everything: settings, door-to-door switch, warehouse addresses, figures, team." },
  { level: "staff", label: "Staff", help: "Operations: customers and their Haiti addresses, expected packages, labels." },
] as const;

const select =
  "rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

/** Admin: the team with access levels, pending invitations, and inviting new staff. */
export default async function TeamPage() {
  const session = await requireAdmin("/admin/team");
  const db = await getDb();
  const [team, invitations] = await Promise.all([listTeam(db), listPendingInvitations(db)]);
  const date = (d: Date) => d.toLocaleDateString("en-CA", { dateStyle: "medium" });

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader session={session} current="team" />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Team</h1>
        <p className="mt-1 text-slate-500">Staff accounts are separate from customers. People join with an invitation link.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <div key={l.level} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="font-semibold text-navy-900">{l.label}</p>
              <p className="mt-1 text-sm text-slate-600">{l.help}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-navy-900">Invite someone</h2>
          <div className="mt-4"><InviteForm /></div>
        </section>

        {invitations.length > 0 && (
          <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-navy-900">Pending invitations · {invitations.length}</h2>
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {invitations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span>
                    <span className="font-semibold text-navy-900">{i.email}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600">{i.role}</span>
                    <span className="block text-xs text-slate-400">Sent {date(i.createdAt)} · expires {date(i.expiresAt)}</span>
                  </span>
                  <form action={revokeInvitationAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Revoke</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-navy-900">Team members · {team.length}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Phone</th><th className="py-2 pr-4">Since</th><th className="py-2">Access level</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((m) => {
                  const level = m.roles.includes("admin") ? "admin" : "staff";
                  const self = m.id === session.userId;
                  return (
                    <tr key={m.id}>
                      <td className="py-3 pr-4 font-semibold text-navy-900">{m.name}{self && <span className="ml-1 font-normal text-slate-400">(you)</span>}</td>
                      <td className="py-3 pr-4">{m.email}</td>
                      <td className="py-3 pr-4">{m.phone ?? "—"}</td>
                      <td className="py-3 pr-4">{date(m.createdAt)}</td>
                      <td className="py-3">
                        {self ? (
                          <span className="rounded-full bg-navy-900 px-2.5 py-1 text-xs font-semibold capitalize text-white">{level}</span>
                        ) : (
                          <form action={setAccessLevelAction} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={m.id} />
                            <select name="level" defaultValue={level} aria-label={`Access level for ${m.name}`} className={select}>
                              <option value="admin">Admin</option>
                              <option value="staff">Staff</option>
                              <option value="none">Remove access</option>
                            </select>
                            <button className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">Save</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
