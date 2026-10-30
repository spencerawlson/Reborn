import { describe, expect, it } from "vitest";
import {
  assertBalanced,
  computeCommission,
  DEFAULT_COMMISSION_BPS,
  postClearing,
  postOrderSale,
  postPayout,
  postProcessorFee,
  postRefund,
  type LedgerGroup,
} from "../src/lib/ledger/index";

function total(lines: { debitMinor: bigint; creditMinor: bigint }[], side: "debitMinor" | "creditMinor") {
  return lines.reduce((sum, line) => sum + line[side], 0n);
}

function byAccount(group: LedgerGroup) {
  return Object.fromEntries(group.lines.map((l) => [l.account, l]));
}

// $100.00 subtotal, $15.00 shipping, $8.00 tax, 10% commission.
const sale = { subtotalMinor: 10000n, shippingMinor: 1500n, taxMinor: 800n, commissionMinor: 1000n };

describe("computeCommission", () => {
  it("takes the default 10% of the subtotal only", () => {
    expect(DEFAULT_COMMISSION_BPS).toBe(1000);
    const result = computeCommission(10000n, DEFAULT_COMMISSION_BPS);
    expect(result.commissionMinor).toBe(1000n);
    expect(result.producerMinor).toBe(9000n);
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
    expect(computeCommission(0n, 1000).commissionMinor).toBe(0n);
    expect(() => computeCommission(-1n, 1000)).toThrow();
    expect(() => computeCommission(100n, 10001)).toThrow();
    expect(() => computeCommission(100n, -1)).toThrow();
    expect(() => computeCommission(100n, 2.5)).toThrow();
  });
});

describe("postOrderSale", () => {
  it("posts a balanced sale into producer_pending, with shipping and tax as payables", () => {
    const group = postOrderSale({
      entryGroup: "sale",
      currency: "USD",
      subtotalMinor: 10000n,
      shippingMinor: 1500n,
      taxMinor: 800n,
      commission: computeCommission(10000n, 1000),
    });
    expect(total(group.lines, "debitMinor")).toBe(12300n);
    expect(total(group.lines, "creditMinor")).toBe(12300n);
    const a = byAccount(group);
    expect(a.cash.debitMinor).toBe(12300n);
    expect(a.producer_pending.creditMinor).toBe(9000n);
    expect(a.commission_revenue.creditMinor).toBe(1000n);
    expect(a.shipping_payable.creditMinor).toBe(1500n);
    expect(a.tax_payable.creditMinor).toBe(800n);
    expect(a.producer_available).toBeUndefined();
  });

  it("omits zero lines and stays balanced", () => {
    const group = postOrderSale({
      entryGroup: "sale",
      currency: "USD",
      subtotalMinor: 10000n,
      shippingMinor: 0n,
      taxMinor: 0n,
      commission: computeCommission(10000n, 0),
    });
    expect(group.lines.map((l) => l.account)).toEqual(["cash", "producer_pending"]);
  });

  it("refuses a commission computed for another subtotal", () => {
    expect(() =>
      postOrderSale({
        entryGroup: "sale",
        currency: "USD",
        subtotalMinor: 10000n,
        shippingMinor: 0n,
        taxMinor: 0n,
        commission: computeCommission(9999n, 1000),
      }),
    ).toThrow();
  });
});

describe("postProcessorFee / postClearing / postPayout", () => {
  it("books the processor fee as a platform expense", () => {
    const a = byAccount(postProcessorFee({ entryGroup: "fee", currency: "USD", feeMinor: 387n }));
    expect(a.processor_fees.debitMinor).toBe(387n);
    expect(a.cash.creditMinor).toBe(387n);
  });

  it("clears pending into available", () => {
    const a = byAccount(postClearing({ entryGroup: "clear", currency: "USD", amountMinor: 9000n }));
    expect(a.producer_pending.debitMinor).toBe(9000n);
    expect(a.producer_available.creditMinor).toBe(9000n);
  });

  it("pays out from available only", () => {
    const a = byAccount(postPayout({ entryGroup: "payout", currency: "USD", amountMinor: 9000n }));
    expect(a.producer_available.debitMinor).toBe(9000n);
    expect(a.cash.creditMinor).toBe(9000n);
    expect(a.producer_pending).toBeUndefined();
  });

  it("rejects non-positive amounts", () => {
    expect(() => postProcessorFee({ entryGroup: "f", currency: "USD", feeMinor: 0n })).toThrow();
    expect(() => postClearing({ entryGroup: "c", currency: "USD", amountMinor: 0n })).toThrow();
    expect(() => postPayout({ entryGroup: "p", currency: "USD", amountMinor: 0n })).toThrow();
  });
});

describe("postRefund", () => {
  it("reverses a full refund component by component", () => {
    const { group, commissionRefundMinor } = postRefund({
      entryGroup: "refund",
      currency: "USD",
      sale,
      refund: { productMinor: 10000n, shippingMinor: 1500n, taxMinor: 800n },
      producerAccount: "producer_pending",
    });
    expect(commissionRefundMinor).toBe(1000n);
    const a = byAccount(group);
    expect(a.cash.creditMinor).toBe(12300n);
    // The producer gives back only their share — not shipping or tax.
    expect(a.producer_pending.debitMinor).toBe(9000n);
    expect(a.commission_revenue.debitMinor).toBe(1000n);
    expect(a.shipping_payable.debitMinor).toBe(1500n);
    expect(a.tax_payable.debitMinor).toBe(800n);
  });

  it("draws on producer_available once funds have cleared", () => {
    const { group } = postRefund({
      entryGroup: "refund",
      currency: "USD",
      sale,
      refund: { productMinor: 10000n, shippingMinor: 0n, taxMinor: 0n },
      producerAccount: "producer_available",
    });
    expect(byAccount(group).producer_available.debitMinor).toBe(9000n);
  });

  it("partial refunds reverse exactly the original commission in total", () => {
    // $3.33 at 5% -> commission 17. Refund in three uneven pieces.
    const small = { subtotalMinor: 333n, shippingMinor: 0n, taxMinor: 0n, commissionMinor: 17n };
    const pieces = [100n, 111n, 122n];
    const refunded = { productMinor: 0n, shippingMinor: 0n, taxMinor: 0n, commissionMinor: 0n };
    for (const productMinor of pieces) {
      const { commissionRefundMinor } = postRefund({
        entryGroup: "refund",
        currency: "USD",
        sale: small,
        refund: { productMinor, shippingMinor: 0n, taxMinor: 0n },
        alreadyRefunded: refunded,
        producerAccount: "producer_pending",
      });
      refunded.productMinor += productMinor;
      refunded.commissionMinor += commissionRefundMinor;
    }
    expect(refunded.productMinor).toBe(333n);
    expect(refunded.commissionMinor).toBe(17n);
  });

  it("refuses refunds beyond what was charged", () => {
    const base = { entryGroup: "r", currency: "USD", sale, producerAccount: "producer_pending" as const };
    expect(() => postRefund({ ...base, refund: { productMinor: 10001n, shippingMinor: 0n, taxMinor: 0n } })).toThrow("subtotal");
    expect(() => postRefund({ ...base, refund: { productMinor: 0n, shippingMinor: 1501n, taxMinor: 0n } })).toThrow("shipping");
    expect(() => postRefund({ ...base, refund: { productMinor: 0n, shippingMinor: 0n, taxMinor: 801n } })).toThrow("tax");
    expect(() =>
      postRefund({
        ...base,
        refund: { productMinor: 5000n, shippingMinor: 0n, taxMinor: 0n },
        alreadyRefunded: { productMinor: 6000n, shippingMinor: 0n, taxMinor: 0n, commissionMinor: 600n },
      }),
    ).toThrow("subtotal");
    expect(() => postRefund({ ...base, refund: { productMinor: 0n, shippingMinor: 0n, taxMinor: 0n } })).toThrow("positive");
  });

  it("allows a shipping-only refund with no commission reversal", () => {
    const { group, commissionRefundMinor } = postRefund({
      entryGroup: "refund",
      currency: "USD",
      sale,
      refund: { productMinor: 0n, shippingMinor: 1500n, taxMinor: 0n },
      producerAccount: "producer_pending",
    });
    expect(commissionRefundMinor).toBe(0n);
    expect(group.lines.map((l) => l.account)).toEqual(["cash", "shipping_payable"]);
  });
});

describe("assertBalanced", () => {
  const bad = (lines: LedgerGroup["lines"]) => () =>
    assertBalanced({ entryGroup: "x", currency: "USD", description: "bad", lines });

  it("rejects unbalanced groups, dual-sided lines, and zero lines", () => {
    expect(
      bad([
        { account: "cash", debitMinor: 100n, creditMinor: 0n },
        { account: "commission_revenue", debitMinor: 0n, creditMinor: 99n },
      ]),
    ).toThrow("unbalanced");
    expect(bad([{ account: "cash", debitMinor: 100n, creditMinor: 100n }])).toThrow("never both");
    expect(bad([{ account: "cash", debitMinor: 0n, creditMinor: 0n }])).toThrow("non-zero");
  });
});
