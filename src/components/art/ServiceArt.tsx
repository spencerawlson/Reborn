/**
 * Service card illustrations (vector only), one per service, drawn on a
 * 320×170 canvas in the site palette: navy, blue, Haiti red, cardboard tan.
 */
const NAVY = "#0b1b3f";
const BLUE = "#2563eb";
const RED = "#dc2626";
const TAN = "#d9a066";
const TAN_DARK = "#b9803f";
const TAPE = "#f1dcae";

function CardboardBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={TAN} />
      <rect x={x} y={y} width={w} height={h * 0.22} rx="3" fill={TAN_DARK} opacity="0.55" />
      <rect x={x + w / 2 - 6} y={y} width="12" height={h * 0.5} fill={TAPE} />
      <rect x={x + 8} y={y + h * 0.58} width={w * 0.36} height={h * 0.26} rx="2" fill="#fff" />
      <path d={`M${x + 12} ${y + h * 0.66} h${w * 0.24} M${x + 12} ${y + h * 0.75} h${w * 0.16}`} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Barrel({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="62" height="92" rx="10" fill={BLUE} />
      <ellipse cx={x + 31} cy={y + 4} rx="31" ry="6" fill="#3b82f6" />
      <ellipse cx={x + 31} cy={y + 4} rx="22" ry="3.5" fill="#1e40af" opacity="0.5" />
      {[26, 48, 70].map((dy) => (
        <path key={dy} d={`M${x} ${y + dy} Q ${x + 31} ${y + dy + 6} ${x + 62} ${y + dy}`} stroke="#1e40af" strokeWidth="3" fill="none" />
      ))}
      <rect x={x + 14} y={y + 32} width="34" height="12" rx="2" fill="#fff" opacity="0.9" />
    </g>
  );
}

export function BoxesArt() {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" aria-hidden>
      <rect width="320" height="170" fill="#eff6ff" />
      <circle cx="270" cy="38" r="20" fill="#fde68a" opacity="0.8" />
      {/* House in Haiti */}
      <g transform="translate(214 70)">
        <path d="M0 34 L40 4 L80 34" fill="none" stroke={NAVY} strokeWidth="5" strokeLinejoin="round" />
        <rect x="10" y="32" width="60" height="50" rx="2" fill="#fff" stroke={NAVY} strokeWidth="3" />
        <rect x="32" y="52" width="16" height="30" fill={RED} />
        <rect x="16" y="42" width="12" height="10" fill="#bfdbfe" />
      </g>
      <path d="M0 152 H320" stroke="#cbd5e1" strokeWidth="2" />
      <Barrel x={34} y={60} />
      <CardboardBox x={102} y={96} w={66} h={56} />
      <CardboardBox x={112} y={50} w={48} h={46} />
      <path d="M176 120 C 190 110, 200 110, 208 116" stroke={RED} strokeWidth="2.5" strokeDasharray="4 5" fill="none" strokeLinecap="round" />
      <path d="M204 110 l7 6 -9 3" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShopArt() {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" aria-hidden>
      <rect width="320" height="170" fill="#fef2f2" />
      {/* Phone with cart */}
      <g transform="translate(36 22)">
        <rect width="74" height="132" rx="12" fill={NAVY} />
        <rect x="6" y="12" width="62" height="104" rx="5" fill="#fff" />
        <rect x="14" y="22" width="46" height="34" rx="4" fill="#fde68a" />
        <path d="M24 34 h4 l4 14 h16 l3 -10 H30" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="51" r="2" fill={NAVY} />
        <circle cx="45" cy="51" r="2" fill={NAVY} />
        <rect x="14" y="64" width="46" height="6" rx="3" fill="#e2e8f0" />
        <rect x="14" y="76" width="30" height="6" rx="3" fill="#e2e8f0" />
        <rect x="14" y="92" width="46" height="14" rx="7" fill={RED} />
      </g>
      {/* Dashed route to a labelled parcel */}
      <path d="M120 88 C 150 60, 170 60, 196 80" stroke={BLUE} strokeWidth="2.5" strokeDasharray="5 6" fill="none" strokeLinecap="round" />
      <CardboardBox x={190} y={78} w={86} h={66} />
      {/* Shipping label with the customer's personal suite */}
      <rect x="196" y="112" width="66" height="22" rx="3" fill="#fff" stroke="#e2e8f0" />
      <text x="229" y="127" textAnchor="middle" style={{ font: "700 10px var(--font-inter), system-ui, sans-serif" }} fill={NAVY}>
        SIA-10482
      </text>
      {/* Plane */}
      <g transform="translate(236 40) rotate(-12)" fill={BLUE}>
        <path d="M-22 -3 H18 C 25 -3, 30 0, 30 1.5 C 30 3, 25 6, 18 6 H-22 L-27 -5 H-22z" />
        <path d="M0 -1 L-10 -18 H-4 L12 -1z" />
        <path d="M0 4 L-10 21 H-4 L12 4z" />
      </g>
    </svg>
  );
}

export function FreightArt() {
  const colors = [RED, BLUE, "#f59e0b", NAVY, "#0ea5e9", RED];
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" aria-hidden>
      <rect width="320" height="170" fill="#fffbeb" />
      {/* Crane */}
      <g stroke={NAVY} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M290 152 V30 M290 30 H120 M290 30 L310 50 M290 52 L310 50" />
        <path d="M150 30 V70" strokeWidth="2" />
      </g>
      <rect x="126" y="70" width="48" height="22" rx="2" fill="#f59e0b" />
      <path d="M134 70 v22 M142 70 v22 M150 70 v22 M158 70 v22 M166 70 v22" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
      {/* Container stack */}
      {[0, 1, 2].map((row) =>
        [0, 1].map((col) => {
          const i = row * 2 + col;
          return (
            <g key={i}>
              <rect x={40 + col * 76} y={128 - row * 24} width="72" height="22" rx="2" fill={colors[i]} />
              <path
                d={Array.from({ length: 6 }, (_, k) => `M${50 + col * 76 + k * 10} ${130 - row * 24} v18`).join(" ")}
                stroke="#fff"
                strokeWidth="1.2"
                opacity="0.35"
              />
            </g>
          );
        }),
      )}
      {/* Coffee sacks */}
      <g>
        <path d="M204 152 C 200 132, 206 118, 218 116 C 230 118, 236 132, 232 152z" fill="#a16207" />
        <path d="M234 152 C 230 136, 236 124, 246 122 C 256 124, 262 136, 258 152z" fill="#ca8a04" />
        <path d="M210 128 h16 M238 132 h14" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M0 152 H320" stroke="#e7c27a" strokeWidth="2" />
    </svg>
  );
}

/** Small delivery truck used on the "how it works" line and the CTA band. */
export function Truck({ className = "", label = false, inverse = false }: { className?: string; label?: boolean; inverse?: boolean }) {
  // inverse: the cargo box is navy instead of white — used in "How it works".
  const box = inverse ? NAVY : "#fff";
  return (
    <svg viewBox="0 0 120 56" className={className} aria-hidden>
      <rect x="2" y="6" width="74" height="36" rx="4" fill={box} stroke={NAVY} strokeWidth="3" />
      {label && (
        <text x="39" y="29" textAnchor="middle" style={{ font: "800 10px var(--font-inter), system-ui, sans-serif" }} fill={inverse ? "#fff" : NAVY}>
          ShipIt<tspan fill={RED}>Ayiti</tspan>
        </text>
      )}
      {!label && <rect x="30" y="16" width="18" height="14" rx="2" fill={TAN} />}
      <path d="M76 16 H98 L114 30 V42 H76z" fill={RED} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 20 H96 L106 30 H84z" fill="#bfdbfe" />
      <circle cx="24" cy="44" r="8" fill={NAVY} />
      <circle cx="24" cy="44" r="3" fill="#fff" />
      <circle cx="94" cy="44" r="8" fill={NAVY} />
      <circle cx="94" cy="44" r="3" fill="#fff" />
    </svg>
  );
}
