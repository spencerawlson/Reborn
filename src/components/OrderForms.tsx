"use client";

import Link from "next/link";
import { useActionState } from "react";
import { prohibitedById } from "@/lib/shipping/prohibited";
import { addOrderAction, setOtpAction, type OrderFormState } from "@/lib/orders/actions";
import { montreal, t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
const initial: OrderFormState = { error: null, saved: false, values: {} };

function Label({ locale, htmlFor, k, optional = false }: { locale: Locale; htmlFor: string; k: DictionaryKey; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className={labelCls}>
      {t(locale, k)} {optional && <span className="font-normal text-slate-400">({t(locale, "optional")})</span>}
    </label>
  );
}

export function AddOrderForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(addOrderAction, initial);
  const v = state.values;
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      {state.error && state.prohibited ? (
        <ProhibitedError locale={locale} id={state.prohibited} />
      ) : (
        state.error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {t(locale, state.error)}
          </p>
        )
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label locale={locale} htmlFor="warehouse" k="fieldWarehouse" />
          <select id="warehouse" name="warehouse" defaultValue={v.warehouse ?? "MIA"} className={input}>
            <option value="MIA">Miami</option>
            <option value="YUL">{montreal(locale)}</option>
          </select>
        </div>
        <div>
          <Label locale={locale} htmlFor="store" k="fieldStore" />
          <input id="store" name="store" required maxLength={80} defaultValue={v.store ?? "Amazon"} className={input} />
        </div>
        <div>
          <Label locale={locale} htmlFor="orderNumber" k="fieldOrderNumber" optional />
          <input id="orderNumber" name="orderNumber" maxLength={80} defaultValue={v.orderNumber} className={`${input} font-mono`} />
        </div>
        <div>
          <Label locale={locale} htmlFor="trackingNumber" k="fieldTracking" optional />
          <input id="trackingNumber" name="trackingNumber" maxLength={80} defaultValue={v.trackingNumber} className={`${input} font-mono`} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div>
          <label htmlFor="description" className={labelCls}>
            {t(locale, "fieldDescription")}{" "}
            <span className="font-normal text-slate-400">
              ({t(locale, "optional")} — {t(locale, "recommended")})
            </span>
          </label>
          <input id="description" name="description" maxLength={300} defaultValue={v.description} aria-describedby="description-notice" className={input} />
        </div>
        <div>
          <Label locale={locale} htmlFor="value" k="fieldValue" optional />
          <input id="value" name="value" inputMode="decimal" placeholder="49.99" defaultValue={v.value} className={input} />
        </div>
      </div>
      <p id="description-notice" className="flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
        <span aria-hidden className="font-bold">!</span>
        <span>
          {t(locale, "descriptionNotice")}{" "}
          <Link href={`/${locale}/prohibited`} className="font-semibold underline">
            {t(locale, "prohibitedSeeList")}
          </Link>
        </span>
      </p>
      <button disabled={pending} className="min-h-12 rounded-full bg-navy-900 px-6 font-semibold text-white hover:bg-navy-800 disabled:opacity-60 sm:justify-self-start">
        {pending ? "…" : t(locale, "orderSave")}
      </button>
    </form>
  );
}

/** Blocked order: which category, why, and the reference it comes from. */
function ProhibitedError({ locale, id }: { locale: Locale; id: string }) {
  const category = prohibitedById(id);
  if (!category) return null;
  return (
    <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">
      <p className="font-semibold">
        {t(locale, "errProhibited")}: {category.title[locale]}
      </p>
      <p className="mt-1">{category.reason[locale]}</p>
      <p className="mt-1 font-semibold">{t(locale, "prohibitedNoReturn")}</p>
      <p className="mt-2 text-xs">
        {t(locale, "prohibitedReference")}:{" "}
        <a href={category.references[0].url} target="_blank" rel="noopener noreferrer" className="underline">
          {category.references[0].label}
        </a>
      </p>
      <Link href={`/${locale}/prohibited#${category.id}`} className="mt-2 inline-block text-xs font-semibold underline">
        {t(locale, "prohibitedSeeList")}
      </Link>
    </div>
  );
}

export function OtpForm({ locale, orderId, current }: { locale: Locale; orderId: string; current: string | null }) {
  const [state, action, pending] = useActionState(setOtpAction, { ...initial, values: { otp: current ?? "" } });
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex flex-wrap gap-3">
        <label htmlFor="otp" className="sr-only">{t(locale, "orderOtpTitle")}</label>
        <input
          id="otp"
          name="otp"
          inputMode="text"
          autoComplete="one-time-code"
          maxLength={10}
          defaultValue={state.values.otp}
          placeholder="123456"
          className={`${input} max-w-56 font-mono text-lg tracking-[0.3em]`}
        />
        <button disabled={pending} className="min-h-12 rounded-full bg-navy-900 px-6 font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
          {pending ? "…" : t(locale, "orderOtpSave")}
        </button>
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-red-700">{t(locale, state.error)}</p>}
      {state.saved && <p role="status" className="text-sm font-medium text-emerald-700">{t(locale, "orderOtpSaved")}</p>}
    </form>
  );
}
