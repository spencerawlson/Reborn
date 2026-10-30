"use client";

import Link from "next/link";
import { useState } from "react";
import { t, type Locale } from "@/lib/i18n/index";
import { DEPARTMENTS, WAREHOUSE_NAME } from "@/lib/shipping/departments";
import { Icon } from "./Icon";
import { HAITI_MAP } from "./map-data";

/**
 * Haiti's 10 departments (real borders). Hover highlights; click (or
 * Enter/Space) selects a department and shows its capital, door-to-door
 * service, the nearest warehouse, and a "get a price" link that opens the
 * quote card with that destination preselected. ?dept=HT-XX preselects.
 * Department data: src/lib/shipping/departments.ts.
 */
// Department label nudges where the centroid collides with a city dot.
const LABEL_NUDGE: Record<string, [number, number]> = { "HT-OU": [4, 13] };

export function HaitiMap({ locale, initialSelected = null }: { locale: Locale; initialSelected?: string | null }) {
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const dept = selected ? HAITI_MAP.departments.find((d) => d.iso === selected) : undefined;
  const info = selected ? DEPARTMENTS[selected] : undefined;

  return (
    <>
      <svg viewBox={`0 0 ${HAITI_MAP.width} ${HAITI_MAP.height}`} className="mt-3 h-auto w-full" role="group" aria-label={t(locale, "kpi2Label")}>
        {HAITI_MAP.departments.map((d) => {
          const isSelected = d.iso === selected;
          return (
            <path
              key={d.iso}
              d={d.d}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={d.name}
              onClick={() => setSelected(isSelected ? null : d.iso)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(isSelected ? null : d.iso);
                }
              }}
              className={`cursor-pointer outline-none transition-colors focus-visible:fill-blue-300 ${
                isSelected ? "fill-blue-700" : "fill-blue-100 hover:fill-blue-200"
              }`}
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <title>{d.name}</title>
            </path>
          );
        })}
        {HAITI_MAP.departments.map((d) => (
          <text
            key={`${d.iso}-label`}
            x={d.cx + (LABEL_NUDGE[d.iso]?.[0] ?? 0)}
            y={d.cy + (LABEL_NUDGE[d.iso]?.[1] ?? 0)}
            textAnchor="middle"
            className={`pointer-events-none ${d.iso === selected ? "fill-white" : "fill-navy-800"}`}
            style={{ font: "600 9px var(--font-inter), system-ui, sans-serif" }}
          >
            {d.name}
          </text>
        ))}
        {HAITI_MAP.cities.map((city) => (
          <circle key={city.id} cx={city.x} cy={city.y} r="4" fill="#fff" stroke="#0b1b3f" strokeWidth="2" className="pointer-events-none" />
        ))}
      </svg>

      <div aria-live="polite" className="mt-4 min-h-[7.5rem]">
        {dept && info ? (
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-navy-900">{dept.name}</p>
                <p className="text-sm text-slate-500">
                  {t(locale, "deptCapital")}: <span className="font-medium text-slate-700">{info.capital}</span>
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full px-2 text-lg leading-none text-slate-400 hover:text-slate-700" aria-label={t(locale, "deptClose")}>
                ×
              </button>
            </div>
            <ul className="mt-3 grid gap-1.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon name="check" size={13} strokeWidth={3} />
                </span>
                {t(locale, "deptDoor")}
              </li>
              <li className="flex items-center gap-2">
                <Icon name="pin" size={18} className="text-blue-700" />
                {t(locale, "deptNearest")}: <span className="font-medium text-slate-700">{WAREHOUSE_NAME[info.nearest]}</span>
              </li>
            </ul>
            <Link
              href={`/${locale}?tab=ship&to=${info.nearest}#ship`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              {t(locale, "deptCta")} <Icon name="arrowRight" size={15} strokeWidth={2.2} />
            </Link>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Icon name="pin" size={18} /> {t(locale, "deptHint")}
          </p>
        )}
      </div>
    </>
  );
}
