/**
 * ShipItAyiti logo, built like Farelune's: the wordmark, a dashed trail
 * that draws in underneath, and a little parcel that flies in from the
 * left along it — once on load, again on hover (same 2.2 s timing and
 * curve as Farelune's plane). Animation: globals.css (.logo-trail,
 * .logo-parcel).
 *
 * The parcel is the ONLY bitmap on the website (founder's exception to
 * the vector-only rule): public/parcel.png, 96×96 shown at 24 px.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo group relative inline-flex items-center pb-1.5 pr-9 ${className}`}>
      <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
        ShipIt<span className="text-red-600">Ayiti</span>
      </span>
      <span aria-hidden className="logo-trail pointer-events-none absolute bottom-0.5 left-0 h-px w-[calc(100%-1.75rem)] origin-left" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size logo bitmap */}
      <img
        src="/parcel.png"
        alt=""
        aria-hidden
        width={24}
        height={24}
        className="logo-parcel pointer-events-none absolute bottom-[-0.35rem] h-6 w-6"
      />
    </span>
  );
}
