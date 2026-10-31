/**
 * Vector sky for the hero: deep blue at the top fading to a bright
 * horizon, a soft sun glow, and three layers of clouds that drift slowly
 * (time) and shift with scroll (--p, parallax: nearer layers move more).
 */
function Cloud({ x, y, s = 1, opacity = 0.3 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={opacity}>
      <ellipse cx="0" cy="0" rx="70" ry="22" />
      <circle cx="-30" cy="-12" r="26" />
      <circle cx="8" cy="-24" r="32" />
      <circle cx="44" cy="-10" r="24" />
    </g>
  );
}

export function SkyBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Gradient sky */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#081633" />
            <stop offset="38%" stopColor="#10285e" />
            <stop offset="72%" stopColor="#1e4fb8" />
            <stop offset="100%" stopColor="#5b9cf0" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sky)" />
      </svg>

      {/* Sun glow low on the horizon, rising a little as you scroll */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1440 900">
        <defs>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g style={{ transform: "translateY(calc(var(--p, 0) * -60px))" }}>
          <circle cx="1120" cy="700" r="260" fill="url(#sun)" />
          <circle cx="1120" cy="700" r="46" fill="#fef3c7" opacity="0.35" />
        </g>
      </svg>

      {/* Clouds: far, middle, near */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900">
        <g className="sky-drift-slow" style={{ transform: "translateX(calc(var(--p, 0) * -30px))" }}>
          <Cloud x={180} y={140} s={0.7} opacity={0.08} />
          <Cloud x={760} y={90} s={0.6} opacity={0.07} />
          <Cloud x={1300} y={170} s={0.8} opacity={0.08} />
        </g>
        <g className="sky-drift" style={{ transform: "translateX(calc(var(--p, 0) * -80px))" }}>
          <Cloud x={980} y={300} s={1.1} opacity={0.12} />
          <Cloud x={420} y={380} s={0.9} opacity={0.1} />
          <Cloud x={1380} y={420} s={1} opacity={0.12} />
        </g>
        <g className="sky-drift-fast" style={{ transform: "translateX(calc(var(--p, 0) * -160px))" }}>
          <Cloud x={1180} y={560} s={1.6} opacity={0.16} />
          <Cloud x={640} y={610} s={1.3} opacity={0.12} />
        </g>
      </svg>
    </div>
  );
}
