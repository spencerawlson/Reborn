/**
 * Admin alerts for new incoming orders (Shop & ship pre-alerts).
 *
 * Two channels, both best-effort and both configured only through env:
 * - Email via Resend to every address in ADMIN_EMAILS.
 * - WhatsApp via the WhatsApp Business Cloud API to WHATSAPP_TO.
 *
 * If a channel is not configured, it is silently skipped. A sending
 * failure never fails the order itself — the alert is a side effect,
 * and the order already succeeded before this runs.
 *
 * Alerts are English-only: the founder is the sole recipient.
 */

export interface OrderAlertDetails {
  trackingCode: string;
  warehouse: string;
  store: string;
  orderNumber: string | null;
  trackingNumber: string | null;
  description: string | null;
  /** Cents, as stored. */
  declaredValueMinor: bigint | null;
  customerName: string;
  suiteCode: string | null;
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number }>;

const defaultFetch: FetchImpl = (url, init) =>
  fetch(url, init).then((r) => ({ ok: r.ok, status: r.status }));

export function formatDollars(minor: bigint | null): string | null {
  if (minor === null) return null;
  return `${minor / 100n}.${(minor % 100n).toString().padStart(2, "0")}`;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** WhatsApp alert recipients: comma-separated, same shape as ADMIN_EMAILS.
 *  Formatting is normalized (spaces, dashes, parentheses stripped) so a
 *  number typed as "+509 3217 1628" still reaches the API as "+50932171628". */
export function whatsappRecipients(): string[] {
  return (process.env.WHATSAPP_TO ?? "")
    .split(",")
    .map((s) => s.trim().replace(/[\s()-]/g, ""))
    .filter(Boolean);
}

function adminLink(): string | null {
  const base = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/admin` : null;
}

export function buildOrderEmail(
  to: string[],
  d: OrderAlertDetails,
): { to: string[]; subject: string; text: string } {
  const value = formatDollars(d.declaredValueMinor);
  const lines = [
    `New order ${d.trackingCode}`,
    ``,
    `Customer: ${d.customerName}`,
    `Suite: ${d.suiteCode ?? "—"}`,
    `Warehouse: ${d.warehouse}`,
    `Store: ${d.store}`,
    `Order number: ${d.orderNumber ?? "—"}`,
    `Tracking number: ${d.trackingNumber ?? "—"}`,
    `Description: ${d.description ?? "—"}`,
    `Declared value: ${value === null ? "—" : `$${value}`}`,
  ];
  const link = adminLink();
  lines.push(``, link ? `View it in the admin dashboard: ${link}` : `Open the admin dashboard to see it.`);
  return {
    to,
    subject: `New order ${d.trackingCode} — ${d.store} (${d.warehouse})`,
    text: lines.join("\n"),
  };
}

export function buildOrderWhatsApp(d: OrderAlertDetails, template: string, to: string): Record<string, unknown> {
  // Template body placeholders, in order: customer, suite, warehouse,
  // store, tracking code. The template itself is created and approved
  // in the Meta dashboard; this only fills its parameters.
  const params = [d.customerName, d.suiteCode ?? "—", d.warehouse, d.store, d.trackingCode];
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };
}

export async function sendOrderEmail(
  fetchImpl: FetchImpl,
  to: string[],
  d: OrderAlertDetails,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY ?? "";
  if (!key || to.length === 0) return false;
  try {
    const email = buildOrderEmail(to, d);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM ?? "ShipItAyiti <onboarding@resend.dev>",
        to: email.to,
        subject: email.subject,
        text: email.text,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendOrderWhatsApp(
  fetchImpl: FetchImpl,
  d: OrderAlertDetails,
): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN ?? "";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  const template = process.env.WHATSAPP_TEMPLATE ?? "";
  const recipients = whatsappRecipients();
  if (!token || !phoneId || !template || recipients.length === 0) return false;
  try {
    const results = await Promise.allSettled(
      recipients.map((to) =>
        fetchImpl(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildOrderWhatsApp(d, template, to)),
          signal: AbortSignal.timeout(5000),
        }),
      ),
    );
    return results.some((r) => r.status === "fulfilled" && r.value.ok);
  } catch {
    return false;
  }
}

/**
 * Fire both configured alerts for a newly created order. Never throws:
 * callers await it, but a missing config or a provider failure only
 * means the alert does not go out — the order itself already succeeded.
 */
export async function notifyNewOrder(
  d: OrderAlertDetails,
  fetchImpl: FetchImpl = defaultFetch,
): Promise<void> {
  try {
    const jobs: Promise<boolean>[] = [];
    const emails = adminEmails();
    if (emails.length > 0 && process.env.RESEND_API_KEY) jobs.push(sendOrderEmail(fetchImpl, emails, d));
    if (
      process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      whatsappRecipients().length > 0 &&
      process.env.WHATSAPP_TEMPLATE
    ) {
      jobs.push(sendOrderWhatsApp(fetchImpl, d));
    }
    await Promise.allSettled(jobs);
  } catch (error) {
    console.error("[notify] order alert failed", error);
  }
}
