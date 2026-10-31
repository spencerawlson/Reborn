"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "../auth/session";
import { getDb } from "../db/index";
import { resolveLocale, type DictionaryKey } from "../i18n/index";
import { createOrder, setOrderOtp } from "./index";

export interface OrderFormState {
  error: DictionaryKey | null;
  /** Prohibited category id when the order was blocked (see shipping/prohibited). */
  prohibited?: string;
  saved: boolean;
  values: Record<string, string>;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

export async function addOrderAction(_prev: OrderFormState, form: FormData): Promise<OrderFormState> {
  const locale = resolveLocale(text(form, "locale"));
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account`);
  const input = {
    warehouse: text(form, "warehouse"),
    store: text(form, "store"),
    orderNumber: text(form, "orderNumber"),
    trackingNumber: text(form, "trackingNumber"),
    description: text(form, "description"),
    value: text(form, "value"),
  };
  const result = await createOrder(await getDb(), session.userId, input);
  if (!result.ok) return { error: result.error, prohibited: result.prohibited, saved: false, values: input };
  redirect(`/${locale}/account/orders/${result.id}`);
}

export async function setOtpAction(_prev: OrderFormState, form: FormData): Promise<OrderFormState> {
  const locale = resolveLocale(text(form, "locale"));
  const id = text(form, "orderId");
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account/orders/${id}`);
  const otp = text(form, "otp");
  const result = await setOrderOtp(await getDb(), session.userId, id, otp);
  if (!result.ok) {
    return { error: result.error === "errRequired" ? "orderOtpLocked" : result.error, saved: false, values: { otp } };
  }
  revalidatePath(`/${locale}/account/orders/${id}`);
  return { error: null, saved: true, values: { otp: otp.trim() } };
}
