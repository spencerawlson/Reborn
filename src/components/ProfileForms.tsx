"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction, type SaveState } from "@/lib/auth/actions";
import { t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
const initial: SaveState = { error: null, saved: false };

function Status({ locale, state, saved }: { locale: Locale; state: SaveState; saved: DictionaryKey }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-700">{t(locale, state.error)}</p>;
  if (state.saved) return <p role="status" className="text-sm font-medium text-emerald-700">{t(locale, saved)}</p>;
  return null;
}

function Field({
  locale,
  name,
  label,
  value,
  required = true,
  type = "text",
  textarea = false,
}: {
  locale: Locale;
  name: string;
  label: DictionaryKey;
  value?: string | null;
  required?: boolean;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {t(locale, label)} {!required && <span className="font-normal text-slate-400">({t(locale, "optional")})</span>}
      </label>
      {textarea ? (
        <textarea id={name} name={name} rows={3} maxLength={500} required={required} defaultValue={value ?? ""} className={input} />
      ) : (
        <input id={name} name={name} type={type} required={required} defaultValue={value ?? ""} className={input} />
      )}
    </div>
  );
}

export interface ProfileValues {
  name: string;
  phone: string | null;
  department: string | null;
  city: string | null;
  neighborhood: string | null;
  directions: string | null;
  haitiPhone: string | null;
}

export function ProfileForm({
  locale,
  values,
  departments,
}: {
  locale: Locale;
  values: ProfileValues;
  departments: { iso: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <Field locale={locale} name="name" label="fieldName" value={values.name} />
      <Field locale={locale} name="phone" label="fieldPhone" type="tel" value={values.phone} />
      <fieldset className="grid gap-5 rounded-2xl border border-slate-200 p-5">
        <legend className="px-1 text-base font-semibold text-navy-900">{t(locale, "haitiAddressTitle")}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="department" className={labelCls}>{t(locale, "fieldDepartment")} <span className="font-normal text-slate-400">({t(locale, "optional")})</span></label>
            <select id="department" name="department" defaultValue={values.department ?? ""} className={`${input} text-sm`}>
              <option value="" className="text-sm">{t(locale, "fieldDepartmentChoose")}</option>
              {departments.map((d) => (
                <option key={d.iso} value={d.iso} className="text-sm">{d.name}</option>
              ))}
            </select>
          </div>
          <Field locale={locale} name="city" label="fieldCity" value={values.city} required={false} />
        </div>
        <Field locale={locale} name="neighborhood" label="fieldNeighborhood" value={values.neighborhood} required={false} />
        <Field locale={locale} name="directions" label="fieldDirections" value={values.directions} required={false} textarea />
        <Field locale={locale} name="haitiPhone" label="fieldHaitiPhone" type="tel" value={values.haitiPhone} required={false} />
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="min-h-12 rounded-full bg-navy-900 px-6 font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
          {pending ? "…" : t(locale, "accountSave")}
        </button>
        <Status locale={locale} state={state} saved="accountSaved" />
      </div>
    </form>
  );
}

export function PasswordForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="currentPassword" className={labelCls}>{t(locale, "fieldCurrentPassword")}</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={input} />
        </div>
        <div>
          <label htmlFor="newPassword" className={labelCls}>{t(locale, "fieldNewPassword")}</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={10} autoComplete="new-password" className={input} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="min-h-12 rounded-full border border-slate-300 bg-white px-6 font-semibold text-navy-900 hover:bg-slate-100 disabled:opacity-60">
          {pending ? "…" : t(locale, "passwordTitle")}
        </button>
        <Status locale={locale} state={state} saved="passwordSaved" />
      </div>
    </form>
  );
}
