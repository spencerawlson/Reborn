import { describe, expect, it } from "vitest";
import { formatMoney, roundHalfUp, sumMinor } from "../src/lib/money/index";

describe("roundHalfUp", () => {
  it("rounds .5 up", () => {
    expect(roundHalfUp(1665n, 100n)).toBe(17n);
    expect(roundHalfUp(1649n, 100n)).toBe(16n);
  });
  it("rejects negative amounts and bad denominators", () => {
    expect(() => roundHalfUp(-1n, 100n)).toThrow();
    expect(() => roundHalfUp(100n, 0n)).toThrow();
  });
});

describe("formatMoney", () => {
  it("formats USD and HTG", () => {
    expect(formatMoney(1999n, "USD")).toBe("$19.99");
    expect(formatMoney(1999n, "HTG")).toBe("G19.99");
    expect(formatMoney(0n, "USD")).toBe("$0.00");
  });
});

describe("sumMinor", () => {
  it("sums same-currency amounts", () => {
    expect(sumMinor([{ amountMinor: 100n, currency: "USD" }])).toEqual({
      totalMinor: 100n,
      currency: "USD",
    });
  });
  it("rejects mixed currencies", () => {
    expect(() =>
      sumMinor([
        { amountMinor: 100n, currency: "USD" },
        { amountMinor: 100n, currency: "HTG" },
      ]),
    ).toThrow("currency mismatch");
  });
});
