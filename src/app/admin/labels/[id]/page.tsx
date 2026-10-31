import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getPackageLabel } from "@/lib/admin/customers";
import { requireAdmin } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/index";
import { formatMoney } from "@/lib/money/index";
import { code128Svg, qrSvg } from "@/lib/shipping/barcode";
import { WAREHOUSE_NAME } from "@/lib/shipping/departments";
import { getWarehouseAddresses } from "@/lib/settings/index";
import { HAITI_MAP } from "@/components/map-data";

export const dynamic = "force-dynamic";

/**
 * Printable 4×6 in shipping label (standard thermal label) for one package:
 * tracking code with Code 128 + QR (vector SVG), FROM warehouse, TO the
 * customer's Haiti address, destination hub, suite, contents, and boxes for
 * staff to fill (weight, pieces, mode). The delivery OTP is not printed.
 */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/labels/${id}`);
  const db = await getDb();
  const label = await getPackageLabel(db, id);
  if (!label) notFound();
  const from = (await getWarehouseAddresses(db))[label.warehouse];
  const c = label.customer;
  const dept = HAITI_MAP.departments.find((d) => d.iso === c.department)?.name;
  const printed = new Date().toLocaleDateString("en-CA");

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <style>{`@page { size: 4in 6in; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
      <div className="mx-auto mb-5 flex w-[4in] items-center justify-between print:hidden">
        <Link href={`/admin/customers/${c.id}`} className="text-sm font-semibold text-blue-700">← {c.name}</Link>
        <PrintButton />
      </div>

      <article className="mx-auto flex h-[6in] w-[4in] flex-col overflow-hidden bg-white text-[9pt] leading-tight text-black shadow-lg ring-1 ring-black print:shadow-none print:ring-0">
        {/* Header: brand + route */}
        <div className="flex items-center justify-between border-b-2 border-black px-3 py-2">
          <span className="text-[13pt] font-black tracking-tight">ShipIt<span className="text-red-600">Ayiti</span></span>
          <span className="text-right text-[8pt] font-semibold uppercase">
            {label.warehouse} → {label.destinationHub ?? "HT"}
            <span className="block font-normal normal-case">Online-store forwarding</span>
          </span>
        </div>

        {/* FROM */}
        <div className="border-b border-black px-3 py-1.5">
          <p className="text-[7pt] font-bold uppercase">From / De</p>
          <p className="font-semibold">ShipItAyiti — {WAREHOUSE_NAME_ABROAD[label.warehouse]}</p>
          {from ? (
            <p>
              {from.street}, {from.city}, {from.region} {from.postalCode}, {from.country}
              {from.phone ? ` · ${from.phone}` : ""}
            </p>
          ) : (
            <p className="italic">Warehouse address not set (Admin → Warehouse addresses)</p>
          )}
        </div>

        {/* TO */}
        <div className="flex-1 border-b-2 border-black px-3 py-2">
          <p className="text-[7pt] font-bold uppercase">To / À</p>
          <p className="text-[14pt] font-black leading-snug">{c.name}</p>
          <p className="text-[11pt] font-semibold">{c.haitiPhone || c.phone}</p>
          {c.haitiPhone && c.phone && c.haitiPhone !== c.phone && <p className="text-[8pt]">Alt: {c.phone}</p>}
          <p className="mt-1 text-[11pt] font-semibold">
            {[c.neighborhood, c.city].filter(Boolean).join(", ")}
            {dept ? ` — ${dept}` : ""}, Haïti
          </p>
          {c.directions && <p className="mt-1 text-[9pt]">{c.directions}</p>}
        </div>

        {/* Hub + suite */}
        <div className="grid grid-cols-[1fr_auto] border-b-2 border-black">
          <div className="border-r-2 border-black px-3 py-1.5">
            <p className="text-[7pt] font-bold uppercase">Destination hub</p>
            <p className="text-[22pt] font-black leading-none">{label.destinationHub ?? "—"}</p>
            <p className="text-[8pt]">{label.destinationHub ? WAREHOUSE_NAME[label.destinationHub] : "Unknown department"}</p>
          </div>
          <div className="px-3 py-1.5 text-right">
            <p className="text-[7pt] font-bold uppercase">Suite</p>
            <p className="font-mono text-[14pt] font-black">{c.suiteCode}</p>
          </div>
        </div>

        {/* Barcode + QR */}
        <div className="flex items-center gap-2 border-b border-black px-3 py-2">
          <div className="flex-1">
            <div className="h-[0.75in] w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: code128Svg(label.trackingCode) }} />
            <p className="mt-0.5 text-center font-mono text-[11pt] font-bold tracking-widest">{label.trackingCode}</p>
          </div>
          <div className="h-[0.85in] w-[0.85in] shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg(label.trackingCode) }} />
        </div>

        {/* Contents + staff boxes */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-1.5 text-[8pt]">
          <p className="col-span-2">
            <span className="font-bold">Contents:</span> {label.description ?? "Not declared — inspect"}
            {label.declaredValueMinor !== null && <> · <span className="font-bold">Value:</span> {formatMoney(label.declaredValueMinor, "USD")}</>}
          </p>
          <p className="col-span-2 truncate">
            <span className="font-bold">Ref:</span> {label.store}
            {label.orderNumber ? ` #${label.orderNumber}` : ""}
            {label.inboundTracking ? ` · in: ${label.inboundTracking}` : ""}
          </p>
          <p><span className="font-bold">Weight:</span> ________ lb</p>
          <p><span className="font-bold">Piece:</span> ___ of ___</p>
          <p className="flex items-center gap-1">
            <span className="font-bold">Mode:</span> <Box /> Air <Box /> Sea
          </p>
          <p><span className="font-bold">Printed:</span> {printed}</p>
        </div>
      </article>
    </div>
  );
}

const WAREHOUSE_NAME_ABROAD = { MIA: "Miami", YUL: "Montréal" } as const;

/** Empty tick box drawn with CSS (no glyphs — vector-only rule). */
function Box() {
  return <span aria-hidden className="inline-block h-[9pt] w-[9pt] border border-black" />;
}
