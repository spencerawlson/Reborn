/**
 * Admin dashboard figures. Phase 1 returns clearly-labeled mock aggregates
 * so the dashboard shell renders and the layout is proven; Phase 6 wires
 * every figure to real ledger/order queries. Nothing here is presented as
 * real business data.
 */

export interface AdminStats {
  totalSalesMinor: bigint;
  commissionRevenueMinor: bigint;
  producerOwedMinor: bigint;
  pendingWithdrawalsMinor: bigint;
  pendingWithdrawalsCount: number;
  activeOrdersCount: number;
  producersCount: number;
  refundsCount: number;
  currency: string;
  mock: true;
}

export async function getAdminStats(): Promise<AdminStats> {
  return {
    totalSalesMinor: 0n,
    commissionRevenueMinor: 0n,
    producerOwedMinor: 0n,
    pendingWithdrawalsMinor: 0n,
    pendingWithdrawalsCount: 0,
    activeOrdersCount: 0,
    producersCount: 0,
    refundsCount: 0,
    currency: "USD",
    mock: true,
  };
}
