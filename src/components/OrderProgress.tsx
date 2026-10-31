import type { OrderStatus } from "@/lib/orders/index";

const STEPS: OrderStatus[] = ["expected", "received", "repackaging", "shipped", "delivered"];

/**
 * Progress line under a package: five steps joined by a line. Steps already
 * done are filled, the current step is highlighted, future steps are grey.
 * Cancelled packages show a single cancelled note instead of a line.
 */
export function OrderProgress({ status, labels }: { status: OrderStatus; labels: Record<OrderStatus, string> }) {
  if (status === "cancelled") {
    return <p className="mt-2 text-xs font-semibold text-slate-500">{labels.cancelled}</p>;
  }
  const current = STEPS.indexOf(status);
  return (
    <ol className="mt-2 flex items-start" aria-label="Package progress">
      {STEPS.map((step, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <li key={step} className="flex flex-1 items-start last:flex-none">
            <span className="flex flex-col items-center gap-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? "bg-emerald-600 text-white" : isCurrent ? "bg-navy-900 text-white ring-2 ring-blue-200" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span className={`max-w-16 text-center text-[10px] leading-tight ${isCurrent ? "font-bold text-navy-900" : "text-slate-500"}`}>
                {labels[step]}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span className={`mx-1 mt-2 h-0.5 flex-1 ${i < current ? "bg-emerald-600" : "bg-slate-200"}`} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
