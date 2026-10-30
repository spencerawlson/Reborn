/**
 * Commission engine + double-entry ledger postings.
 *
 * Rules (from the business brief):
 * - Commission applies to the product subtotal only — never to shipping
 *   or taxes.
 * - The rate is configurable by admin (default 5% = 500 basis points) and
 *   the rate in force at sale time is locked onto the order forever.
 * - Commission rounds half up to the nearest minor unit.
 * - Every business event posts a balanced group: sum(debits) = sum(credits).
 *   `assertBalanced` refuses anything else — an unbalanced posting is a bug.
 */

import { roundHalfUp } from "../money/index";

export const DEFAULT_COMMISSION_BPS = 500; // 5%

export interface CommissionResult {
  subtotalMinor: bigint;
  rateBps: number;
  commissionMinor: bigint;
  producerMinor: bigint;
}

/**
 * Split a product subtotal into the platform commission and the producer
 * share. Throws on negative amounts or out-of-range rates.
 */
export function computeCommission(subtotalMinor: bigint, rateBps: number): CommissionResult {
  if (subtotalMinor < 0n) throw new Error("subtotal must not be negative");
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) {
    throw new Error("rateBps must be an integer between 0 and 10000");
  }
  const commissionMinor = roundHalfUp(subtotalMinor * BigInt(rateBps), 10000n);
  return {
    subtotalMinor,
    rateBps,
    commissionMinor,
    producerMinor: subtotalMinor - commissionMinor,
  };
}

export interface LedgerLine {
  account:
    | "cash"
    | "producer_payable"
    | "commission_revenue"
    | "refunds_payable"
    | "shipping_payable"
    | "tax_payable";
  debitMinor: bigint;
  creditMinor: bigint;
}

export interface LedgerGroup {
  entryGroup: string;
  lines: LedgerLine[];
  currency: string;
  description: string;
}

/** Refuse any group whose debits do not equal its credits. */
export function assertBalanced(group: LedgerGroup): void {
  let debits = 0n;
  let credits = 0n;
  for (const line of group.lines) {
    if (line.debitMinor < 0n || line.creditMinor < 0n) {
      throw new Error("ledger lines must not be negative");
    }
    if (line.debitMinor !== 0n && line.creditMinor !== 0n) {
      throw new Error("a ledger line is either a debit or a credit, never both");
    }
    debits += line.debitMinor;
    credits += line.creditMinor;
  }
  if (debits !== credits || debits === 0n) {
    throw new Error(`unbalanced ledger group: debits ${debits} != credits ${credits}`);
  }
}

/**
 * Postings for a paid order. Cash in = subtotal + shipping + tax.
 * The producer is owed the subtotal minus commission; the platform keeps
 * the commission; shipping and tax are held as payables, not revenue.
 */
export function postOrderSale(args: {
  entryGroup: string;
  currency: string;
  subtotalMinor: bigint;
  shippingMinor: bigint;
  taxMinor: bigint;
  commission: CommissionResult;
}): LedgerGroup {
  const { entryGroup, currency, subtotalMinor, shippingMinor, taxMinor, commission } = args;
  if (commission.subtotalMinor !== subtotalMinor) {
    throw new Error("commission was computed for a different subtotal");
  }
  const group: LedgerGroup = {
    entryGroup,
    currency,
    description: "order sale",
    lines: [
      {
        account: "cash",
        debitMinor: subtotalMinor + shippingMinor + taxMinor,
        creditMinor: 0n,
      },
      {
        account: "producer_payable",
        debitMinor: 0n,
        creditMinor: commission.producerMinor,
      },
      {
        account: "commission_revenue",
        debitMinor: 0n,
        creditMinor: commission.commissionMinor,
      },
      ...(shippingMinor > 0n
        ? [
            {
              account: "shipping_payable" as const,
              debitMinor: 0n,
              creditMinor: shippingMinor,
            },
          ]
        : []),
      ...(taxMinor > 0n
        ? [
            {
              account: "tax_payable" as const,
              debitMinor: 0n,
              creditMinor: taxMinor,
            },
          ]
        : []),
    ],
  };
  assertBalanced(group);
  return group;
}

/**
 * Postings for a completed payout to a producer's verified MonCash
 * account: producer_payable down, cash down, same amount.
 */
export function postPayout(args: {
  entryGroup: string;
  currency: string;
  amountMinor: bigint;
}): LedgerGroup {
  if (args.amountMinor <= 0n) throw new Error("payout amount must be positive");
  const group: LedgerGroup = {
    entryGroup: args.entryGroup,
    currency: args.currency,
    description: "producer payout",
    lines: [
      { account: "producer_payable", debitMinor: args.amountMinor, creditMinor: 0n },
      { account: "cash", debitMinor: 0n, creditMinor: args.amountMinor },
    ],
  };
  assertBalanced(group);
  return group;
}

/**
 * Postings for a refund: reverse the sale. Cash leaves the platform, the
 * producer payable goes down by the producer share, and the commission
 * revenue goes down by the commission share — the platform does not keep
 * commission on refunded sales.
 */
export function postRefund(args: {
  entryGroup: string;
  currency: string;
  refundMinor: bigint;
  commissionMinor: bigint;
}): LedgerGroup {
  const { entryGroup, currency, refundMinor, commissionMinor } = args;
  if (refundMinor <= 0n) throw new Error("refund amount must be positive");
  if (commissionMinor < 0n || commissionMinor > refundMinor) {
    throw new Error("refund commission share is out of range");
  }
  const group: LedgerGroup = {
    entryGroup,
    currency,
    description: "order refund",
    lines: [
      { account: "cash", debitMinor: 0n, creditMinor: refundMinor },
      {
        account: "producer_payable",
        debitMinor: refundMinor - commissionMinor,
        creditMinor: 0n,
      },
      {
        account: "commission_revenue",
        debitMinor: commissionMinor,
        creditMinor: 0n,
      },
    ],
  };
  assertBalanced(group);
  return group;
}
