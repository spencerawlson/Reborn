"use server";

import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/auth/index";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/index";
import {
  setDoorDelivery,
  setWarehouseAddresses,
  validateWarehouseAddress,
  WAREHOUSE_CODES,
  type WarehouseAddress,
  type WarehouseAddresses,
} from "@/lib/settings/index";

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

export interface WarehouseFormState {
  error: string | null;
  saved: boolean;
}

/** Set the Miami and Montreal receiving addresses customers see. Admin only; audit-logged. */
export async function setWarehouseAddressesAction(_prev: WarehouseFormState, form: FormData): Promise<WarehouseFormState> {
  const session = await getSession();
  if (!session || !hasRole(session, "admin")) throw new Error("forbidden");
  const addresses: WarehouseAddresses = {};
  for (const code of WAREHOUSE_CODES) {
    const field = (name: keyof WarehouseAddress) => String(form.get(`${code}.${name}`) ?? "");
    const address: WarehouseAddress = {
      street: field("street"),
      city: field("city"),
      region: field("region"),
      postalCode: field("postalCode"),
      country: field("country"),
      phone: field("phone"),
    };
    // A warehouse with nothing entered beyond the pre-filled region/country
    // is simply not published yet.
    if (![address.street, address.city, address.postalCode, address.phone].some((v) => v.trim())) continue;
    if (validateWarehouseAddress(address)) return { error: code, saved: false };
    addresses[code] = address;
  }
  await setWarehouseAddresses(await getDb(), addresses, session.userId);
  revalidatePath("/", "layout");
  return { error: null, saved: true };
}
