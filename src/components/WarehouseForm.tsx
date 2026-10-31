"use client";

import { useActionState } from "react";
import { setWarehouseAddressesAction, type WarehouseFormState } from "@/app/admin/actions";
import { t, type DictionaryKey, type Locale } from "@/lib/i18n/index";
import type { WarehouseAddress, WarehouseAddresses } from "@/lib/settings/index";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const WAREHOUSES = [
  { code: "MIA", name: "Miami", defaults: { region: "FL", country: "USA" } },
  { code: "YUL", name: "Montreal", defaults: { region: "QC", country: "Canada" } },
] as const;

const FIELDS: { key: keyof WarehouseAddress; label: DictionaryKey; wide?: boolean; optional?: boolean }[] = [
  { key: "street", label: "fieldStreet", wide: true },
  { key: "city", label: "fieldCity" },
  { key: "region", label: "fieldRegion" },
  { key: "postalCode", label: "fieldPostal" },
  { key: "country", label: "fieldCountry" },
  { key: "phone", label: "fieldWarehousePhone", optional: true },
];

/** Admin form: Miami and Montreal receiving addresses shown to customers with their suite. */
export function WarehouseForm({ locale, current }: { locale: Locale; current: WarehouseAddresses }) {
  const [state, action, pending] = useActionState<WarehouseFormState, FormData>(setWarehouseAddressesAction, { error: null, saved: false });
  return (
    <form action={action} className="mt-5 grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {WAREHOUSES.map((w) => {
          const a = current[w.code];
          return (
            <fieldset key={w.code} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 ${state.error === w.code ? "border-red-300 bg-red-50/40" : "border-slate-200"}`}>
              <legend className="px-1 font-semibold text-navy-900">{w.name}</legend>
              {FIELDS.map((f) => (
                <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                  <label htmlFor={`${w.code}.${f.key}`} className={labelCls}>
                    {t(locale, f.label)} {f.optional && <span className="normal-case text-slate-400">({t(locale, "optional")})</span>}
                  </label>
                  <input
                    id={`${w.code}.${f.key}`}
                    name={`${w.code}.${f.key}`}
                    maxLength={120}
                    defaultValue={a?.[f.key] ?? (f.key === "region" || f.key === "country" ? w.defaults[f.key] : "")}
                    className={input}
                  />
                </div>
              ))}
            </fieldset>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="min-h-11 rounded-full bg-navy-900 px-5 font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
          {pending ? "…" : t(locale, "adminWarehouseSave")}
        </button>
        {state.error && <p role="alert" className="text-sm font-medium text-red-700">{t(locale, "adminWarehouseError")}</p>}
        {state.saved && <p role="status" className="text-sm font-medium text-emerald-700">{t(locale, "adminWarehouseSaved")}</p>}
      </div>
    </form>
  );
}
