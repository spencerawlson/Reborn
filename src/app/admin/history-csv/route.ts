import { getSession } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/index";
import { getDb } from "@/lib/db/index";
import { listHistoryPackages } from "@/lib/orders/index";

/** Staff-only CSV report of History (delivered + cancelled packages). */
export async function GET() {
  const session = await getSession();
  if (!session || !(hasRole(session, "admin") || hasRole(session, "staff"))) {
    return new Response("forbidden", { status: 403 });
  }
  const rows = await listHistoryPackages(await getDb());
  const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    "tracking_code,suite,customer,warehouse,store,order_number,tracking_number,status,updated_at",
    ...rows.map((p) =>
      [
        p.trackingCode,
        p.suiteCode ?? "",
        p.customerName,
        p.warehouse,
        p.store,
        p.orderNumber ?? "",
        p.trackingNumber ?? "",
        p.status,
        p.updatedAt.toISOString(),
      ]
        .map(esc)
        .join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=shipitayiti-history.csv",
    },
  });
}
