"use client";

export function PrintButton({ label = "Print label" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 print:hidden"
    >
      {label}
    </button>
  );
}
