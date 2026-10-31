"use client";

import { useActionState } from "react";
import { addOrderAction, setOtpAction, type OrderFormState } from "@/lib/orders/actions";
import { t, type DictionaryKey, type Locale } from "@/lib/i18n/index";

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
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {t(locale, state.error)}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label locale={locale} htmlFor="warehouse" k="fieldWarehouse" />
          <select id="warehouse" name="warehouse" defaultValue={v.warehouse ?? "MIA"} className={input}>
            <option value="MIA">Miami</option>
            <option value="YUL">Montréal</option>
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
          <Label locale={locale} htmlFor="description" k="fieldDescription" />
          <input id="description" name="description" required maxLength={300} defaultValue={v.description} className={input} />
        </div>
        <div>
          <Label locale={locale} htmlFor="value" k="fieldValue" optional />
          <input id="value" name="value" inputMode="decimal" placeholder="49.99" defaultValue={v.value} className={input} />
        </div>
      </div>
      <button disabled={pending} className="min-h-12 rounded-full bg-navy-900 px-6 font-semibold text-white hover:bg-navy-800 disabled:opacity-60 sm:justify-self-start">
        {pending ? "…" : t(locale, "orderSave")}
      </button>
    </form>
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
