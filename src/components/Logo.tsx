/**
 * ShipItAyiti logo — vector only, in the style of Farelune's logo: the
 * wordmark with a dashed trail drawn underneath and a little parcel that
 * keeps travelling along it from left to right (loops every 4 s).
 * Animation lives in globals.css (.logo-trail / .logo-parcel) and is
 * switched off for prefers-reduced-motion.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo relative inline-flex items-center pb-1.5 pr-7 ${className}`}>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">
        ShipIt<span className="text-red-600">Ayiti</span>
      </span>
      <span aria-hidden className="logo-trail pointer-events-none absolute bottom-0.5 left-0 h-px w-[calc(100%-1.6rem)] origin-left" />
      <svg aria-hidden viewBox="0 0 24 24" className="logo-parcel pointer-events-none absolute bottom-[-0.4rem] h-5 w-5 text-blue-700">
        {/* Parcel: box body, lid line, and tape */}
        <rect x="3" y="6" width="18" height="14" rx="2.5" fill="currentColor" />
        <path d="M3 10.5h18" stroke="#fff" strokeWidth="1.4" />
        <rect x="10" y="6" width="4" height="6.5" fill="#fff" opacity="0.9" />
      </svg>
    </span>
  );
}
