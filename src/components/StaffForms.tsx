"use client";

import { useActionState, useState } from "react";
import { signInAction, type FormState } from "@/lib/auth/actions";
import { createInvitationAction, staffSignUpAction, type InviteState, type StaffFormState } from "@/lib/auth/staff-actions";
import { t } from "@/lib/i18n/index";

/** Staff (admin area) forms — English, separate from the customer forms. */
const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
const button = "min-h-12 w-full rounded-full bg-navy-900 px-6 font-semibold text-white hover:bg-navy-800 disabled:opacity-60";

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">{error}</p>;
}

export function StaffSignUpForm({ invite, inviteEmail }: { invite: string; inviteEmail: string | null }) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(staffSignUpAction, { error: null, values: {} });
  const v = state.values;
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="invite" value={invite} />
      <ErrorBox error={state.error ? t("en", state.error) : null} />
      <div>
        <label htmlFor="name" className={labelCls}>Full name</label>
        <input id="name" name="name" required autoComplete="name" defaultValue={v.name} className={input} />
      </div>
      <div>
        <label htmlFor="email" className={labelCls}>Work email</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={inviteEmail ?? v.email} readOnly={Boolean(inviteEmail)} className={input} />
      </div>
      <div>
        <label htmlFor="phone" className={labelCls}>Phone (WhatsApp)</label>
        <input id="phone" name="phone" type="tel" required autoComplete="tel" defaultValue={v.phone} className={input} />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>Password (at least 10 characters)</label>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className={input} />
      </div>
      <button disabled={pending} className={button}>{pending ? "…" : "Create staff account"}</button>
    </form>
  );
}

export function StaffSignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, { error: null, values: {} });
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value="en" />
      <input type="hidden" name="next" value={next} />
      <ErrorBox error={state.error ? t("en", state.error) : null} />
      <div>
        <label htmlFor="email" className={labelCls}>Work email</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state.values.email} className={input} />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
      </div>
      <button disabled={pending} className={button}>{pending ? "…" : "Sign in"}</button>
    </form>
  );
}

/** Admin: invite a team member and show the one-time link to send them. */
export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInvitationAction, { error: null, link: null, email: "" });
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="invite-email" className={labelCls}>Email</label>
          <input id="invite-email" name="email" type="email" required className={input} />
        </div>
        <div>
          <label htmlFor="invite-role" className={labelCls}>Access level</label>
          <select id="invite-role" name="role" defaultValue="staff" className={input}>
            <option value="staff">Staff: customers, packages, labels</option>
            <option value="admin">Admin: everything, incl. settings and team</option>
          </select>
        </div>
        <button disabled={pending} className="min-h-12 rounded-full bg-navy-900 px-6 font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
          {pending ? "…" : "Create invitation"}
        </button>
      </form>
      <ErrorBox error={state.error ? t("en", state.error) : null} />
      {state.link && (
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <p className="text-sm font-semibold text-emerald-900">Invitation for {state.email} — send this link (valid 7 days, works once):</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input readOnly value={state.link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 font-mono text-xs" />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.link!).then(() => setCopied(true))}
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-emerald-800">This link is shown only once. If it's lost, create a new invitation.</p>
        </div>
      )}
    </div>
  );
}
