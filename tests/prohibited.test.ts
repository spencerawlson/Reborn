import { describe, expect, it } from "vitest";
import { findProhibited, normalize, PROHIBITED } from "../src/lib/shipping/prohibited";

const blocked = (text: string) => findProhibited(text)?.id ?? null;

describe("prohibited items", () => {
  it("every category has a title, reason, examples and at least one reference in all three languages", () => {
    for (const c of PROHIBITED) {
      for (const locale of ["en", "fr", "ht"] as const) {
        expect(c.title[locale], `${c.id} title ${locale}`).toBeTruthy();
        expect(c.reason[locale], `${c.id} reason ${locale}`).toBeTruthy();
        expect(c.examples[locale], `${c.id} examples ${locale}`).toBeTruthy();
      }
      expect(c.references.length).toBeGreaterThan(0);
      for (const r of c.references) expect(r.url).toMatch(/^https:\/\//);
    }
  });

  it.each([
    ["9mm pistol", "weapons"],
    ["Box of AMMO", "weapons"],
    ["Rifle scope and gun parts", "weapons"],
    ["Pistolet et munitions", "weapons"],
    ["zam afe", "weapons"],
    ["Fireworks for New Year", "explosives"],
    ["feux d’artifice", "explosives"],
    ["petar", "explosives"],
    ["cannabis gummies", "drugs"],
    ["Counterfeit Nike shoes", "counterfeit"],
    ["faux billets", "counterfeit"],
    ["porn DVDs", "obscene"],
    ["Propane tank 20 lb", "hazardous"],
    ["bonbonne de gaz", "hazardous"],
    ["live puppy", "live"],
    ["viande crue", "live"],
    ["DDT powder", "toxic"],
    ["Cash for my mother", "cash"],
    ["lajan kach", "cash"],
  ])("blocks %j as %s", (text, category) => {
    expect(blocked(text)).toBe(category);
  });

  it.each([
    "Phone charger",
    "iPhone 15 with battery",
    "HP ink cartridge",
    "Hot glue gun",
    "Massage gun",
    "Kids water gun",
    "NutriBullet blender",
    "Bullet journal",
    "Cash register",
    "Cashmere sweater",
    "Chia seeds",
    "Money clip",
    "Bug spray",
    "Vanilla essence",
    "Essence de vanille",
    "Pistolet à colle",
    "Gunnar glasses",
    "Magazine subscription",
    "Bal foutbòl",
    "Drogerie skin cream",
    "Plant pot",
  ])("allows %j", (text) => {
    expect(blocked(text)).toBeNull();
  });

  it("normalizes accents, case, and punctuation", () => {
    expect(normalize("Feux d’Artifice!!")).toBe(" feux d'artifice ");
  });
});
