import { describe, expect, it } from "vitest";
import { convertMinor } from "../src/lib/money/index";
import {
  getPaymentProvider,
  getPayoutProvider,
  liveMoneyEnabled,
  mockMoncashProvider,
  mockPaymentProvider,
} from "../src/lib/providers/index";
import { getSession } from "../src/lib/auth/session";

describe("live-money switch", () => {
  it("returns mocks unless LIVE_PAYMENTS_ENABLED is exactly 'true'", () => {
    for (const value of [undefined, "", "false", "1", "TRUE", "true "]) {
      const env = { LIVE_PAYMENTS_ENABLED: value };
      expect(liveMoneyEnabled(env)).toBe(false);
      expect(getPaymentProvider(env)).toBe(mockPaymentProvider);
      expect(getPayoutProvider(env)).toBe(mockMoncashProvider);
    }
  });

  it("refuses when switched on, because no live provider is approved", () => {
    const env = { LIVE_PAYMENTS_ENABLED: "true" };
    expect(() => getPaymentProvider(env)).toThrow("no live payment provider");
    expect(() => getPayoutProvider(env)).toThrow("no live payout provider");
  });
});

describe("getSession", () => {
  it("has no session by default", async () => {
    expect(await getSession({})).toBeNull();
  });

  it("allows the admin preview only outside production", async () => {
    expect((await getSession({ ADMIN_DEV_PREVIEW: "true", NODE_ENV: "development" }))?.roles).toEqual(["admin"]);
    expect(await getSession({ ADMIN_DEV_PREVIEW: "true", NODE_ENV: "production" })).toBeNull();
  });
});

describe("convertMinor", () => {
  it("converts at an exact decimal rate, rounding half up", () => {
    expect(convertMinor(9000n, "131.25")).toBe(1181250n);
    expect(convertMinor(1n, "0.5")).toBe(1n);
    expect(convertMinor(1n, "0.4")).toBe(0n);
    expect(convertMinor(12345n, "131.2512345678")).toBe(1620296n); // 1620296.49
  });

  it("rejects malformed and zero rates", () => {
    for (const rate of ["", "abc", "-1", "1e3", "1.", "0", "0.000"]) {
      expect(() => convertMinor(100n, rate)).toThrow();
    }
  });
});
