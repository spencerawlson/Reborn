"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Locale } from "@/lib/i18n/index";
import { formatMoney } from "@/lib/money/index";
import {
  DESTINATIONS,
  ORIGINS,
  SIZES,
  ZONES,
  SAMPLE_SHOP_RATE_PER_LB,
  sampleEstimate,
  sampleShopEstimate,
  type DestinationCode,
  type OriginCode,
  type SizeCode,
  type ZoneCode,
} from "@/lib/shipping/sample";
import { ESTIMATOR_TABS, type EstimatorTab } from "@/lib/shipping/tabs";

const field =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500";

/** The one tool on the home page: Ship, Shop (Amazon forwarding), or Track. */
export function PriceEstimator({ locale, initialTab = "ship" }: { locale: Locale; initialTab?: EstimatorTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<EstimatorTab>(initialTab);
  const [pounds, setPounds] = useState("3");
  const [origin, setOrigin] = useState<OriginCode>("YUL");
  const [destination, setDestination] = useState<DestinationCode>("PAP");
  const [size, setSize] = useState<SizeCode>("barrel");
  const [delivery, setDelivery] = useState<"door" | "pickup">("door");
  const [zone, setZone] = useState<ZoneCode>("metro");
  const [number, setNumber] = useState("");

  const total = sampleEstimate({ origin, size, delivery, zone });

  return (
    <div id="ship" className="scroll-mt-20 rounded-3xl bg-white p-5 text-slate-900 shadow-[0_1px_2px_rgba(17,24,39,0.05),0_10px_28px_rgba(17,24,39,0.07)] ring-1 ring-slate-200 sm:p-6">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 text-sm font-bold">
        {ESTIMATOR_TABS.map(({ key, label: tabLabel }) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-xl py-2.5 transition ${tab === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
          >
            {t(locale, tabLabel)}
          </button>
        ))}
      </div>

      {tab === "shop" ? (
        <div className="mt-5">
          <h3 className="text-lg font-extrabold tracking-tight">{t(locale, "shopTitle")}</h3>
          <ol className="mt-3 grid gap-2 text-sm text-slate-600">
            {(["shopStep1", "shopStep2", "shopStep3"] as const).map((key, i) => (
              <li key={key} className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{i + 1}</span>
                {t(locale, key)}
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 font-mono text-sm leading-relaxed text-slate-700">
            <p className="mb-1 font-sans text-xs font-bold uppercase tracking-wide text-blue-700">{t(locale, "shopAddressLabel")}</p>
            Marie Joseph
            <br />
            <span className="font-bold text-slate-900">Suite RB-10482</span>
            <br />
            Miami, FL · USA
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <label className={label} htmlFor="pounds">{t(locale, "shopWeight")}</label>
              <input
                id="pounds"
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={pounds}
                onChange={(e) => setPounds(e.target.value)}
                className={field}
              />
            </div>
            <p className="pb-3 text-sm font-semibold text-slate-500">
              {formatMoney(SAMPLE_SHOP_RATE_PER_LB, "USD")} {t(locale, "shopPerLb")}
            </p>
          </div>

          <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">{t(locale, "estimateTotal")}</span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {formatMoney(sampleShopEstimate(Number(pounds)), "USD")} <span className="text-sm font-bold text-slate-400">USD</span>
            </span>
          </div>
          <button type="button" disabled className="mt-3 min-h-12 w-full cursor-not-allowed rounded-xl bg-blue-700 font-bold text-white opacity-60">
            {t(locale, "shopSignupSoon")}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">{t(locale, "estimateSample")}</p>
        </div>
      ) : tab === "track" ? (
        <form
          className="mt-5 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (number.trim()) router.push(`/${locale}/track?n=${encodeURIComponent(number.trim())}`);
          }}
        >
          <label className={label} htmlFor="track-n">{t(locale, "trackLabel")}</label>
          <input
            id="track-n"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="RB-24-000123"
            className={`${field} font-mono uppercase`}
          />
          <button className="min-h-12 rounded-xl bg-blue-700 font-bold text-white shadow-[0_4px_14px_rgba(29,78,216,0.25)] hover:bg-blue-800 active:scale-[0.98]">
            {t(locale, "trackButton")}
          </button>
        </form>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
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

          <p className={`${label} mt-4`}>{t(locale, "estimateSize")}</p>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setSize(s.code)}
                aria-pressed={size === s.code}
                title={s.dims}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                  size === s.code ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {t(locale, s.label)}
              </button>
            ))}
          </div>

          <p className={`${label} mt-4`}>{t(locale, "estimateDelivery")}</p>
          <div className="flex flex-wrap gap-2">
            {(["door", "pickup"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDelivery(d)}
                aria-pressed={delivery === d}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                  delivery === d ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {t(locale, d === "door" ? "estimateDoor" : "estimatePickup")}
              </button>
            ))}
          </div>

          {delivery === "door" && (
            <div className="mt-4">
              <label className={label} htmlFor="zone">{t(locale, "estimateZone")}</label>
              <select id="zone" className={field} value={zone} onChange={(e) => setZone(e.target.value as ZoneCode)}>
                {ZONES.map((z) => <option key={z.code} value={z.code}>{t(locale, z.label)}</option>)}
              </select>
            </div>
          )}

          <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">{t(locale, "estimateTotal")}</span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {formatMoney(total, "USD")} <span className="text-sm font-bold text-slate-400">USD</span>
            </span>
          </div>
          <button
            type="button"
            disabled
            className="mt-3 min-h-12 w-full cursor-not-allowed rounded-xl bg-blue-700 font-bold text-white opacity-60"
          >
            {t(locale, "bookingSoon")}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">{t(locale, "estimateSample")}</p>
        </>
      )}
    </div>
  );
}
