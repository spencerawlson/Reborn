/**
 * The home page tool's tabs. A plain module (not "use client") so the
 * server page can validate ?tab= and the client card can render the tabs.
 */
export const ESTIMATOR_TABS = [
  { key: "ship", label: "navShip" },
  { key: "shop", label: "tabShop" },
  { key: "track", label: "navTrack" },
] as const;

export type EstimatorTab = (typeof ESTIMATOR_TABS)[number]["key"];

export function isEstimatorTab(value: string | undefined): value is EstimatorTab {
  return ESTIMATOR_TABS.some((tab) => tab.key === value);
}
