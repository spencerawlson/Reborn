import { t, type Locale } from "@/lib/i18n/index";
import { HaitiMap } from "./HaitiMap";
import { MAIN_MAP } from "./map-data";

/**
 * "Our network" map — real geography (Natural Earth, public domain),
 * pre-projected to SVG by scripts/build-map.mts:
 * - left: eastern North America to Hispaniola, warehouses at their true
 *   positions, animated air & sea routes (CSS .route-flow);
 * - right: Haiti's 10 departments with their real borders, all served
 *   door to door; click one for details (HaitiMap).
 */
type City = { id: string; name: string; x: number; y: number };

const byId = (cities: readonly City[], id: string) => cities.find((c) => c.id === id)!;

/** Curved route between two points, bowed to the right of travel. */
function arc(a: City, b: City, bend: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `M${a.x} ${a.y} Q${mx - dy * bend} ${my + dx * bend} ${b.x} ${b.y}`;
}

// Haiti labels sit to the left (over the sea) so they never cover the Dominican Republic.
const LABEL_SIDE: Record<string, "start" | "end"> = { yul: "start", mia: "end", cap: "end", pap: "end" };

export function RouteMap({
  locale,
  department = null,
  doorLocked = false,
}: {
  locale: Locale;
  department?: string | null;
  doorLocked?: boolean;
}) {
  const c = MAIN_MAP.cities;
  const routes = [
    arc(byId(c, "yul"), byId(c, "cap"), -0.22),
    arc(byId(c, "yul"), byId(c, "pap"), -0.3),
    arc(byId(c, "mia"), byId(c, "cap"), 0.18),
    arc(byId(c, "mia"), byId(c, "pap"), 0.28),
  ];

  return (
    <figure className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
      {/* Main map */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#dbe8f7]">
        <svg
          viewBox={`0 0 ${MAIN_MAP.width} ${MAIN_MAP.height}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${t(locale, "networkTitle")}: Montréal, Miami → Cap-Haïtien, Port-au-Prince`}
        >
          {MAIN_MAP.land.map((country) => (
            <path
              key={country.name}
              d={country.d}
              fill={country.haiti ? "#1d4ed8" : "#ffffff"}
              stroke={country.haiti ? "#1d4ed8" : "#9fb0c8"}
              strokeWidth="0.7"
              strokeLinejoin="round"
            />
          ))}

          {routes.map((d) => (
            <g key={d}>
              <path d={d} fill="none" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" />
              <path d={d} fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" className="route-flow" />
            </g>
          ))}

          {c.map((city) => {
            const side = LABEL_SIDE[city.id];
            const nudgeY = city.id === "cap" ? -7 : city.id === "pap" ? 14 : 4;
            return (
              <g key={city.id}>
                <circle cx={city.x} cy={city.y} r="11" fill="#1d4ed8" opacity="0.15" className="node-pulse" />
                <circle cx={city.x} cy={city.y} r="4.5" fill="#fff" stroke="#0b1b3f" strokeWidth="2.5" />
                <text
                  x={city.x + (side === "start" ? 10 : -10)}
                  y={city.y + nudgeY}
                  textAnchor={side}
                  className="fill-slate-900"
                  style={{ font: "600 14px var(--font-inter), system-ui, sans-serif", paintOrder: "stroke", stroke: "#ffffff", strokeWidth: 4 }}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Haiti, department by department */}
      <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-blue-700">{t(locale, "kpi2Value")}</span> {t(locale, "kpi2Label")}
        </p>
        <HaitiMap locale={locale} initialSelected={department} doorLocked={doorLocked} />
        <figcaption className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-[3px] border-navy-900 bg-white" /> {t(locale, "legendWarehouse")}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-6 bg-[repeating-linear-gradient(90deg,#1d4ed8_0_5px,transparent_5px_9px)]" />{" "}
            {t(locale, "legendRoute")}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
