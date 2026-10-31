/**
 * The hero airplane — the original little plane (light blue, dashed
 * contrail). It hovers in flight just under the "Get a quote" button;
 * scrolling down it flies away to the upper right, drawing its contrail;
 * scrolling up brings it back (scroll progress --p from HeroScroll, CSS
 * offset-path; see globals.css .hero-plane / .hero-trail-*). Phones get a
 * shorter path.
 */
// Flight paths (founder, 2026-10-30): half the original distance; flat past the
// buttons, a short rounded turn, then a straight climb at 33° above horizontal
// (an obtuse 147° angle with the flat leg) — no shooting up into the sky.
const FLIGHTS = [
  { id: "narrow", show: "md:hidden", d: "M0 0 H110 Q130 0 146.8 -10.9 L190 -39" },
  { id: "wide", show: "hidden md:block", d: "M0 0 H430 Q470 0 503.5 -21.8 L650 -116.9" },
];

export function HeroPlane() {
  return (
    <div aria-hidden className="pointer-events-none relative mt-10 h-8 w-8">
      {FLIGHTS.map((f) => (
        <div key={f.id} className={f.show}>
          {/* Dashed contrail, drawn in behind the plane */}
          <svg className="hero-trail absolute left-4 top-4 overflow-visible" width="1" height="1">
            <defs>
              <mask id={`hero-trail-${f.id}`} maskUnits="userSpaceOnUse" x="-50" y="-700" width="1450" height="760">
                <path d={f.d} fill="none" stroke="#fff" strokeWidth="10" pathLength={1} className="hero-trail-reveal" />
              </mask>
            </defs>
            <path d={f.d} fill="none" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="6 7" opacity="0.6" mask={`url(#hero-trail-${f.id})`} />
          </svg>
          {/* The little plane */}
          <svg viewBox="-36 -24 72 48" className="hero-plane absolute left-0 top-0 h-[44px] w-[66px]" style={{ offsetPath: `path("${f.d}")` }}>
            <g fill="#e0f2fe" opacity="0.9" className="hero-plane-bob">
              <path d="M-24 -4 H22 C 30 -4, 36 0, 36 2 C 36 4, 30 6, 22 6 H-24 L-30 -6 H-24z" />
              <path d="M2 -2 L-10 -22 H-2 L16 -2z" />
              <path d="M2 4 L-10 22 H-2 L16 4z" />
              <path d="M-24 -2 L-30 -14 H-25 L-18 -2z" />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}
