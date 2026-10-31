"use server";

import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/auth/index";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/index";
import { setDoorDelivery } from "@/lib/settings/index";

/** Suspend or reopen door-to-door delivery in Haiti. Admin only; audit-logged. */
export async function setDoorDeliveryAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !hasRole(session, "admin")) throw new Error("forbidden");
  await setDoorDelivery(await getDb(), {
    locked: form.get("locked") === "true",
    reason: String(form.get("reason") ?? ""),
    adminId: session.userId,
  });
  revalidatePath("/", "layout");
}
