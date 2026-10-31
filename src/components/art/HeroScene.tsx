/**
 * Hero background scene (vector only): port cranes and container stacks,
 * palm trees, waves and a container ship. Scroll-driven via the CSS
 * variable --p (0 at the top → 1, set by HeroScroll): scrolling down, the
 * ship sails from the right into port; scrolling up reverses it. The
 * airplane is HeroPlane (takes off from under the CTA). Waves and the
 * ship's bob are time-based (globals.css .scene-*).
 */
const CONTAINER_COLORS = ["#dc2626", "#2563eb", "#f59e0b", "#0ea5e9", "#e11d48", "#3b82f6"];

function ContainerRow({ x, y, count, w = 30, h = 14, offset = 0 }: { x: number; y: number; count: number; w?: number; h?: number; offset?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x + i * (w + 2)}
          y={y}
          width={w}
          height={h}
          rx="1.5"
          fill={CONTAINER_COLORS[(i + offset) % CONTAINER_COLORS.length]}
          opacity="0.85"
        />
      ))}
    </>
  );
}

function Crane({ x }: { x: number }) {
  return (
    <g stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55">
      <path d={`M${x} 228 V96 M${x + 34} 228 V96 M${x} 120 H${x + 34} M${x} 160 L${x + 34} 120 M${x + 34} 160 L${x} 200`} />
      <path d={`M${x - 70} 96 H${x + 90} M${x - 70} 96 L${x + 17} 70 L${x + 90} 96`} />
      <path d={`M${x - 40} 96 V130`} strokeWidth="1.5" />
      <rect x={x - 52} y="130" width="24" height="11" rx="1.5" fill="#f59e0b" stroke="none" opacity="0.9" />
    </g>
  );
}

function Palm({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} 230) scale(${s})`} opacity="0.5">
      <path d="M0 0 C 4 -30, 2 -60, 10 -86" stroke="#7dd3fc" strokeWidth="4" fill="none" strokeLinecap="round" />
      <g fill="#38bdf8">
        <path d="M10 -86 C -14 -98, -34 -88, -44 -70 C -22 -82, -4 -84, 10 -86z" />
        <path d="M10 -86 C 32 -100, 54 -92, 62 -74 C 42 -86, 24 -86, 10 -86z" />
        <path d="M10 -86 C 0 -110, 14 -124, 28 -126 C 18 -112, 14 -100, 10 -86z" />
        <path d="M10 -86 C 24 -108, 44 -110, 54 -102 C 38 -100, 24 -94, 10 -86z" />
        <path d="M10 -86 C -6 -104, -26 -106, -36 -98 C -20 -98, -4 -92, 10 -86z" />
      </g>
    </g>
  );
}

export function HeroScene() {
  return (
    <svg
      aria-hidden
      viewBox="0 -200 1440 460"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[380px] w-full sm:h-[460px] md:h-[380px]"
    >
      {/* Port: cranes and container stacks */}
      <Crane x={150} />
      <Crane x={330} />
      <g>
        <ContainerRow x={40} y={214} count={7} />
        <ContainerRow x={56} y={198} count={5} offset={2} />
        <ContainerRow x={72} y={182} count={3} offset={4} />
        <ContainerRow x={270} y={214} count={4} offset={1} />
        <ContainerRow x={286} y={198} count={2} offset={3} />
      </g>

      {/* Haiti side: hills and palms */}
      <path d="M1180 232 C 1230 190, 1280 196, 1320 214 C 1360 186, 1410 182, 1440 200 V232z" fill="#60a5fa" opacity="0.18" />
      <Palm x={1250} s={0.85} />
      <Palm x={1330} />
      <Palm x={1395} s={0.7} />

      {/* Ship: waits fully offshore at the top, sails left into port as you scroll down */}
      <g style={{ transform: "translate(calc(1750px - var(--p, 0) * 1120px), 238px)" }}>
        <g className="scene-bob">
          <g transform="scale(-1 1)">
          <rect x="-2" y="-62" width="22" height="30" rx="2" fill="#e0f2fe" opacity="0.95" />
          <rect x="3" y="-56" width="12" height="5" rx="1" fill="#0b1b3f" opacity="0.6" />
          <ContainerRow x={26} y={-46} count={8} w={20} h={12} />
          <ContainerRow x={26} y={-60} count={6} w={20} h={12} offset={3} />
          <ContainerRow x={48} y={-74} count={3} w={20} h={12} offset={1} />
          <path d="M-30 -32 H210 L190 0 H-14z" fill="#f8fafc" />
          <path d="M-26 -26 H205" stroke="#dc2626" strokeWidth="3" />
          </g>
        </g>
      </g>

      {/* Sea: two drifting wave bands */}
      <g className="scene-waves">
        <path
          d="M0 236 Q 30 228 60 236 T 120 236 T 180 236 T 240 236 T 300 236 T 360 236 T 420 236 T 480 236 T 540 236 T 600 236 T 660 236 T 720 236 T 780 236 T 840 236 T 900 236 T 960 236 T 1020 236 T 1080 236 T 1140 236 T 1200 236 T 1260 236 T 1320 236 T 1380 236 T 1440 236 T 1500 236 T 1560 236 V260 H0z"
          fill="#3b82f6"
          opacity="0.22"
        />
      </g>
      <g className="scene-waves-slow">
        <path
          d="M0 246 Q 40 238 80 246 T 160 246 T 240 246 T 320 246 T 400 246 T 480 246 T 560 246 T 640 246 T 720 246 T 800 246 T 880 246 T 960 246 T 1040 246 T 1120 246 T 1200 246 T 1280 246 T 1360 246 T 1440 246 T 1520 246 T 1600 246 V260 H0z"
          fill="#1d4ed8"
          opacity="0.35"
        />
      </g>
    </svg>
  );
}
