/**
 * Order alerts: payload builders and best-effort senders. No network:
 * senders take a fake fetch, and notifyNewOrder skips unconfigured
 * channels without calling fetch at all.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildOrderEmail,
  buildOrderStatusWhatsApp,
  buildOrderWhatsApp,
  formatDollars,
  notifyNewOrder,
  sendOrderEmail,
  sendOrderWhatsApp,
  type OrderAlertDetails,
} from "../src/lib/notify/index";

const details: OrderAlertDetails = {
  trackingCode: "SIA-T00000042",
  warehouse: "MIA",
  store: "Amazon",
  orderNumber: "112-0000000-0000000",
  trackingNumber: "TBA123",
  description: "Phone charger",
  declaredValueMinor: 1999n,
  customerName: "Marie Joseph",
  suiteCode: "SIA-10482",
};

const KEYS = [
  "ADMIN_EMAILS",
  "RESEND_API_KEY",
  "NOTIFY_FROM",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_TO",
  "WHATSAPP_TEMPLATE",
  "SITE_URL",
];
const savedEnv: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("formatDollars", () => {
  it("formats cents without floats", () => {
    expect(formatDollars(1999n)).toBe("19.99");
    expect(formatDollars(500n)).toBe("5.00");
    expect(formatDollars(null)).toBeNull();
  });
});

describe("buildOrderEmail", () => {
  it("carries every order detail", () => {
    const email = buildOrderEmail(["admin@example.test"], details);
    expect(email.subject).toBe("New order SIA-T00000042 — Amazon (MIA)");
    expect(email.to).toEqual(["admin@example.test"]);
    for (const part of [
      "Marie Joseph",
      "SIA-10482",
      "MIA",
      "Amazon",
      "112-0000000-0000000",
      "TBA123",
      "Phone charger",
      "$19.99",
      "SIA-T00000042",
    ]) {
      expect(email.text).toContain(part);
    }
    expect(email.text).toContain("Open the admin dashboard to see it.");
  });

  it("links to the admin dashboard when SITE_URL is set", () => {
    process.env.SITE_URL = "https://ship.example.test/";
    const email = buildOrderEmail(["admin@example.test"], details);
    expect(email.text).toContain("https://ship.example.test/admin");
  });
});

describe("buildOrderWhatsApp", () => {
  it("builds a template payload with the five parameters in order", () => {
    const payload = buildOrderWhatsApp(details, "order_alert", "+50900000000") as any;
    expect(payload.messaging_product).toBe("whatsapp");
    expect(payload.to).toBe("+50900000000");
    expect(payload.type).toBe("template");
    expect(payload.template.name).toBe("order_alert");
    expect(payload.template.language.code).toBe("en_US");
    expect(payload.template.components[0].parameters.map((p: any) => p.text)).toEqual([
      "Marie Joseph",
      "SIA-10482",
      "MIA",
      "Amazon",
      "SIA-T00000042",
    ]);
  });
});

describe("buildOrderStatusWhatsApp", () => {
  it("builds a customer template payload with the four parameters in order", () => {
    const payload = buildOrderStatusWhatsApp(
      { trackingCode: "SIA-T00000042", store: "Amazon", customerName: "Marie Joseph", status: "Received" },
      "order_update",
      "+50900000000",
    ) as any;
    expect(payload.template.name).toBe("order_update");
    expect(payload.template.components[0].parameters.map((p: any) => p.text)).toEqual([
      "Marie Joseph",
      "Amazon",
      "Received",
      "SIA-T00000042",
    ]);
  });
});

describe("senders", () => {
  it("emails via Resend with the bearer key", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const calls: { url: string; init: any }[] = [];
    const ok = await sendOrderEmail(
      async (url, init) => {
        calls.push({ url, init });
        return { ok: true, status: 200 };
      },
      ["admin@example.test"],
      details,
    );
    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.resend.com/emails");
    expect(calls[0].init.headers.Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(calls[0].init.body);
    expect(body.subject).toContain("SIA-T00000042");
    expect(body.to).toEqual(["admin@example.test"]);
  });

  it("returns false when the provider rejects or throws", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    expect(await sendOrderEmail(async () => ({ ok: false, status: 400 }), ["a@b.test"], details)).toBe(false);
    expect(await sendOrderEmail(async () => {
      throw new Error("down");
    }, ["a@b.test"], details)).toBe(false);
  });

  it("skips email when unconfigured", async () => {
    let called = 0;
    expect(
      await sendOrderEmail(
        async () => {
          called++;
          return { ok: true, status: 200 };
        },
        ["a@b.test"],
        details,
      ),
    ).toBe(false);
    expect(called).toBe(0);
  });

  it("whatsapps via the Cloud API with the bearer token", async () => {
    process.env.WHATSAPP_TOKEN = "wa_token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
    process.env.WHATSAPP_TO = "+50900000000";
    process.env.WHATSAPP_TEMPLATE = "order_alert";
    const calls: { url: string; init: any }[] = [];
    const ok = await sendOrderWhatsApp(async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    }, details);
    expect(ok).toBe(true);
    expect(calls[0].url).toBe("https://graph.facebook.com/v21.0/12345/messages");
    expect(calls[0].init.headers.Authorization).toBe("Bearer wa_token");
    const body = JSON.parse(calls[0].init.body);
    expect(body.to).toBe("+50900000000");
    expect(body.template.name).toBe("order_alert");
  });

  it("whatsapps every listed recipient", async () => {
    process.env.WHATSAPP_TOKEN = "wa_token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
    process.env.WHATSAPP_TO = "+50900000000, +50911111111";
    process.env.WHATSAPP_TEMPLATE = "order_alert";
    const calls: { url: string; init: any }[] = [];
    const ok = await sendOrderWhatsApp(async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    }, details);
    expect(ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls.map((c) => JSON.parse(c.init.body).to)).toEqual(["+50900000000", "+50911111111"]);
  });

  it("normalizes recipient formatting", async () => {
    process.env.WHATSAPP_TOKEN = "wa_token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
    process.env.WHATSAPP_TO = "+1 (438) 000-0000, +509 0000 0000";
    process.env.WHATSAPP_TEMPLATE = "order_alert";
    const calls: { url: string; init: any }[] = [];
    await sendOrderWhatsApp(async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200 };
    }, details);
    expect(calls.map((c) => JSON.parse(c.init.body).to)).toEqual(["+14380000000", "+50900000000"]);
  });

  it("skips whatsapp when unconfigured", async () => {
    let called = 0;
    expect(
      await sendOrderWhatsApp(async () => {
        called++;
        return { ok: true, status: 200 };
      }, details),
    ).toBe(false);
    expect(called).toBe(0);
  });
});

describe("notifyNewOrder", () => {
  it("calls nothing when nothing is configured", async () => {
    let called = 0;
    await notifyNewOrder(details, async () => {
      called++;
      return { ok: true, status: 200 };
    });
    expect(called).toBe(0);
  });

  it("emails when only email is configured", async () => {
    process.env.ADMIN_EMAILS = "admin@example.test";
    process.env.RESEND_API_KEY = "re_test_key";
    const urls: string[] = [];
    await notifyNewOrder(details, async (url) => {
      urls.push(url);
      return { ok: true, status: 200 };
    });
    expect(urls).toEqual(["https://api.resend.com/emails"]);
  });

  it("sends both when both are configured", async () => {
    process.env.ADMIN_EMAILS = "admin@example.test";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WHATSAPP_TOKEN = "wa_token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
    process.env.WHATSAPP_TO = "+50900000000";
    process.env.WHATSAPP_TEMPLATE = "order_alert";
    const urls: string[] = [];
    await notifyNewOrder(details, async (url) => {
      urls.push(url);
      return { ok: true, status: 200 };
    });
    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://api.resend.com/emails");
    expect(urls).toContain("https://graph.facebook.com/v21.0/12345/messages");
  });

  it("never throws when a provider fails", async () => {
    process.env.ADMIN_EMAILS = "admin@example.test";
    process.env.RESEND_API_KEY = "re_test_key";
    await expect(
      notifyNewOrder(details, async () => {
        throw new Error("down");
      }),
    ).resolves.toBeUndefined();
  });
});
