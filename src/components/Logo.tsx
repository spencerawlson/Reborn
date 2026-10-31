/**
 * ShipItAyiti logo, built like Farelune's: the wordmark, a dashed trail
 * that draws in underneath, and a little parcel that flies in from the
 * left along it — once on load, again on hover (same 2.2 s timing and
 * curve as Farelune's plane). Animation: globals.css (.logo-trail,
 * .logo-parcel).
 *
 * The parcel is an inline SVG (kraft box, tape, address label) — the
 * website is fully vector.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo group relative inline-flex items-center pb-1.5 pr-9 ${className}`}>
      <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
        ShipIt<span className="text-red-600">Ayiti</span>
      </span>
      <span aria-hidden className="logo-trail pointer-events-none absolute bottom-0.5 left-0 h-px w-[calc(100%-1.75rem)] origin-left" />
      <svg
        viewBox="0 0 24 24"
        width={24}
        height={24}
        aria-hidden
        className="logo-parcel pointer-events-none absolute bottom-[-0.35rem] h-6 w-6"
        strokeLinejoin="round"
      >
        <g stroke="#7a4a1e" strokeWidth="0.9">
          <path d="M12 2.5 21.5 7.25 12 12 2.5 7.25Z" fill="#e3a85e" />
          <path d="M2.5 7.25 12 12v9.5l-9.5-4.75Z" fill="#c88a45" />
          <path d="M21.5 7.25 12 12v9.5l9.5-4.75Z" fill="#b07434" />
        </g>
        {/* tape over the top and down the front-right face */}
        <path d="M6.25 4.9 7.75 4.15l9.5 4.75v9.5l-1.5.75V9.65Z" fill="#f2c88c" />
        <path d="M15.75 9.65v9.5" stroke="#7a4a1e" strokeWidth="0.4" opacity="0.5" />
        {/* address label */}
        <path d="M4 10.5l4.5 2.25v2.5L4 13Z" fill="#fff" stroke="#7a4a1e" strokeWidth="0.4" />
        <path d="M4.9 11.9l2.6 1.3M4.9 12.9l1.8.9" stroke="#94a3b8" strokeWidth="0.45" strokeLinecap="round" />
      </svg>
    </span>
  );
}
