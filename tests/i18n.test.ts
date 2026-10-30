import { describe, expect, it } from "vitest";
import { detectLocale } from "../src/lib/i18n/index";

describe("detectLocale", () => {
  it("prefers a saved choice", () => {
    expect(detectLocale("fr-CA,fr;q=0.9", "ht")).toBe("ht");
  });
  it("uses the first supported browser language", () => {
    expect(detectLocale("fr-CA,fr;q=0.9,en;q=0.8", null)).toBe("fr");
    expect(detectLocale("es-ES,ht;q=0.9", null)).toBe("ht");
  });
  it("falls back to English", () => {
    expect(detectLocale(null, undefined)).toBe("en");
    expect(detectLocale("de-DE", "xx")).toBe("en");
  });
});
