/**
 * SAMPLE network and prices for the public preview only. Not the real
 * price list — that comes from the founder and moves into the database
 * (Phase 2b, versioned prices). Every screen using this data says so.
 */
import type { DictionaryKey } from "../i18n/index";

export const ORIGINS = [
  { code: "YUL", city: "Montreal" },
  { code: "MIA", city: "Miami" },
] as const;

export const DESTINATIONS = [
  { code: "PAP", city: "Port-au-Prince" },
  { code: "CAP", city: "Cap-Haïtien" },
] as const;

export type OriginCode = (typeof ORIGINS)[number]["code"];
export type DestinationCode = (typeof DESTINATIONS)[number]["code"];

export const SIZES = [
  { code: "small", label: "sizeSmallBox", dims: "40 × 30 × 30 cm" },
  { code: "medium", label: "sizeMediumBox", dims: "50 × 40 × 40 cm" },
  { code: "large", label: "sizeLargeBox", dims: "60 × 50 × 50 cm" },
  { code: "barrel", label: "sizeBarrel", dims: "58 × 89 cm" },
] as const satisfies readonly { code: string; label: DictionaryKey; dims: string }[];

export type SizeCode = (typeof SIZES)[number]["code"];

export const ZONES = [
  { code: "metro", label: "zoneMetro", doorMinor: 0n },
  { code: "city", label: "zoneCity", doorMinor: 1500n },
  { code: "remote", label: "zoneRemote", doorMinor: 3000n },
] as const satisfies readonly { code: string; label: DictionaryKey; doorMinor: bigint }[];

export type ZoneCode = (typeof ZONES)[number]["code"];

// Sample base prices in USD cents, by origin and size. Same to PAP and CAP.
const BASE: Record<OriginCode, Record<SizeCode, bigint>> = {
  MIA: { small: 4500n, medium: 6500n, large: 8500n, barrel: 12500n },
  YUL: { small: 5500n, medium: 7900n, large: 10500n, barrel: 15500n },
};

// Sample online-store forwarding rate (USD cents per pound).
export const SAMPLE_SHOP_RATE_PER_LB = 400n;

/** Weight in pounds rounds up to the next whole pound, minimum 1 lb. */
export function sampleShopEstimate(pounds: number): bigint {
  const billable = Number.isFinite(pounds) && pounds > 0 ? Math.ceil(pounds) : 1;
  return BigInt(billable) * SAMPLE_SHOP_RATE_PER_LB;
}

export function sampleEstimate(args: {
  origin: OriginCode;
  size: SizeCode;
  delivery: "door" | "pickup";
  zone: ZoneCode;
}): bigint {
  const base = BASE[args.origin][args.size];
  if (args.delivery === "pickup") return base;
  return base + ZONES.find((z) => z.code === args.zone)!.doorMinor;
}
