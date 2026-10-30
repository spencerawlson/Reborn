/**
 * Decimal-safe money math. All amounts are integer minor units (cents)
 * plus a currency code. Floats never touch money.
 */

/** Round half up to the nearest integer (for minor-unit results). */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("denominator must be positive");
  if (numerator < 0n) throw new Error("money amounts must not be negative");
  // (n + d/2) / d with integer division = round half up.
  return (numerator + denominator / 2n) / denominator;
}

/** Format minor units for display, e.g. 1999 USD -> "$19.99". */
export function formatMoney(minor: bigint, currency: string): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const whole = abs / 100n;
  const cents = abs % 100n;
  const symbol = currency === "USD" ? "$" : currency === "HTG" ? "G" : currency + " ";
  return `${negative ? "-" : ""}${symbol}${whole.toString()}.${cents.toString().padStart(2, "0")}`;
}

/**
 * Convert minor units at an exact decimal rate (quote per one base unit),
 * rounding half up. The rate is a string, as stored in fx_rates.rate, so
 * it never passes through a float. Assumes both currencies use 2-decimal
 * minor units (true for USD, CAD, HTG).
 * e.g. convertMinor(9000n, "131.25") -> 1181250n ($90.00 -> G11,812.50).
 */
export function convertMinor(amountMinor: bigint, rate: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,10}))?$/.exec(rate);
  if (!match) throw new Error(`invalid FX rate: ${rate}`);
  const fraction = match[2] ?? "";
  const scale = 10n ** BigInt(fraction.length);
  const scaledRate = BigInt(match[1] + fraction);
  if (scaledRate === 0n) throw new Error("FX rate must be positive");
  return roundHalfUp(amountMinor * scaledRate, scale);
}

/** Sum minor-unit amounts; throws on currency mismatch. */
export function sumMinor(items: { amountMinor: bigint; currency: string }[]): {
  totalMinor: bigint;
  currency: string;
} {
  if (items.length === 0) return { totalMinor: 0n, currency: "USD" };
  const currency = items[0].currency;
  let total = 0n;
  for (const item of items) {
    if (item.currency !== currency) throw new Error("currency mismatch in sum");
    total += item.amountMinor;
  }
  return { totalMinor: total, currency };
}
