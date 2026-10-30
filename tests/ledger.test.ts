import { describe, expect, it } from "vitest";
import {
  assertBalanced,
  computeCommission,
  DEFAULT_COMMISSION_BPS,
  postOrderSale,
  postPayout,
  postRefund,
} from "../src/lib/ledger/index";

function total(lines: { debitMinor: bigint; creditMinor: bigint }[], side: "debitMinor" | "creditMinor") {
  return lines.reduce((sum, line) => sum + line[side], 0n);
}

describe("computeCommission", () => {
  it("takes the default 5% of the subtotal only", () => {
    const result = computeCommission(10000n, DEFAULT_COMMISSION_BPS);
    expect(result.commissionMinor).toBe(500n);
    expect(result.producerMinor).toBe(9500n);
  });

  it("rounds half up to the nearest minor unit", () => {
    // $3.33 at 5% = 16.65 minor units -> 17.
    const result = computeCommission(333n, 500);
    expect(result.commissionMinor).toBe(17n);
    expect(result.producerMinor).toBe(316n);
  });

  it("keeps historical rates independent", () => {
    expect(computeCommission(10000n, 500).commissionMinor).toBe(500n);
    expect(computeCommission(10000n, 1000).commissionMinor).toBe(1000n);
  });

  it("handles zero and rejects bad input", () => {
    expect(computeCommission(0n, 500).commissionMinor).toBe(0n);
    expect(() => computeCommission(-1n, 500)).toThrow();
    expect(() => computeCommission(100n, 10001)).toThrow();
    expect(() => computeCommission(100n, -1)).toThrow();
  });
});

describe("postOrderSale", () => {
  it("posts a balanced sale with shipping and tax as payables, not revenue", () => {
    const commission = computeCommission(10000n, 500);
    const group = postOrderSale({
      entryGroup: "test-group",
      currency: "USD",
      subtotalMinor: 10000n,
      shippingMinor: 1500n,
      taxMinor: 800n,
      commission,
    });
    expect(total(group.lines, "debitMinor")).toBe(12300n);
    expect(total(group.lines, "creditMinor")).toBe(12300n);
    const byAccount = Object.fromEntries(group.lines.map((l) => [l.account, l]));
    expect(byAccount.cash.debitMinor).toBe(12300n);
    expect(byAccount.producer_payable.creditMinor).toBe(9500n);
    expect(byAccount.commission_revenue.creditMinor).toBe(500n);
    expect(byAccount.shipping_payable.creditMinor).toBe(1500n);
    expect(byAccount.tax_payable.creditMinor).toBe(800n);
  });

  it("omits zero shipping/tax lines and stays balanced", () => {
    const commission = computeCommission(10000n, 500);
    const group = postOrderSale({
      entryGroup: "test-group",
      currency: "USD",
      subtotalMinor: 10000n,
      shippingMinor: 0n,
      taxMinor: 0n,
      commission,
    });
    expect(total(group.lines, "debitMinor")).toBe(total(group.lines, "creditMinor"));
    expect(group.lines.find((l) => l.account === "shipping_payable")).toBeUndefined();
  });

  it("refuses a commission computed for another subtotal", () => {
    const commission = computeCommission(9999n, 500);
    expect(() =>
      postOrderSale({
        entryGroup: "test-group",
        currency: "USD",
        subtotalMinor: 10000n,
        shippingMinor: 0n,
        taxMinor: 0n,
        commission,
      }),
    ).toThrow();
  });
});

describe("postPayout", () => {
  it("moves the same amount out of producer payable and cash", () => {
    const group = postPayout({ entryGroup: "payout", currency: "USD", amountMinor: 9500n });
    expect(total(group.lines, "debitMinor")).toBe(9500n);
    expect(total(group.lines, "creditMinor")).toBe(9500n);
    expect(() => postPayout({ entryGroup: "p", currency: "USD", amountMinor: 0n })).toThrow();
  });
});

describe("postRefund", () => {
  it("reverses the sale and does not keep commission on refunded sales", () => {
    const group = postRefund({
      entryGroup: "refund",
      currency: "USD",
      refundMinor: 10000n,
      commissionMinor: 500n,
    });
    expect(total(group.lines, "debitMinor")).toBe(10000n);
    expect(total(group.lines, "creditMinor")).toBe(10000n);
    const byAccount = Object.fromEntries(group.lines.map((l) => [l.account, l]));
    expect(byAccount.cash.creditMinor).toBe(10000n);
    expect(byAccount.producer_payable.debitMinor).toBe(9500n);
    expect(byAccount.commission_revenue.debitMinor).toBe(500n);
  });
});

describe("assertBalanced", () => {
  it("rejects unbalanced groups and dual-sided lines", () => {
    expect(() =>
      assertBalanced({
        entryGroup: "x",
        currency: "USD",
        description: "bad",
        lines: [
          { account: "cash", debitMinor: 100n, creditMinor: 0n },
          { account: "commission_revenue", debitMinor: 0n, creditMinor: 99n },
        ],
      }),
    ).toThrow("unbalanced");
    expect(() =>
      assertBalanced({
        entryGroup: "x",
        currency: "USD",
        description: "bad",
        lines: [{ account: "cash", debitMinor: 100n, creditMinor: 100n }],
      }),
    ).toThrow();
  });
});
