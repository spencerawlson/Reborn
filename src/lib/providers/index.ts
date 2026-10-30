/**
 * Provider interfaces + MOCK implementations.
 *
 * MOCK ONLY. No live money moves here. Real providers (payment processor,
 * MonCash API, carriers) plug into these same interfaces in later phases,
 * and only when LIVE_PAYMENTS_ENABLED is explicitly true AND banking +
 * legal advisers have confirmed the structure is permitted.
 */

export interface PaymentCharge {
  orderId: string;
  amountMinor: bigint;
  currency: string;
  idempotencyKey: string;
}

export interface PaymentResult {
  providerRef: string;
  status: "succeeded" | "failed";
}

export interface PaymentProvider {
  readonly kind: string;
  charge(input: PaymentCharge): Promise<PaymentResult>;
}

export interface PayoutRequest {
  producerId: string;
  moncashAccountNumber: string;
  amountMinor: bigint;
  currency: string;
  idempotencyKey: string;
}

export interface PayoutResult {
  providerRef: string;
  status: "completed" | "failed";
  proofUrl?: string;
}

export interface PayoutProvider {
  readonly kind: string;
  disburse(input: PayoutRequest): Promise<PayoutResult>;
}

export interface ShippingQuoteRequest {
  originCountry: string;
  destinationCountry: string;
  weightKg: number;
}

export interface ShippingQuote {
  providerName: string;
  amountMinor: bigint;
  currency: string;
  estimatedDays: string;
}

export interface ShippingProvider {
  readonly kind: string;
  quote(input: ShippingQuoteRequest): Promise<ShippingQuote[]>;
  createShipment(orderId: string): Promise<{ trackingNumber: string }>;
}

/** In-process idempotency store for mocks only (the DB table owns this in production). */
function mockRef(prefix: string, key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return `${prefix}_mock_${hash.toString(16)}`;
}

export const mockPaymentProvider: PaymentProvider = {
  kind: "mock-payment",
  async charge(input: PaymentCharge): Promise<PaymentResult> {
    if (input.amountMinor <= 0n) return { providerRef: "", status: "failed" };
    // Mock: every well-formed sandbox charge succeeds. No network, no money.
    return { providerRef: mockRef("pay", input.idempotencyKey), status: "succeeded" };
  },
};

export const mockMoncashProvider: PayoutProvider = {
  kind: "mock-moncash",
  async disburse(input: PayoutRequest): Promise<PayoutResult> {
    if (!input.moncashAccountNumber || input.amountMinor <= 0n) {
      return { providerRef: "", status: "failed" };
    }
    return {
      providerRef: mockRef("moncash", input.idempotencyKey),
      status: "completed",
      proofUrl: undefined, // Real proofs attach in Phase 4.
    };
  },
};

export const mockShippingProvider: ShippingProvider = {
  kind: "mock-shipping",
  async quote(input: ShippingQuoteRequest): Promise<ShippingQuote[]> {
    if (input.weightKg <= 0) return [];
    // Flat mock rates by destination region; replaced by carrier APIs later.
    const amountMinor = input.destinationCountry === "HT" ? 1500n : 4500n;
    return [
      {
        providerName: "Mock Carrier (manual)",
        amountMinor,
        currency: "USD",
        estimatedDays: "7–14 days",
      },
    ];
  },
  async createShipment(orderId: string): Promise<{ trackingNumber: string }> {
    return { trackingNumber: `MOCK-${orderId.slice(0, 8).toUpperCase()}` };
  },
};
