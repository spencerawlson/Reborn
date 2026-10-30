import { t, type Locale } from "@/lib/i18n/index";

/**
 * Vector network map: Montréal and Miami warehouses linked to Port-au-
 * Prince and Cap-Haïtien by animated dashed routes (CSS .route-flow).
 * Positions follow real longitude/latitude roughly (Haiti nudged apart
 * so labels don't collide); it is a diagram, not a survey map.
 */
const NODES = [
  { id: "yul", name: "Montréal", x: 420, y: 46, anchor: "start" as const, dx: 14, dy: 5 },
  { id: "mia", name: "Miami", x: 120, y: 236, anchor: "end" as const, dx: -14, dy: 5 },
  { id: "cap", name: "Cap-Haïtien", x: 482, y: 280, anchor: "start" as const, dx: 14, dy: 5 },
  { id: "pap", name: "Port-au-Prince", x: 462, y: 330, anchor: "start" as const, dx: 14, dy: 5 },
];

const ROUTES = [
  "M420 46 C 560 120, 540 220, 482 280",
  "M420 46 C 330 170, 380 290, 462 330",
  "M120 236 C 230 200, 380 220, 482 280",
  "M120 236 C 220 300, 360 340, 462 330",
];

export function RouteMap({ locale }: { locale: Locale }) {
  return (
    <figure className="relative">
      <svg viewBox="0 0 640 380" className="h-auto w-full" role="img" aria-label={t(locale, "networkTitle")}>
        <defs>
          <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#cbd5e1" />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="640" height="380" fill="url(#dots)" />
        <rect width="640" height="380" fill="url(#fade)" />

        {ROUTES.map((d) => (
          <g key={d}>
            <path d={d} fill="none" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" className="route-flow" />
          </g>
        ))}

        {NODES.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="14" fill="#1d4ed8" opacity="0.12" className="node-pulse" />
            <circle cx={n.x} cy={n.y} r="6.5" fill="#fff" stroke="#0b1b3f" strokeWidth="3" />
            <text
              x={n.x + n.dx}
              y={n.y + n.dy}
              textAnchor={n.anchor}
              className="fill-slate-900"
              style={{ font: "600 15px var(--font-inter), system-ui, sans-serif" }}
            >
              {n.name}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-[3px] border-navy-900 bg-white" /> {t(locale, "legendWarehouse")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 bg-[repeating-linear-gradient(90deg,#1d4ed8_0_5px,transparent_5px_9px)]" />{" "}
          {t(locale, "legendRoute")}
        </span>
      </figcaption>
    </figure>
  );
}
