"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n/index";
import { formatMoney } from "@/lib/money/index";
import {
  DESTINATIONS,
  ORIGINS,
  SIZES,
  ZONES,
  sampleEstimate,
  type DestinationCode,
  type OriginCode,
  type SizeCode,
  type ZoneCode,
} from "@/lib/shipping/sample";

const field = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20";
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500";

export function PriceEstimator({ locale }: { locale: Locale }) {
  const [origin, setOrigin] = useState<OriginCode>("YUL");
  const [destination, setDestination] = useState<DestinationCode>("PAP");
  const [size, setSize] = useState<SizeCode>("barrel");
  const [delivery, setDelivery] = useState<"door" | "pickup">("door");
  const [zone, setZone] = useState<ZoneCode>("metro");

  const total = sampleEstimate({ origin, size, delivery, zone });

  return (
    <div id="estimate" className="rounded-3xl bg-white p-6 text-stone-900 shadow-xl shadow-blue-950/10 ring-1 ring-stone-200">
      <h2 className="text-lg font-bold">{t(locale, "estimateTitle")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="origin">{t(locale, "estimateFrom")}</label>
          <select id="origin" className={field} value={origin} onChange={(e) => setOrigin(e.target.value as OriginCode)}>
            {ORIGINS.map((o) => <option key={o.code} value={o.code}>{o.city}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="destination">{t(locale, "estimateTo")}</label>
          <select id="destination" className={field} value={destination} onChange={(e) => setDestination(e.target.value as DestinationCode)}>
            {DESTINATIONS.map((d) => <option key={d.code} value={d.code}>{d.city}</option>)}
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className={label}>{t(locale, "estimateSize")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {SIZES.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => setSize(s.code)}
              aria-pressed={size === s.code}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                size === s.code
                  ? "border-blue-800 bg-blue-50 ring-2 ring-blue-800/20"
                  : "border-stone-300 hover:border-stone-400"
              }`}
            >
              <span className="block text-sm font-semibold">{t(locale, s.label)}</span>
              <span className="block text-xs text-stone-500">{s.dims}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className={label}>{t(locale, "estimateDelivery")}</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1 text-sm">
          {(["door", "pickup"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDelivery(d)}
              aria-pressed={delivery === d}
              className={`rounded-lg px-3 py-2 font-medium transition ${
                delivery === d ? "bg-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {t(locale, d === "door" ? "estimateDoor" : "estimatePickup")}
            </button>
          ))}
        </div>
      </fieldset>

      {delivery === "door" && (
        <div className="mt-4">
          <label className={label} htmlFor="zone">{t(locale, "estimateZone")}</label>
          <select id="zone" className={field} value={zone} onChange={(e) => setZone(e.target.value as ZoneCode)}>
            {ZONES.map((z) => <option key={z.code} value={z.code}>{t(locale, z.label)}</option>)}
          </select>
        </div>
      )}

      <div className="mt-6 flex items-end justify-between border-t border-stone-200 pt-4">
        <span className="text-sm text-stone-600">{t(locale, "estimateTotal")}</span>
        <span className="text-3xl font-black tracking-tight text-blue-900">
          {formatMoney(total, "USD")} <span className="text-base font-semibold text-stone-500">USD</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-amber-700">{t(locale, "estimateSample")}</p>
    </div>
  );
}
