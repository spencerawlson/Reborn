"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type FormState } from "@/lib/auth/actions";
import { t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
const initial: FormState = { error: null, values: {} };

function Field({
  locale,
  name,
  label,
  type = "text",
  required = true,
  autoComplete,
  defaultValue,
  textarea = false,
}: {
  locale: Locale;
  name: string;
  label: DictionaryKey;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {t(locale, label)} {!required && <span className="font-normal text-slate-400">({t(locale, "optional")})</span>}
      </label>
      {textarea ? (
        <textarea id={name} name={name} rows={3} required={required} defaultValue={defaultValue} className={input} maxLength={500} />
      ) : (
        <input id={name} name={name} type={type} required={required} autoComplete={autoComplete} defaultValue={defaultValue} className={input} />
      )}
    </div>
  );
}

function ErrorBox({ locale, error }: { locale: Locale; error: DictionaryKey | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
      {t(locale, error)}
    </p>
  );
}

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      disabled={pending}
      className="min-h-12 w-full rounded-full bg-navy-900 px-6 font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function SignUpForm({ locale, departments }: { locale: Locale; departments: { iso: string; name: string }[] }) {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const v = state.values;
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <ErrorBox locale={locale} error={state.error} />
      <Field locale={locale} name="name" label="fieldName" autoComplete="name" defaultValue={v.name} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field locale={locale} name="email" label="fieldEmail" type="email" autoComplete="email" defaultValue={v.email} />
        <Field locale={locale} name="phone" label="fieldPhone" type="tel" autoComplete="tel" defaultValue={v.phone} />
      </div>
      <Field locale={locale} name="password" label="fieldPassword" type="password" autoComplete="new-password" />

      <fieldset className="mt-2 grid gap-5 rounded-2xl border border-slate-200 p-5">
        <legend className="px-1 text-base font-semibold text-navy-900">{t(locale, "haitiAddressTitle")}</legend>
        <p className="-mt-2 text-sm text-slate-500">{t(locale, "haitiAddressBody")}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="department" className={labelCls}>{t(locale, "fieldDepartment")}</label>
            <select id="department" name="department" required defaultValue={v.department ?? ""} className={`${input} text-sm`}>
              <option value="" disabled className="text-sm">{t(locale, "fieldDepartmentChoose")}</option>
              {departments.map((d) => (
                <option key={d.iso} value={d.iso} className="text-sm">{d.name}</option>
              ))}
            </select>
          </div>
          <Field locale={locale} name="city" label="fieldCity" autoComplete="address-level2" defaultValue={v.city} />
        </div>
        <Field locale={locale} name="neighborhood" label="fieldNeighborhood" required={false} defaultValue={v.neighborhood} />
        <Field locale={locale} name="directions" label="fieldDirections" required={false} defaultValue={v.directions} textarea />
        <Field locale={locale} name="haitiPhone" label="fieldHaitiPhone" type="tel" required={false} defaultValue={v.haitiPhone} />
      </fieldset>

      <Submit label={t(locale, "signupButton")} pending={pending} />
      <p className="text-center text-sm text-slate-500">
        {t(locale, "haveAccount")}{" "}
        <Link href={`/${locale}/signin`} className="font-semibold text-blue-700">{t(locale, "signinButton")}</Link>
      </p>
    </form>
  );
}

export function SignInForm({ locale, next }: { locale: Locale; next: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <ErrorBox locale={locale} error={state.error} />
      <Field locale={locale} name="email" label="fieldEmail" type="email" autoComplete="email" defaultValue={state.values.email} />
      <Field locale={locale} name="password" label="fieldPasswordPlain" type="password" autoComplete="current-password" />
      <Submit label={t(locale, "signinButton")} pending={pending} />
      <p className="text-center text-sm text-slate-500">
        {t(locale, "noAccount")}{" "}
        <Link href={`/${locale}/signup`} className="font-semibold text-blue-700">{t(locale, "signupButton")}</Link>
      </p>
    </form>
  );
}
