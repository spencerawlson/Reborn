/**
 * Commission engine + double-entry ledger postings.
 *
 * Rules (from the business brief):
 * - Commission applies to the product subtotal only — never to shipping
 *   or taxes.
 * - The rate is configurable by admin (default 10% = 1000 basis points)
 *   and the rate in force at sale time is locked onto the order forever.
 * - Commission rounds half up to the nearest minor unit.
 * - Every business event posts a balanced group: sum(debits) = sum(credits).
 *   `assertBalanced` refuses anything else — an unbalanced posting is a bug.
 *   Postgres enforces the same invariant again at commit (migration 0002).
 *
 * Producer money lives in two accounts so balances are pure ledger sums:
 * - producer_pending   — credited at sale; not yet withdrawable.
 * - producer_available — credited by a clearing posting; payouts draw on it.
 * "Paid" is the sum of payout debits against producer_available.
 */

import { roundHalfUp } from "../money/index";

export const DEFAULT_COMMISSION_BPS = 1000; // 10%

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

export type LedgerAccount =
  | "cash"
  | "producer_pending"
  | "producer_available"
  | "commission_revenue"
  | "processor_fees"
  | "shipping_payable"
  | "tax_payable";

export type ProducerAccount = "producer_pending" | "producer_available";

export interface LedgerLine {
  account: LedgerAccount;
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
    if (line.debitMinor === 0n && line.creditMinor === 0n) {
      throw new Error("a ledger line must move a non-zero amount");
    }
    debits += line.debitMinor;
    credits += line.creditMinor;
  }
  if (debits !== credits || debits === 0n) {
    throw new Error(`unbalanced ledger group: debits ${debits} != credits ${credits}`);
  }
}

function debit(account: LedgerAccount, amount: bigint): LedgerLine[] {
  return amount > 0n ? [{ account, debitMinor: amount, creditMinor: 0n }] : [];
}

function credit(account: LedgerAccount, amount: bigint): LedgerLine[] {
  return amount > 0n ? [{ account, debitMinor: 0n, creditMinor: amount }] : [];
}

function balanced(group: LedgerGroup): LedgerGroup {
  assertBalanced(group);
  return group;
}

/**
 * Postings for a paid order. Cash in = subtotal + shipping + tax.
 * The producer's share lands in producer_pending; the platform keeps the
 * commission; shipping and tax are held as payables, not revenue.
 * Zero-amount lines are omitted.
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
  if (shippingMinor < 0n || taxMinor < 0n) throw new Error("shipping and tax must not be negative");
  return balanced({
    entryGroup,
    currency,
    description: "order sale",
    lines: [
      ...debit("cash", subtotalMinor + shippingMinor + taxMinor),
      ...credit("producer_pending", commission.producerMinor),
      ...credit("commission_revenue", commission.commissionMinor),
      ...credit("shipping_payable", shippingMinor),
      ...credit("tax_payable", taxMinor),
    ],
  });
}

/**
 * Postings for the payment processor's fee on a charge. The platform bears
 * the fee: it is an expense, and the cash never arrives.
 */
export function postProcessorFee(args: {
  entryGroup: string;
  currency: string;
  feeMinor: bigint;
}): LedgerGroup {
  if (args.feeMinor <= 0n) throw new Error("processor fee must be positive");
  return balanced({
    entryGroup: args.entryGroup,
    currency: args.currency,
    description: "payment processor fee",
    lines: [...debit("processor_fees", args.feeMinor), ...credit("cash", args.feeMinor)],
  });
}

/**
 * Postings that clear a producer's share for withdrawal: pending down,
 * available up. Run once the order is fulfilled and the admin-configured
 * clearing window has passed.
 */
export function postClearing(args: {
  entryGroup: string;
  currency: string;
  amountMinor: bigint;
}): LedgerGroup {
  if (args.amountMinor <= 0n) throw new Error("clearing amount must be positive");
  return balanced({
    entryGroup: args.entryGroup,
    currency: args.currency,
    description: "producer funds cleared",
    lines: [
      ...debit("producer_pending", args.amountMinor),
      ...credit("producer_available", args.amountMinor),
    ],
  });
}

/**
 * Postings for a completed payout to a producer's verified MonCash
 * account: producer_available down, cash down, same amount (in the
 * ledger currency; the HTG amount and FX rate live on the payout row).
 */
export function postPayout(args: {
  entryGroup: string;
  currency: string;
  amountMinor: bigint;
}): LedgerGroup {
  if (args.amountMinor <= 0n) throw new Error("payout amount must be positive");
  return balanced({
    entryGroup: args.entryGroup,
    currency: args.currency,
    description: "producer payout",
    lines: [
      ...debit("producer_available", args.amountMinor),
      ...credit("cash", args.amountMinor),
    ],
  });
}

export interface OrderAmounts {
  productMinor: bigint;
  shippingMinor: bigint;
  taxMinor: bigint;
}

export interface RefundResult {
  group: LedgerGroup;
  /** Commission reversed by this refund; store it on the refund row. */
  commissionRefundMinor: bigint;
}

const ZERO_REFUNDED: OrderAmounts & { commissionMinor: bigint } = {
  productMinor: 0n,
  shippingMinor: 0n,
  taxMinor: 0n,
  commissionMinor: 0n,
};

/**
 * Postings for a full or partial refund, reversing each component of the
 * original sale against the account it was booked to.
 *
 * The commission reversed is the cumulative proportional share minus what
 * earlier refunds already reversed, so any sequence of partial refunds
 * that adds up to the full order reverses exactly the original commission
 * — no rounding drift. The platform does not keep commission on refunded
 * sales.
 *
 * `producerAccount` is where the producer's share currently sits: pending
 * before clearing, available after. Refunding after a payout drives
 * producer_available negative — a clawback the admin must resolve.
 */
export function postRefund(args: {
  entryGroup: string;
  currency: string;
  sale: { subtotalMinor: bigint; shippingMinor: bigint; taxMinor: bigint; commissionMinor: bigint };
  refund: OrderAmounts;
  alreadyRefunded?: OrderAmounts & { commissionMinor: bigint };
  producerAccount: ProducerAccount;
}): RefundResult {
  const { entryGroup, currency, sale, refund, producerAccount } = args;
  const prior = args.alreadyRefunded ?? ZERO_REFUNDED;

  for (const amount of [refund.productMinor, refund.shippingMinor, refund.taxMinor]) {
    if (amount < 0n) throw new Error("refund components must not be negative");
  }
  const totalMinor = refund.productMinor + refund.shippingMinor + refund.taxMinor;
  if (totalMinor === 0n) throw new Error("refund amount must be positive");
  if (prior.productMinor + refund.productMinor > sale.subtotalMinor) {
    throw new Error("refund exceeds the product subtotal");
  }
  if (prior.shippingMinor + refund.shippingMinor > sale.shippingMinor) {
    throw new Error("refund exceeds the shipping charged");
  }
  if (prior.taxMinor + refund.taxMinor > sale.taxMinor) {
    throw new Error("refund exceeds the tax charged");
  }

  const cumulativeProduct = prior.productMinor + refund.productMinor;
  const cumulativeCommission =
    sale.subtotalMinor === 0n
      ? 0n
      : roundHalfUp(cumulativeProduct * sale.commissionMinor, sale.subtotalMinor);
  const commissionRefundMinor = cumulativeCommission - prior.commissionMinor;
  if (commissionRefundMinor < 0n || commissionRefundMinor > refund.productMinor) {
    throw new Error("alreadyRefunded is inconsistent with the sale");
  }

  const group = balanced({
    entryGroup,
    currency,
    description: "order refund",
    lines: [
      ...credit("cash", totalMinor),
      ...debit(producerAccount, refund.productMinor - commissionRefundMinor),
      ...debit("commission_revenue", commissionRefundMinor),
      ...debit("shipping_payable", refund.shippingMinor),
      ...debit("tax_payable", refund.taxMinor),
    ],
  });
  return { group, commissionRefundMinor };
}
